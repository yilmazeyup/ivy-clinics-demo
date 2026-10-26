import { IVY_COLORS } from '@pure-ivy/shared';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { damp, el, plankTexture, type Stage } from './stage';

export type SeatState = 'free' | 'booked' | 'in' | 'noshow';
export type SeatView = { reformer: number; state: SeatState; name?: string };
export type Tip = { title: string; detail: string };

/** Ivy's palette on the studio model: sage for a booking, deep ivy for a member who is in. */
export const SEAT_COLORS: Record<SeatState, string> = {
  free: '#FFFFFF',
  booked: '#CFDCCF',
  in: IVY_COLORS.ivy,
  noshow: '#E2DCD2',
};
const INK = '#2B2E2C';
const WINDOW = '#C9D6DE';
const SCAN = '#5E9A72';
const PULSE = '#4F7A60';

// Two rows of four, facing the mirror wall. Reformers 1 and 5 stand by the windows, as in the app.
const SPOTS: [number, number][] = [
  [-3.45, -1.15], [-1.15, -1.15], [1.15, -1.15], [3.45, -1.15],
  [-3.45, 1.85], [-1.15, 1.85], [1.15, 1.85], [3.45, 1.85],
];

type Reformer = {
  number: number;
  group: THREE.Group;
  carriage: THREE.Group;
  pad: THREE.MeshStandardMaterial;
  target: THREE.Color;
  state: SeatState;
  pop: number;
  slide: number;
  drop: number;
  delay: number;
  phase: number;
  tag: HTMLDivElement;
};

type Pulse = { mesh: THREE.Mesh; age: number };

/** The pilates studio as an architect's model: eight reformers that light up as members book and check in. */
export class StudioScene {
  private readonly root = new THREE.Group();
  private readonly reformers: Reformer[] = [];
  private readonly pulses: Pulse[] = [];
  private readonly sun: THREE.DirectionalLight;
  private readonly lamps: THREE.DirectionalLight;
  private readonly glass: THREE.MeshStandardMaterial;
  private readonly scanner: THREE.MeshStandardMaterial;
  private scanGlow = 0;
  private readonly tip: CSS2DObject;
  private readonly tipEl = el('scene-tip');
  private readonly instructorEl = el('scene-tag scene-tag--instructor');
  private readonly walls: THREE.Group;
  private readonly unsubscribe: () => void;
  private live = false;
  private hour = 12;
  private wallsUp = 0;

  constructor(
    private readonly stage: Stage,
    private readonly describe: (reformer: number) => Tip | null,
    private readonly words: { instructor: string; checkin: string; noShow: string },
  ) {
    stage.scene.add(this.root);

    const oak = new THREE.MeshStandardMaterial({ color: '#D7BF9B', roughness: 0.72 });
    const metal = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.32, metalness: 0.6 });
    const leather = new THREE.MeshStandardMaterial({ color: '#8F8579', roughness: 0.85 });
    const wall = new THREE.MeshStandardMaterial({ color: '#F4F1EB', roughness: 0.95 });
    const white = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.9 });

    // Plinth and wooden floor.
    const plinth = new THREE.Mesh(new RoundedBoxGeometry(11.6, 0.2, 8.8, 2, 0.06), white);
    plinth.position.y = -0.33;
    plinth.receiveShadow = true;
    const floorMap = plankTexture('#EADFCF', '#DDCFBB');
    floorMap.repeat.set(3, 2.2);
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(10.8, 0.24, 8),
      new THREE.MeshStandardMaterial({ color: '#FFFFFF', map: floorMap, roughness: 0.8 }),
    );
    floor.position.y = -0.12;
    floor.receiveShadow = true;
    this.root.add(plinth, floor);

    // Mirror wall at the back, window wall on the left. Built from parts so daylight falls through the openings.
    this.walls = new THREE.Group();
    const back = new THREE.Mesh(new THREE.BoxGeometry(10.8, 2.8, 0.18), wall);
    back.position.set(0, 1.4, -4.09);
    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 1.75, 0.02),
      new THREE.MeshStandardMaterial({ color: '#E7EDF1', metalness: 0, roughness: 0.04, envMapIntensity: 2.2 }),
    );
    mirror.position.set(0.3, 1.25, -3.99);
    const barre = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.05, 0.05), oak);
    barre.position.set(0.3, 0.95, -3.9);
    this.walls.add(back, mirror, barre);

    const x = -5.31;
    const parts: [number, number, number, number][] = [
      // [y, height, z, length]
      [0.25, 0.5, 0, 8],
      [2.6, 0.4, 0, 8],
      [1.45, 1.9, -3.5, 1],
      [1.45, 1.9, -1.15, 0.9],
      [1.45, 1.9, 1.15, 0.9],
      [1.45, 1.9, 3.5, 1],
    ];
    for (const [y, height, z, length] of parts) {
      const piece = new THREE.Mesh(new THREE.BoxGeometry(0.18, height, length), wall);
      piece.position.set(x, y, z);
      this.walls.add(piece);
    }
    this.glass = new THREE.MeshStandardMaterial({ color: WINDOW, transparent: true, opacity: 0.45, roughness: 0.1, depthWrite: false });
    for (const z of [-2.3, 0, 2.3]) {
      const pane = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.9, 1.4), this.glass);
      pane.position.set(x, 1.45, z);
      pane.castShadow = false;
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.9, 0.05), oak);
      mullion.position.set(x, 1.45, z);
      this.walls.add(pane, mullion);
    }
    this.walls.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material !== this.glass) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    this.walls.scale.y = 0.001;
    this.root.add(this.walls);

    // Instructor platform in front of the mirror.
    const platform = new THREE.Mesh(new RoundedBoxGeometry(2.4, 0.14, 0.9, 2, 0.03), oak);
    platform.position.set(0, 0.07, -3.35);
    platform.castShadow = true;
    platform.receiveShadow = true;
    const mat = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.02, 0.55), leather);
    mat.position.set(0, 0.15, -3.35);
    this.root.add(platform, mat);
    stage.label(this.instructorEl, this.root, [0, 1.15, -3.35]);

    // Check-in desk by the entrance: the scanner lights up when a member scans the app's code.
    const desk = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.95, 0.55, 2, 0.03), oak);
    desk.position.set(4.6, 0.475, 3.3);
    this.scanner = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.4, emissive: SCAN, emissiveIntensity: 0 });
    const scanner = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.36, 0.05, 2, 0.015), this.scanner);
    scanner.position.set(4.25, 1.13, 3.3);
    scanner.rotation.y = -0.5;
    for (const mesh of [desk, scanner]) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
    this.root.add(desk, scanner);
    stage.label(el('scene-tag scene-tag--instructor', words.checkin), this.root, [4.6, 1.6, 3.3]);

    // The eight reformers, sharing their geometry.
    const geo = {
      leg: new THREE.BoxGeometry(0.07, 0.2, 0.07),
      rail: new RoundedBoxGeometry(0.07, 0.09, 2.4, 2, 0.02),
      cap: new RoundedBoxGeometry(0.62, 0.11, 0.08, 2, 0.02),
      pad: new RoundedBoxGeometry(0.54, 0.09, 0.95, 3, 0.035),
      head: new RoundedBoxGeometry(0.3, 0.05, 0.2, 2, 0.02),
      shoulder: new RoundedBoxGeometry(0.09, 0.12, 0.09, 2, 0.025),
      bar: new RoundedBoxGeometry(0.66, 0.045, 0.045, 2, 0.015),
      upright: new THREE.BoxGeometry(0.04, 0.34, 0.04),
      spring: new THREE.BoxGeometry(0.022, 0.022, 0.42),
    };
    const springColors = [IVY_COLORS.ivy, INK, INK, '#9AA0A6'].map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 }),
    );
    const targets: THREE.Object3D[] = [];

    SPOTS.forEach(([px, pz], index) => {
      const number = index + 1;
      const group = new THREE.Group();
      group.position.set(px, 0, pz);
      group.userData.reformer = number;

      for (const [lx, lz] of [[-0.27, -1.12], [0.27, -1.12], [-0.27, 1.12], [0.27, 1.12]]) {
        const leg = new THREE.Mesh(geo.leg, metal);
        leg.position.set(lx, 0.1, lz);
        group.add(leg);
      }
      for (const side of [-0.275, 0.275]) {
        const rail = new THREE.Mesh(geo.rail, oak);
        rail.position.set(side, 0.245, 0);
        group.add(rail);
      }
      for (const end of [-1.16, 1.16]) {
        const cap = new THREE.Mesh(geo.cap, oak);
        cap.position.set(0, 0.24, end);
        group.add(cap);
      }
      [-0.12, -0.04, 0.04, 0.12].forEach((sx, i) => {
        const spring = new THREE.Mesh(geo.spring, springColors[i]);
        spring.position.set(sx, 0.25, -0.84);
        group.add(spring);
      });
      for (const side of [-0.3, 0.3]) {
        const upright = new THREE.Mesh(geo.upright, metal);
        upright.position.set(side, 0.43, -1.06);
        group.add(upright);
      }
      const bar = new THREE.Mesh(geo.bar, metal);
      bar.position.set(0, 0.61, -1.06);
      group.add(bar);

      const pad = new THREE.MeshStandardMaterial({ color: SEAT_COLORS.free, roughness: 0.82 });
      const carriage = new THREE.Group();
      carriage.position.set(0, 0.34, 0.2);
      const cushion = new THREE.Mesh(geo.pad, pad);
      const head = new THREE.Mesh(geo.head, pad);
      head.position.set(0, 0.06, 0.38);
      carriage.add(cushion, head);
      for (const side of [-0.13, 0.13]) {
        const block = new THREE.Mesh(geo.shoulder, leather);
        block.position.set(side, 0.1, 0.2);
        carriage.add(block);
      }
      group.add(carriage);
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });

      const tag = el('scene-tag');
      stage.label(tag, group, [0, 1.0, 0.25]);
      stage.label(el('scene-floor-number', String(number)), group, [0, 0.02, -1.55]);

      this.root.add(group);
      targets.push(group);
      this.reformers.push({
        number,
        group,
        carriage,
        pad,
        target: new THREE.Color(SEAT_COLORS.free),
        state: 'free',
        pop: 0,
        slide: 0,
        drop: stage.reducedMotion ? 1 : 0,
        delay: 0.2 + index * 0.07,
        phase: index * 0.83,
        tag,
      });
    });

    // Tooltip shown above whichever reformer the pointer is on.
    this.tip = stage.label(this.tipEl, this.root, [0, 1.45, 0]);
    this.tip.visible = false;
    stage.setHoverTargets(targets, (object) => {
      const number = object?.userData.reformer as number | undefined;
      const info = number ? this.describe(number) : null;
      if (!object || !info) {
        this.tip.visible = false;
        return;
      }
      this.tipEl.innerHTML = `<strong>${info.title}</strong><span>${info.detail}</span>`;
      this.tip.position.set(object.position.x, 1.5, object.position.z + 0.2);
      this.tip.visible = true;
    });

    // Daylight through the windows, plus ceiling light that takes over in the evening.
    this.sun = new THREE.DirectionalLight('#FFF4E2', 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -8;
    this.sun.shadow.camera.right = 8;
    this.sun.shadow.camera.top = 8;
    this.sun.shadow.camera.bottom = -8;
    this.sun.shadow.camera.far = 40;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    this.sun.shadow.radius = 4;
    this.sun.target.position.set(0, 0, 0);
    this.lamps = new THREE.DirectionalLight('#FFE9CC', 0.2);
    this.lamps.position.set(2, 10, 3);
    const sky = new THREE.HemisphereLight('#FFFFFF', '#E8DFD2', 0.25);
    stage.scene.add(this.sun, this.sun.target, this.lamps, sky);
    this.setHour(this.hour);

    this.unsubscribe = stage.onFrame((time, delta) => this.frame(time, delta));
  }

  /** Shows one class: who is booked, who is in, and whether the class is running. */
  update(seats: SeatView[], options: { live: boolean; instructor: string }) {
    this.live = options.live;
    this.instructorEl.innerHTML = `${options.instructor} <span>${this.words.instructor}</span>`;
    for (const reformer of this.reformers) {
      const seat = seats.find((s) => s.reformer === reformer.number);
      const state: SeatState = seat?.state ?? 'free';
      if (state !== reformer.state) {
        if (state === 'in' && reformer.state === 'booked') this.pulse(reformer);
        reformer.pop = 1;
        reformer.state = state;
        reformer.target.set(SEAT_COLORS[state]);
      }
      const tag = reformer.tag;
      tag.className = `scene-tag scene-tag--${state}`;
      tag.innerHTML = seat?.name ? `${state === 'in' ? '<b>✓</b> ' : ''}${seat.name}${state === 'noshow' ? ` · ${this.words.noShow}` : ''}` : '';
    }
  }

  /** Moves the sun with the time of day; after dark the ceiling lights do the work. */
  setHour(hour: number) {
    this.hour = hour;
    const day = THREE.MathUtils.smoothstep(hour, 7, 9) * (1 - THREE.MathUtils.smoothstep(hour, 16.5, 18.5));
    const warm = 1 - Math.abs(THREE.MathUtils.clamp((hour - 12.5) / 5, -1, 1));
    this.sun.intensity = 0.35 + day * 2.8;
    this.sun.color.set('#FFC892').lerp(new THREE.Color('#FFF6EA'), warm);
    // Morning light comes in from the front windows, evening light from the back.
    const sweep = THREE.MathUtils.clamp((hour - 7) / 12, 0, 1);
    this.sun.position.set(-9, 4 + day * 4, 5 - sweep * 10);
    this.lamps.intensity = 0.25 + (1 - day) * 1.1;
    this.stage.scene.environmentIntensity = 0.38 + (1 - day) * 0.3;
    this.glass.color.set(day > 0.3 ? WINDOW : '#7F8FA6');
  }

  dispose() {
    this.unsubscribe();
    this.stage.scene.remove(this.root);
  }

  private pulse(reformer: Reformer) {
    // A square frame on the floor that widens and fades: the scan at the door.
    const shape = new THREE.Shape();
    shape.moveTo(-0.55, -1.45).lineTo(0.55, -1.45).lineTo(0.55, 1.45).lineTo(-0.55, 1.45).lineTo(-0.55, -1.45);
    const hole = new THREE.Path();
    hole.moveTo(-0.5, -1.4).lineTo(-0.5, 1.4).lineTo(0.5, 1.4).lineTo(0.5, -1.4).lineTo(-0.5, -1.4);
    shape.holes.push(hole);
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color: PULSE, transparent: true, depthWrite: false }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(reformer.group.position.x, 0.015, reformer.group.position.z);
    this.root.add(mesh);
    this.pulses.push({ mesh, age: 0 });
    this.scanGlow = 1;
  }

  private frame(time: number, delta: number) {
    this.wallsUp = damp(this.wallsUp, 1, this.stage.reducedMotion ? 100 : 4.5, delta);
    this.walls.scale.y = Math.max(0.001, this.wallsUp);

    for (const r of this.reformers) {
      // Lower into place one by one when the scene opens; the cushion bounces as it lands.
      if (r.drop < 1 && time > r.delay) {
        r.drop = Math.min(1, r.drop + delta * 1.6);
        if (r.drop === 1) r.pop = 0.7;
      }
      r.group.position.y = Math.pow(1 - r.drop, 3) * 2.2;
      r.group.visible = r.drop > 0;

      r.pad.color.lerp(r.target, 1 - Math.exp(-delta * 6));
      r.pop = damp(r.pop, 0, 5, delta);
      const moving = this.live && r.state === 'in' && !this.stage.reducedMotion;
      r.slide = damp(r.slide, moving ? -0.12 + Math.sin(time * 1.5 + r.phase) * 0.16 : 0, 6, delta);
      r.carriage.position.set(0, 0.34 + r.pop * 0.12, 0.2 + r.slide);
    }

    this.scanGlow = damp(this.scanGlow, 0, 2.5, delta);
    this.scanner.emissiveIntensity = this.scanGlow * 2.5;

    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.age += delta;
      const t = p.age / 1.4;
      p.mesh.scale.setScalar(1 + t * 0.35);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t);
      if (t >= 1) {
        this.root.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.pulses.splice(i, 1);
      }
    }
  }
}
