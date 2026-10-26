import * as THREE from 'three';

import { pick, rng } from '../data/random';

// Figures like the ones in an architect's model: smooth, quiet shapes in the clinic's warm tones, never cartoons.
// Sizes are in chair units: the treatment chair is about two units long, a figure about 1.8 tall.

const SKIN = ['#EFDCC8', '#E2C3A5', '#CDA484', '#A98062', '#80604A', '#5F4535'];
const HAIR = ['#2B2420', '#4A372C', '#6B4E3A', '#8E6E50', '#A88A66', '#7E6F63'];
const TOPS = ['#EBDDD5', '#DCC9B3', '#CBBEAA', '#B29C82', '#8C7B6B', '#E4D6C8', '#C9B8AE'];
const BOTTOMS = ['#4E463F', '#655A51', '#7A6A55', '#57504A', '#94826E'];
const COAT = '#FAF8F4';
const TROUSERS = '#4A433D';
const SOCKS = '#EDE6DC';
const DEVICE = '#BFB3A5';

export type HairStyle = 'bun' | 'bob' | 'tail' | 'crop';
export type Look = { skin: string; hair: string; style: HairStyle; top: string; bottom: string };

/** The same look for the same name, every time: skin, hair and clothes. */
export function lookFor(name: string, styles: HairStyle[]): Look {
  const r = rng(`look-${name}`);
  return { skin: pick(r, SKIN), hair: pick(r, HAIR), style: pick(r, styles), top: pick(r, TOPS), bottom: pick(r, BOTTOMS) };
}

/** Where the therapist stands along the chair: by the head, the middle or the hands. */
export type Spot = 'head' | 'middle' | 'hands';
export const SPOT_X: Record<Spot | 'idle', number> = { head: -0.78, middle: -0.18, hands: -0.42, idle: -0.12 };

const v = (x: number, y: number) => new THREE.Vector2(x, y);

/** Geometry shared by every figure in a scene. */
export function figureKit() {
  // A knee-length coat, turned on a lathe: flared hem, waist, chest, rounded shoulders.
  const coat = [v(0.205, 0.52), v(0.193, 0.7), v(0.168, 0.9), v(0.186, 1.1), v(0.198, 1.27), v(0.19, 1.37), v(0.15, 1.44), v(0.08, 1.482), v(0.001, 1.5)];
  return {
    coat: new THREE.LatheGeometry(coat, 30),
    leg: new THREE.CapsuleGeometry(0.062, 0.56, 6, 14),
    upperArm: new THREE.CapsuleGeometry(0.046, 0.21, 6, 12),
    foreArm: new THREE.CapsuleGeometry(0.04, 0.2, 6, 12),
    hand: new THREE.SphereGeometry(0.04, 14, 10),
    neck: new THREE.CylinderGeometry(0.042, 0.048, 0.13, 14),
    head: new THREE.SphereGeometry(0.105, 28, 18),
    cap: new THREE.SphereGeometry(0.113, 28, 14, 0, Math.PI * 2, 0, 1.72),
    bob: new THREE.SphereGeometry(0.118, 28, 16, 0, Math.PI * 2, 0, 2.08),
    bun: new THREE.SphereGeometry(0.056, 16, 12),
    tail: new THREE.CapsuleGeometry(0.034, 0.15, 6, 10),
    torso: new THREE.CapsuleGeometry(0.14, 0.34, 8, 18),
    pelvis: new THREE.SphereGeometry(0.13, 20, 14),
    shin: new THREE.CapsuleGeometry(0.066, 0.86, 6, 14),
    restArm: new THREE.CapsuleGeometry(0.042, 0.46, 6, 12),
    foot: new THREE.CapsuleGeometry(0.044, 0.06, 4, 10),
    device: new THREE.CapsuleGeometry(0.022, 0.12, 4, 10),
  };
}
export type FigureKit = ReturnType<typeof figureKit>;

const material = (color: string, roughness = 0.82) => new THREE.MeshStandardMaterial({ color, roughness, transparent: true });

function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material) {
  const m = new THREE.Mesh(geometry, mat);
  m.castShadow = true;
  return m;
}

/** A head with every hairstyle on it; `style` shows one of them. */
class Head {
  readonly group = new THREE.Group();
  private readonly styles: Record<HairStyle, THREE.Object3D[]>;

  constructor(kit: FigureKit, skin: THREE.Material, hair: THREE.Material) {
    const skull = mesh(kit.head, skin);
    skull.scale.set(0.92, 1.08, 0.98);
    // The cap tilts back: the forehead stays free, the back of the head is covered.
    const cap = mesh(kit.cap, hair);
    cap.rotation.x = -0.32;
    cap.scale.set(0.95, 1.04, 1.02);
    const bob = mesh(kit.bob, hair);
    bob.rotation.x = -0.2;
    bob.scale.set(0.97, 1.02, 1.0);
    const bun = mesh(kit.bun, hair);
    bun.position.set(0, 0.085, -0.085);
    const tail = mesh(kit.tail, hair);
    tail.position.set(0, -0.03, -0.125);
    tail.rotation.x = 0.32;
    this.group.add(skull, cap, bob, bun, tail);
    this.styles = { crop: [cap], bun: [cap, bun], tail: [cap, tail], bob: [bob] };
  }

  set style(style: HairStyle) {
    const on = new Set(this.styles[style]);
    for (const part of new Set(Object.values(this.styles).flat())) part.visible = on.has(part);
  }
}

/** Every material of a figure, so it can fade in and out as one. */
abstract class Figure {
  readonly group = new THREE.Group();
  protected readonly materials: THREE.MeshStandardMaterial[] = [];

  protected own(color: string, roughness?: number) {
    const m = material(color, roughness);
    this.materials.push(m);
    return m;
  }

  set opacity(value: number) {
    for (const m of this.materials) {
      m.opacity = value;
      // Fully there: draw it like any solid object, so it sorts and shadows cleanly.
      m.depthWrite = value > 0.98;
    }
    this.group.visible = value > 0.01;
  }
}

/** A skin therapist in a white coat, standing; arms that rest, or reach toward the client while treating. */
export class Therapist extends Figure {
  /** Moves up and down for arrivals; the group itself holds the place in the room. */
  readonly body = new THREE.Group();
  private readonly shoulders: THREE.Group[] = [];
  private readonly elbows: THREE.Group[] = [];
  private readonly device: THREE.Mesh;

  constructor(kit: FigureKit, look: Look) {
    super();
    const coat = this.own(COAT, 0.7);
    const trousers = this.own(TROUSERS);
    const skin = this.own(look.skin);
    const hair = this.own(look.hair, 0.9);
    const device = this.own(DEVICE, 0.45);

    for (const side of [-1, 1]) {
      const leg = mesh(kit.leg, trousers);
      leg.position.set(side * 0.075, 0.342, 0);
      this.body.add(leg);
    }
    const torso = mesh(kit.coat, coat);
    torso.scale.z = 0.64;
    const neck = mesh(kit.neck, skin);
    neck.position.y = 1.53;
    const head = new Head(kit, skin, hair);
    head.style = look.style;
    head.group.position.y = 1.69;
    this.body.add(torso, neck, head.group);

    // Arms hang from the shoulders; the elbow is its own joint so the forearm can reach forward.
    for (const side of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.205, 1.38, 0);
      const upper = mesh(kit.upperArm, coat);
      upper.position.y = -0.15;
      const elbow = new THREE.Group();
      elbow.position.y = -0.29;
      const fore = mesh(kit.foreArm, coat);
      fore.position.y = -0.14;
      const hand = mesh(kit.hand, skin);
      hand.position.y = -0.285;
      elbow.add(fore, hand);
      shoulder.add(upper, elbow);
      this.body.add(shoulder);
      this.shoulders.push(shoulder);
      this.elbows.push(elbow);
    }
    // The handpiece sits in the right hand (at -x, since the figure faces +z).
    this.device = mesh(kit.device, device);
    this.device.position.set(0, -0.31, 0.04);
    this.device.rotation.x = 1.1;
    this.elbows[0].add(this.device);
    this.group.add(this.body);
  }

  /** 0 is standing at ease, 1 is treating; `time` keeps the working hand moving a little. */
  pose(work: number, time: number) {
    const [right, left] = this.shoulders;
    const [rightElbow, leftElbow] = this.elbows;
    const sweep = Math.sin(time * 1.5) * 0.09 * work;
    right.rotation.set(-0.06 - 0.5 * work, 0, -0.09 + sweep);
    left.rotation.set(-0.06 - 0.3 * work, 0, 0.09);
    rightElbow.rotation.x = -0.22 - 0.85 * work;
    leftElbow.rotation.x = -0.22 - 0.6 * work;
    this.device.visible = work > 0.35;
  }
}

/** A client reclining on the treatment chair, in chair coordinates: head on the headrest, feet at the end of the seat. */
export class Client extends Figure {
  private readonly head: Head;
  private readonly top: THREE.MeshStandardMaterial;
  private readonly bottom: THREE.MeshStandardMaterial;
  private readonly skin: THREE.MeshStandardMaterial;
  private readonly hair: THREE.MeshStandardMaterial;

  constructor(kit: FigureKit) {
    super();
    this.top = this.own(TOPS[0]);
    this.bottom = this.own(BOTTOMS[0]);
    this.skin = this.own(SKIN[0]);
    this.hair = this.own(HAIR[0], 0.9);
    const socks = this.own(SOCKS);

    // The backrest rises 0.5 rad toward the head: u runs up along it, n stands out of it.
    const incline = 0.5;
    const u = new THREE.Vector3(-Math.cos(incline), Math.sin(incline), 0);
    const n = new THREE.Vector3(Math.sin(incline), Math.cos(incline), 0);
    const along = Math.PI / 2 - incline;

    const torso = mesh(kit.torso, this.top);
    torso.position.set(-0.645, 0.735, 0);
    torso.rotation.z = along;
    torso.scale.set(0.72, 1, 1.2);
    const shoulders = torso.position.clone().addScaledVector(u, 0.29);

    const pelvis = mesh(kit.pelvis, this.bottom);
    pelvis.position.set(-0.36, 0.585, 0);
    pelvis.scale.set(1.05, 0.62, 1.25);

    const neck = mesh(kit.neck, this.skin);
    neck.position.copy(shoulders).addScaledVector(u, 0.07);
    neck.rotation.z = along;

    this.head = new Head(kit, this.skin, this.hair);
    this.head.group.position.copy(shoulders).addScaledVector(u, 0.2).addScaledVector(n, 0.025);
    // Face up, crown toward the headrest end: local x across the chair, y along the backrest, z out of it.
    this.head.group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), u, n));

    this.group.add(torso, pelvis, neck, this.head.group);
    for (const side of [-1, 1]) {
      const leg = mesh(kit.shin, this.bottom);
      leg.position.set(0.14, 0.568, side * 0.078);
      leg.rotation.z = Math.PI / 2;
      const foot = mesh(kit.foot, socks);
      foot.position.set(0.655, 0.625, side * 0.08);
      foot.rotation.set(side * 0.12, 0, -0.35);
      const arm = mesh(kit.restArm, this.top);
      arm.position.copy(shoulders).addScaledVector(u, -0.29);
      arm.position.z = side * 0.215;
      arm.rotation.z = along;
      const hand = mesh(kit.hand, this.skin);
      hand.position.copy(shoulders).addScaledVector(u, -0.6).addScaledVector(n, 0.01);
      hand.position.z = side * 0.215;
      this.group.add(leg, foot, arm, hand);
    }
  }

  set look(look: Look) {
    this.top.color.set(look.top);
    this.bottom.color.set(look.bottom);
    this.skin.color.set(look.skin);
    this.hair.color.set(look.hair);
    this.head.style = look.style;
  }
}
