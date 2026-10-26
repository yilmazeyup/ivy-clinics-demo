import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { easeOutCubic } from './stage';

let glow: THREE.CanvasTexture | null = null;

/** A soft round light, drawn once: the halo around a token. */
export function glowTexture(): THREE.CanvasTexture {
  if (glow) return glow;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 244, 222, 1)');
  gradient.addColorStop(0.3, 'rgba(240, 210, 150, 0.75)');
  gradient.addColorStop(1, 'rgba(232, 196, 130, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  glow = new THREE.CanvasTexture(canvas);
  glow.colorSpace = THREE.SRGBColorSpace;
  return glow;
}

type Token = {
  group: THREE.Group;
  halo: THREE.Sprite;
  from: THREE.Vector3;
  via: THREE.Vector3;
  to: THREE.Vector3;
  t: number;
  duration: number;
  landed: boolean;
  /** Time since landing; the token shrinks into its target. */
  after: number;
  scale: number;
  onLand?: () => void;
};

/**
 * Small glowing coins that fly along an arc from one point to another, e.g. a payment from a treatment room to the desk.
 * They land, glow once and shrink away; `onLand` lets the scene react at that moment.
 */
export class Tokens {
  private readonly list: Token[] = [];
  private readonly coin = new THREE.CylinderGeometry(0.12, 0.12, 0.035, 28);
  private readonly materials = new Map<string, THREE.MeshStandardMaterial>();

  constructor(
    private readonly parent: THREE.Object3D,
    private readonly max = 12,
  ) {}

  fire(from: THREE.Vector3, to: THREE.Vector3, options: { color: string; duration: number; height?: number; scale?: number; onLand?: () => void }) {
    if (this.list.length >= this.max) {
      // Too many at once (the day is playing fast): skip the flight, keep the effect.
      options.onLand?.();
      return;
    }
    let material = this.materials.get(options.color);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color: options.color, roughness: 0.3, metalness: 0.45, emissive: options.color, emissiveIntensity: 0.75 });
      this.materials.set(options.color, material);
    }
    const group = new THREE.Group();
    const coin = new THREE.Mesh(this.coin, material);
    coin.rotation.x = Math.PI / 2;
    const halo = new THREE.Sprite(
      // A warm halo with ordinary blending, so it still shows against the light floors.
      new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, opacity: 0.9 }),
    );
    halo.scale.setScalar(1.05);
    group.add(coin, halo);
    group.scale.setScalar(options.scale ?? 1);
    group.position.copy(from);
    this.parent.add(group);
    const via = from.clone().lerp(to, 0.5);
    via.y = Math.max(from.y, to.y) + (options.height ?? 1.6);
    this.list.push({
      group,
      halo,
      from: from.clone(),
      via,
      to: to.clone(),
      t: 0,
      duration: options.duration,
      landed: false,
      after: 0,
      scale: options.scale ?? 1,
      onLand: options.onLand,
    });
  }

  /** Clears every token and frees what they share; the scene calls this when it goes. */
  dispose() {
    for (const token of this.list) this.remove(token);
    this.list.length = 0;
    this.coin.dispose();
    for (const material of this.materials.values()) material.dispose();
    this.materials.clear();
  }

  update(delta: number) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const token = this.list[i];
      if (!token.landed) {
        token.t = Math.min(1, token.t + delta / token.duration);
        const k = easeInOutSine(token.t);
        const a = token.from.clone().lerp(token.via, k);
        const b = token.via.clone().lerp(token.to, k);
        token.group.position.copy(a.lerp(b, k));
        token.group.rotation.y += delta * 7;
        token.halo.material.opacity = 0.55 + Math.sin(token.t * Math.PI) * 0.4;
        if (token.t >= 1) {
          token.landed = true;
          token.onLand?.();
        }
      } else {
        token.after += delta;
        const k = Math.min(1, token.after / 0.45);
        token.group.scale.setScalar(Math.max(0.001, token.scale * (1 - easeOutCubic(k))));
        token.halo.material.opacity = (1 - k) * 0.9;
        if (k >= 1) {
          this.remove(token);
          this.list.splice(i, 1);
        }
      }
    }
  }

  private remove(token: Token) {
    this.parent.remove(token.group);
    token.halo.material.dispose();
  }
}

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/** A short line of HTML that floats up from a point and fades, like "+ € 195". It removes itself. */
export function floatTag(parent: THREE.Object3D, position: THREE.Vector3, className: string, text: string, seconds: number) {
  const element = document.createElement('div');
  element.className = className;
  element.textContent = text;
  element.style.setProperty('--life', `${seconds}s`);
  const object = new CSS2DObject(element);
  object.position.copy(position);
  parent.add(object);
  window.setTimeout(() => parent.remove(object), seconds * 1000);
}
