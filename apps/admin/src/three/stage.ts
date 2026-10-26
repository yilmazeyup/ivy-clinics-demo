import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

type Vec = [number, number, number];

export type StageOptions = {
  camera: Vec;
  target: Vec;
  /** Where the camera flies in from when the scene mounts. */
  intro: Vec;
  fov?: number;
  minDistance?: number;
  maxDistance?: number;
  /** Narrowest width-to-height ratio at which everything still fits; narrower views zoom out. */
  fitAspect?: number;
};

export type Frame = (time: number, delta: number) => void;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * One WebGL view: renderer, camera, soft studio light, HTML labels and a slow camera sway.
 * Scenes add their meshes to `scene` and register per-frame work with `onFrame`.
 */
export class Stage {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;
  readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  private readonly labels = new CSS2DRenderer();
  private readonly frames = new Set<Frame>();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly resizeObserver: ResizeObserver;
  private readonly visibility: IntersectionObserver;
  private readonly started = performance.now();
  private last = performance.now();
  private raf = 0;
  private visible = true;

  // Camera choreography: a fly-in, then a gentle sway until someone grabs the view.
  private flight: { from: THREE.Vector3; to: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3; start: number; duration: number } | null;
  private readonly sway = { base: new THREE.Spherical(), since: 0, paused: true, resumeAt: 0 };

  private hoverTargets: THREE.Object3D[] = [];
  private hoverHandler: ((object: THREE.Object3D | null) => void) | null = null;
  private hovered: THREE.Object3D | null = null;
  private pointerDirty = false;
  private pointerInside = false;

  private readonly fitAspect: number;

  constructor(private readonly host: HTMLElement, options: StageOptions) {
    this.fitAspect = options.fitAspect ?? 0;
    this.camera = new THREE.PerspectiveCamera(options.fov ?? 30, 1, 0.1, 200);
    this.camera.position.set(...options.intro);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.domElement.className = 'scene-canvas';
    host.appendChild(this.renderer.domElement);

    this.labels.domElement.className = 'scene-labels';
    host.appendChild(this.labels.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    pmrem.dispose();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...options.target);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = options.minDistance ?? 7;
    this.controls.maxDistance = options.maxDistance ?? 26;
    this.controls.minPolarAngle = 0.3;
    this.controls.maxPolarAngle = 1.22;
    this.controls.enabled = false;
    this.controls.addEventListener('start', () => {
      this.sway.paused = true;
      this.flight = null;
    });
    this.controls.addEventListener('end', () => {
      this.sway.resumeAt = performance.now() + 6000;
    });

    const to = new THREE.Vector3(...options.camera);
    const target = new THREE.Vector3(...options.target);
    this.flight = this.reducedMotion
      ? null
      : { from: this.camera.position.clone(), to, fromTarget: target.clone(), toTarget: target, start: performance.now(), duration: 1900 };
    if (this.reducedMotion) {
      this.camera.position.copy(to);
      this.finishFlight();
    }

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerleave', this.onPointerLeave);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.visibility = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
    });
    this.visibility.observe(host);
    this.resize();
    this.raf = requestAnimationFrame(this.loop);
  }

  onFrame(frame: Frame): () => void {
    this.frames.add(frame);
    return () => this.frames.delete(frame);
  }

  /** Floating HTML that follows a point in the scene. */
  label(element: HTMLElement, parent: THREE.Object3D, position: Vec): CSS2DObject {
    const object = new CSS2DObject(element);
    object.position.set(...position);
    parent.add(object);
    return object;
  }

  setHoverTargets(targets: THREE.Object3D[], handler: (object: THREE.Object3D | null) => void) {
    this.hoverTargets = targets;
    this.hoverHandler = handler;
  }

  /** Moves the camera and its focus point smoothly, e.g. to zoom in on one clinic. */
  flyTo(position: Vec, target: Vec, duration = 1400) {
    this.sway.paused = true;
    this.flight = {
      from: this.camera.position.clone(),
      to: new THREE.Vector3(...position),
      fromTarget: this.controls.target.clone(),
      toTarget: new THREE.Vector3(...target),
      start: performance.now(),
      duration: this.reducedMotion ? 1 : duration,
    };
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.visibility.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.controls.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
        object.geometry.dispose();
        const materials: THREE.Material[] = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((m) => {
          if (m instanceof THREE.MeshStandardMaterial) m.map?.dispose();
          m.dispose();
        });
      }
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
    canvas.remove();
    this.labels.domElement.remove();
  }

  private finishFlight() {
    this.flight = null;
    this.controls.enabled = true;
    this.captureSway();
  }

  private captureSway() {
    this.sway.base.setFromVector3(this.camera.position.clone().sub(this.controls.target));
    this.sway.since = performance.now();
    this.sway.paused = this.reducedMotion;
  }

  private resize() {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(width, height, false);
    this.labels.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.zoom = this.fitAspect ? Math.min(1, this.camera.aspect / this.fitAspect) : 1;
    this.camera.updateProjectionMatrix();
  }

  private onPointerMove = (event: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.pointerDirty = true;
    this.pointerInside = true;
  };

  private onPointerLeave = () => {
    this.pointerInside = false;
    this.pointerDirty = true;
  };

  private pick() {
    if (!this.pointerDirty || !this.hoverHandler) return;
    this.pointerDirty = false;
    let found: THREE.Object3D | null = null;
    if (this.pointerInside) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hit = this.raycaster.intersectObjects(this.hoverTargets, true)[0];
      // Walk up to the object that was registered as a target.
      let object: THREE.Object3D | null = hit?.object ?? null;
      while (object && !this.hoverTargets.includes(object)) object = object.parent;
      found = object;
    }
    if (found !== this.hovered) {
      this.hovered = found;
      this.renderer.domElement.style.cursor = found ? 'pointer' : '';
      this.hoverHandler(found);
    }
  }

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.visible) {
      this.last = now;
      return;
    }
    const delta = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const time = (now - this.started) / 1000;

    if (this.flight) {
      const t = Math.min(1, (now - this.flight.start) / this.flight.duration);
      const k = easeInOut(t);
      this.camera.position.lerpVectors(this.flight.from, this.flight.to, k);
      this.controls.target.lerpVectors(this.flight.fromTarget, this.flight.toTarget, k);
      this.camera.lookAt(this.controls.target);
      if (t >= 1) this.finishFlight();
    } else {
      if (this.sway.paused && !this.reducedMotion && this.sway.resumeAt && now > this.sway.resumeAt) {
        this.sway.resumeAt = 0;
        this.captureSway();
      }
      if (!this.sway.paused) {
        const s = (now - this.sway.since) / 1000;
        const spherical = this.sway.base.clone();
        spherical.theta += Math.sin(s * 0.11) * 0.2;
        spherical.phi += Math.sin(s * 0.07) * 0.035;
        this.camera.position.setFromSpherical(spherical).add(this.controls.target);
      }
      this.controls.update();
    }

    this.pick();
    for (const frame of this.frames) frame(time, delta);
    this.renderer.render(this.scene, this.camera);
    this.labels.render(this.scene, this.camera);
  };
}

/** Smoothly moves `current` toward `target`; frame-rate independent. */
export const damp = (current: number, target: number, lambda: number, delta: number) =>
  THREE.MathUtils.damp(current, target, lambda, delta);

export function el(className: string, html = ''): HTMLDivElement {
  const div = document.createElement('div');
  div.className = className;
  div.innerHTML = html;
  return div;
}

/** A canvas texture of faint floor planks, so the studio floor reads as wood. */
export function plankTexture(base: string, line: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  for (let y = 0; y <= 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(512, y + 0.5);
    ctx.stroke();
    // Staggered butt joints.
    const offset = ((y / 32) % 4) * 128 + 40;
    ctx.beginPath();
    ctx.moveTo(offset + 0.5, y);
    ctx.lineTo(offset + 0.5, y + 32);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}
