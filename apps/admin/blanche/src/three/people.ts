import * as THREE from 'three';

import { pick, rng } from '../../../src/data/random';

// Little people like toys on a shelf: round, glossy and colourful, in the studio's palette. A figure is about 1.65 tall;
// the nail tables are 0.74 high and the stools 0.46.

const SKIN = ['#F3DCCB', '#EBC7AE', '#D9A988', '#BC8762', '#8E6044', '#6A4632'];
const HAIR = ['#24191A', '#3E2A22', '#6B4532', '#A06A45', '#D9B27C', '#8C3B3B', '#2D2433'];
const TOPS = ['#FFC9DA', '#C9B8FF', '#FFE58F', '#BFE6D3', '#FF8DB3', '#9ED3F2', '#F6A97A', '#FFFFFF', '#E7D6FF'];
const BOTTOMS = ['#2C2732', '#4D4A73', '#7C5D4F', '#3B5266', '#E8E2DA', '#1F1B22'];

export type Hair = 'bun' | 'pony' | 'long' | 'bob';
export type Look = { skin: string; hair: string; style: Hair; top: string; bottom: string };

/** The same look for the same name, every time. */
export function lookFor(name: string): Look {
  const r = rng(`blanche-look-${name}`);
  return { skin: pick(r, SKIN), hair: pick(r, HAIR), style: pick(r, ['bun', 'pony', 'long', 'bob'] as Hair[]), top: pick(r, TOPS), bottom: pick(r, BOTTOMS) };
}

/** Geometry shared by every figure in the scene. */
export function peopleKit() {
  return {
    torso: new THREE.CapsuleGeometry(0.15, 0.3, 8, 18),
    hips: new THREE.SphereGeometry(0.155, 18, 12),
    head: new THREE.SphereGeometry(0.125, 24, 16),
    cap: new THREE.SphereGeometry(0.134, 24, 14, 0, Math.PI * 2, 0, 1.75),
    long: new THREE.CapsuleGeometry(0.12, 0.16, 6, 14),
    bun: new THREE.SphereGeometry(0.065, 14, 10),
    pony: new THREE.CapsuleGeometry(0.04, 0.18, 6, 10),
    upper: new THREE.CapsuleGeometry(0.048, 0.22, 6, 12),
    fore: new THREE.CapsuleGeometry(0.042, 0.2, 6, 12),
    hand: new THREE.SphereGeometry(0.045, 12, 10),
    thigh: new THREE.CapsuleGeometry(0.068, 0.32, 6, 12),
    shin: new THREE.CapsuleGeometry(0.058, 0.32, 6, 12),
    shoe: new THREE.CapsuleGeometry(0.05, 0.08, 4, 10),
    apron: new THREE.CylinderGeometry(0.162, 0.17, 0.3, 20, 1, true),
  };
}
export type PeopleKit = ReturnType<typeof peopleKit>;

const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = true;
  return m;
};

type Limb = { joint: THREE.Group; middle: THREE.Group };

/**
 * A figure with joints at the shoulders, elbows, hips and knees, so it can stand, sit at a table or lie on the lash bed.
 * All its materials fade together.
 */
export class Person {
  readonly group = new THREE.Group();
  /** Everything above the floor; poses move this. */
  readonly body = new THREE.Group();
  private readonly materials: THREE.MeshStandardMaterial[] = [];
  private readonly arms: Limb[] = [];
  private readonly legs: Limb[] = [];
  private readonly hairParts: Record<Hair, THREE.Object3D[]>;
  private readonly top: THREE.MeshStandardMaterial;
  private readonly bottom: THREE.MeshStandardMaterial;
  private readonly skin: THREE.MeshStandardMaterial;
  private readonly hair: THREE.MeshStandardMaterial;
  private readonly upper = new THREE.Group();
  readonly headPoint = new THREE.Object3D();

  constructor(kit: PeopleKit, look: Look, apron?: string) {
    this.top = this.own(look.top, 0.55);
    this.bottom = this.own(look.bottom, 0.6);
    this.skin = this.own(look.skin, 0.62);
    this.hair = this.own(look.hair, 0.45);
    const shoes = this.own('#FFFFFF', 0.4);

    const hips = mesh(kit.hips, this.bottom);
    hips.scale.set(1, 0.6, 0.8);
    const torso = mesh(kit.torso, this.top);
    torso.position.y = 0.3;
    torso.scale.set(1, 1, 0.78);
    this.upper.add(hips, torso);
    if (apron) {
      const cloth = mesh(kit.apron, this.own(apron, 0.5));
      cloth.position.y = 0.2;
      cloth.scale.set(1, 1, 0.82);
      this.upper.add(cloth);
    }

    const head = mesh(kit.head, this.skin);
    head.position.y = 0.72;
    head.scale.set(0.95, 1.05, 0.98);
    this.headPoint.position.y = 0.72;
    const cap = mesh(kit.cap, this.hair);
    cap.position.y = 0.73;
    cap.rotation.x = -0.35;
    const long = mesh(kit.long, this.hair);
    long.position.set(0, 0.62, -0.05);
    long.scale.set(1.12, 1, 0.8);
    const bob = mesh(kit.long, this.hair);
    bob.position.set(0, 0.68, -0.035);
    bob.scale.set(1.13, 0.55, 0.86);
    const bun = mesh(kit.bun, this.hair);
    bun.position.set(0, 0.86, -0.06);
    const pony = mesh(kit.pony, this.hair);
    pony.position.set(0, 0.66, -0.15);
    pony.rotation.x = 0.35;
    this.upper.add(head, cap, long, bob, bun, pony, this.headPoint);
    this.hairParts = { bun: [cap, bun], pony: [cap, pony], long: [cap, long], bob: [cap, bob] };
    this.style = look.style;

    for (const side of [-1, 1]) {
      const joint = new THREE.Group();
      joint.position.set(side * 0.2, 0.5, 0);
      const upperArm = mesh(kit.upper, this.top);
      upperArm.position.y = -0.14;
      const middle = new THREE.Group();
      middle.position.y = -0.28;
      const fore = mesh(kit.fore, this.skin);
      fore.position.y = -0.13;
      const hand = mesh(kit.hand, this.skin);
      hand.position.y = -0.27;
      middle.add(fore, hand);
      joint.add(upperArm, middle);
      this.upper.add(joint);
      this.arms.push({ joint, middle });
    }

    for (const side of [-1, 1]) {
      const joint = new THREE.Group();
      joint.position.set(side * 0.08, 0, 0);
      const thigh = mesh(kit.thigh, this.bottom);
      thigh.position.y = -0.2;
      const middle = new THREE.Group();
      middle.position.y = -0.4;
      const shin = mesh(kit.shin, this.bottom);
      shin.position.y = -0.2;
      const shoe = mesh(kit.shoe, shoes);
      shoe.position.set(0, -0.42, 0.04);
      shoe.rotation.x = Math.PI / 2;
      middle.add(shin, shoe);
      joint.add(thigh, middle);
      this.body.add(joint);
      this.legs.push({ joint, middle });
    }
    this.body.add(this.upper);
    this.group.add(this.body);
    this.stand();
  }

  private own(color: string, roughness: number) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, transparent: true });
    this.materials.push(m);
    return m;
  }

  set style(style: Hair) {
    const on = new Set(this.hairParts[style]);
    for (const part of new Set(Object.values(this.hairParts).flat())) part.visible = on.has(part);
  }

  set look(look: Look) {
    this.top.color.set(look.top);
    this.bottom.color.set(look.bottom);
    this.skin.color.set(look.skin);
    this.hair.color.set(look.hair);
    this.style = look.style;
  }

  set opacity(value: number) {
    for (const m of this.materials) {
      m.opacity = value;
      m.depthWrite = value > 0.98;
    }
    this.group.visible = value > 0.01;
  }

  stand() {
    this.body.position.y = 0.86;
    this.body.rotation.set(0, 0, 0);
    this.body.quaternion.identity();
    for (const leg of this.legs) {
      leg.joint.rotation.set(0, 0, 0);
      leg.middle.rotation.set(0, 0, 0);
    }
    this.armsDown();
  }

  /** Sitting on a seat of the given height, knees forward. */
  sit(seat = 0.46) {
    this.body.quaternion.identity();
    this.body.position.y = seat + 0.06;
    for (const leg of this.legs) {
      leg.joint.rotation.set(-Math.PI / 2 + 0.05, 0, 0);
      leg.middle.rotation.set(Math.PI / 2 - 0.08, 0, 0);
    }
    this.armsDown();
  }

  /** Lying on her back with the head toward +x, as on the lash bed. */
  lie(height: number) {
    this.stand();
    this.body.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)));
    this.body.position.set(-0.2, height + 0.13, 0);
    for (const arm of this.arms) {
      arm.joint.rotation.set(0.05, 0, 0);
      arm.middle.rotation.set(-0.15, 0, 0);
    }
  }

  armsDown() {
    this.arms.forEach((arm, i) => {
      arm.joint.rotation.set(0.04, 0, (i ? -1 : 1) * 0.08);
      arm.middle.rotation.set(-0.2, 0, 0);
    });
  }

  /** Arms forward onto the table, the right hand moving a little while she works; 0 rests, 1 works. */
  reach(amount: number, time: number, busy: boolean) {
    const sway = busy ? Math.sin(time * 2.4) * 0.12 : 0;
    this.arms.forEach((arm, i) => {
      arm.joint.rotation.set(-0.15 - 1.05 * amount + (i === 0 ? sway : 0), 0, (i ? -1 : 1) * 0.05);
      arm.middle.rotation.set(-0.2 - 0.55 * amount, 0, 0);
    });
  }

  dispose() {
    for (const m of this.materials) m.dispose();
  }
}
