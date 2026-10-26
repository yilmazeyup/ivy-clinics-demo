import { CLINIC_COLORS } from '@pure-clinics/shared';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { damp, el, type Stage, type Tip } from './stage';

export type RoomState = 'busy' | 'free' | 'done' | 'off';

/** One clinic as the scene shows it: a name, a detail line and a label per treatment room. */
export type ClinicSpec = { name: string; detail: string; rooms: string[] };
export type RoomView = { state: RoomState; status: string };

const W = 7.2;
const D = 4.6;

/** Where the camera looks from when it shows both clinics. */
export const OVERVIEW = { camera: [2.4, 17.5, 17.2] as [number, number, number], target: [0, 0, 1.2] as [number, number, number] };

const CHAIR: Record<RoomState, string> = {
  busy: CLINIC_COLORS.now,
  free: '#FFFFFF',
  done: '#F1ECE5',
  off: '#D9D2C8',
};
const FLOOR: Record<RoomState, string> = {
  busy: '#DCE7DF',
  free: '#F8F5F0',
  done: '#F3EFE9',
  off: '#E9E3DA',
};

type Room = {
  clinic: number;
  index: number;
  chair: THREE.Group;
  upholstery: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  frame: THREE.Mesh;
  chairTarget: THREE.Color;
  floorTarget: THREE.Color;
  state: RoomState | null;
  tag: HTMLDivElement;
  drop: number;
  delay: number;
  pop: number;
};

/**
 * The clinics as small architectural models on a diagonal, seen from above. Every treatment room has a chair
 * that turns green while a treatment is going on, so "what is happening now" reads at a glance.
 */
export class ClinicsScene {
  private readonly root = new THREE.Group();
  private readonly rooms: Room[] = [];
  private readonly tiles: THREE.Group[] = [];
  private readonly tip: CSS2DObject;
  private readonly tipEl = el('scene-tip');
  private readonly unsubscribe: () => void;
  private focused: number | null = null;
  private readonly count: number;

  constructor(
    private readonly stage: Stage,
    clinics: ClinicSpec[],
    private readonly describe: (clinic: number, room: number) => Tip | null,
  ) {
    stage.scene.add(this.root);
    this.count = clinics.length;

    const white = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.9 });
    const wall = new THREE.MeshStandardMaterial({ color: '#F4F1EB', roughness: 0.95 });
    const oak = new THREE.MeshStandardMaterial({ color: '#D7BF9B', roughness: 0.72 });
    const taupe = new THREE.MeshStandardMaterial({ color: '#BFB3A5', roughness: 0.5, metalness: 0.2 });
    const cart = new THREE.MeshStandardMaterial({ color: '#E7E0D6', roughness: 0.6 });
    const sand = new THREE.MeshStandardMaterial({ color: CLINIC_COLORS.sand, roughness: 0.9 });

    const geo = {
      pedestal: new RoundedBoxGeometry(0.42, 0.36, 0.42, 2, 0.05),
      seat: new RoundedBoxGeometry(1.35, 0.14, 0.62, 2, 0.05),
      back: new RoundedBoxGeometry(0.72, 0.13, 0.62, 2, 0.05),
      head: new RoundedBoxGeometry(0.26, 0.1, 0.4, 2, 0.04),
      cart: new RoundedBoxGeometry(0.34, 0.62, 0.3, 2, 0.03),
      tray: new RoundedBoxGeometry(0.4, 0.03, 0.34, 2, 0.01),
      stool: new RoundedBoxGeometry(0.3, 0.36, 0.3, 2, 0.06),
    };

    const targets: THREE.Object3D[] = [];
    clinics.forEach((clinic, c) => {
      const tile = new THREE.Group();
      tile.position.copy(this.tileCenter(c));
      tile.userData.clinic = c;

      const base = new THREE.Mesh(new RoundedBoxGeometry(W + 0.5, 0.16, D + 0.5, 2, 0.05), white);
      base.position.y = -0.26;
      const floor = new THREE.Mesh(new RoundedBoxGeometry(W, 0.18, D, 2, 0.03), sand);
      floor.position.y = -0.09;
      const back = new THREE.Mesh(new THREE.BoxGeometry(W, 1.5, 0.12), wall);
      back.position.set(0, 0.75, -D / 2 + 0.06);
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, D), wall);
      side.position.set(-W / 2 + 0.06, 0.75, 0);
      tile.add(base, floor, back, side);

      // Reception at the front: a desk and two chairs to wait on.
      const desk = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.8, 0.5, 2, 0.04), oak);
      desk.position.set(-W / 2 + 1.25, 0.4, D / 2 - 0.75);
      tile.add(desk);
      for (const z of [D / 2 - 1.6, D / 2 - 0.8]) {
        const seat = new THREE.Mesh(geo.stool, cart);
        seat.position.set(W / 2 - 0.7, 0.18, z);
        tile.add(seat);
      }

      const rooms = clinic.rooms.length;
      const roomW = (W - 0.3) / rooms;
      const roomD = 2.5;
      const roomZ = -D / 2 + 0.12 + roomD / 2;
      for (let r = 0; r < rooms; r++) {
        const x = -W / 2 + 0.15 + roomW * (r + 0.5);
        if (r > 0) {
          const partition = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, roomD), wall);
          partition.position.set(x - roomW / 2, 0.65, roomZ);
          tile.add(partition);
        }
        const floorMat = new THREE.MeshStandardMaterial({ color: FLOOR.free, roughness: 0.95 });
        const roomFloor = new THREE.Mesh(new THREE.BoxGeometry(roomW - 0.14, 0.012, roomD - 0.1), floorMat);
        roomFloor.position.set(x, 0.006, roomZ);
        tile.add(roomFloor);

        // A thin square frame on the floor that breathes while the room is busy.
        const shape = new THREE.Shape();
        const hw = (roomW - 0.3) / 2;
        const hd = (roomD - 0.3) / 2;
        shape.moveTo(-hw, -hd).lineTo(hw, -hd).lineTo(hw, hd).lineTo(-hw, hd).lineTo(-hw, -hd);
        const hole = new THREE.Path();
        hole.moveTo(-hw + 0.05, -hd + 0.05).lineTo(-hw + 0.05, hd - 0.05).lineTo(hw - 0.05, hd - 0.05).lineTo(hw - 0.05, -hd + 0.05).lineTo(-hw + 0.05, -hd + 0.05);
        shape.holes.push(hole);
        const frame = new THREE.Mesh(
          new THREE.ShapeGeometry(shape),
          new THREE.MeshBasicMaterial({ color: CLINIC_COLORS.now, transparent: true, opacity: 0, depthWrite: false }),
        );
        frame.rotation.x = -Math.PI / 2;
        frame.position.set(x, 0.016, roomZ);
        tile.add(frame);

        const upholstery = new THREE.MeshStandardMaterial({ color: CHAIR.free, roughness: 0.75 });
        const chair = new THREE.Group();
        chair.position.set(x - 0.15, 0, roomZ + 0.05);
        const pedestal = new THREE.Mesh(geo.pedestal, taupe);
        pedestal.position.y = 0.18;
        const seat = new THREE.Mesh(geo.seat, upholstery);
        seat.position.set(0.1, 0.43, 0);
        const backrest = new THREE.Mesh(geo.back, upholstery);
        backrest.position.set(-0.78, 0.62, 0);
        backrest.rotation.z = 0.5;
        const head = new THREE.Mesh(geo.head, upholstery);
        head.position.set(-1.12, 0.84, 0);
        head.rotation.z = 0.5;
        chair.add(pedestal, seat, backrest, head);
        chair.userData.room = this.rooms.length;
        tile.add(chair);
        targets.push(chair);

        const trolley = new THREE.Mesh(geo.cart, cart);
        trolley.position.set(x + roomW / 2 - 0.42, 0.31, roomZ - 0.55);
        const tray = new THREE.Mesh(geo.tray, taupe);
        tray.position.set(x + roomW / 2 - 0.42, 0.64, roomZ - 0.55);
        const stool = new THREE.Mesh(geo.stool, taupe);
        stool.position.set(x + 0.55, 0.18, roomZ + 0.75);
        tile.add(trolley, tray, stool);

        // Like a sign by the door: just in front of the room, so it never hides the chair.
        const tag = el('scene-room', `<strong>${clinic.rooms[r]}</strong><span></span>`);
        stage.label(tag, chair, [0.15, 0.1, 1.05]);

        this.rooms.push({
          clinic: c,
          index: r,
          chair,
          upholstery,
          floor: floorMat,
          frame,
          chairTarget: new THREE.Color(CHAIR.free),
          floorTarget: new THREE.Color(FLOOR.free),
          state: null,
          tag,
          drop: stage.reducedMotion ? 1 : 0,
          delay: 0.25 + c * 0.12 + r * 0.08,
          pop: 0,
        });
      }

      tile.traverse((o) => {
        if (o instanceof THREE.Mesh && !(o.material instanceof THREE.MeshBasicMaterial)) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      stage.label(el('scene-clinic', `<strong>${clinic.name}</strong><span>${clinic.detail}</span>`), tile, [0.4, 0.05, D / 2 + 0.75]);
      this.root.add(tile);
      this.tiles.push(tile);
    });

    this.tip = stage.label(this.tipEl, this.root, [0, 0, 0]);
    this.tip.visible = false;
    stage.setHoverTargets(targets, (object) => {
      const room = object ? this.rooms[object.userData.room as number] : undefined;
      const info = room ? this.describe(room.clinic, room.index) : null;
      if (!object || !room || !info) {
        this.tip.visible = false;
        return;
      }
      this.tipEl.innerHTML = `<strong>${info.title}</strong><span>${info.detail}</span>`;
      const world = new THREE.Vector3();
      object.getWorldPosition(world);
      this.tip.position.set(world.x, 2.1, world.z);
      this.tip.visible = true;
    });

    const key = new THREE.DirectionalLight('#FFF6EC', 2.4);
    key.position.set(-7, 12, 9);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -11, right: 11, top: 10, bottom: -10, far: 45 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 4;
    const fill = new THREE.HemisphereLight('#FFFFFF', CLINIC_COLORS.sand, 0.45);
    stage.scene.add(key, fill);

    this.unsubscribe = stage.onFrame((time, delta) => this.frame(time, delta));
  }

  /** Sets each room's state and status line, in the order the rooms were given. */
  update(views: RoomView[][]) {
    let i = 0;
    views.forEach((clinic) =>
      clinic.forEach((view) => {
        const room = this.rooms[i++];
        if (!room) return;
        if (view.state !== room.state) {
          if (room.state !== null) room.pop = 1;
          room.state = view.state;
          room.chairTarget.set(CHAIR[view.state]);
          room.floorTarget.set(FLOOR[view.state]);
          room.tag.className = `scene-room scene-room--${view.state}`;
        }
        const status = room.tag.querySelector('span');
        if (status && status.textContent !== view.status) status.textContent = view.status;
      }),
    );
  }

  /** Zooms in on one clinic; null shows them all again. */
  focus(clinic: number | null) {
    this.focused = clinic;
    if (clinic === null) {
      this.stage.flyTo(OVERVIEW.camera, OVERVIEW.target);
    } else {
      const c = this.tileCenter(clinic);
      this.stage.flyTo([c.x + 1.2, 8.6, c.z + 6.2], [c.x, 0.2, c.z + 0.3]);
    }
  }

  dispose() {
    this.unsubscribe();
    this.stage.scene.remove(this.root);
  }

  /** The clinics stand on a diagonal, the first at the back on the left, so two of them fill a landscape view. */
  private tileCenter(clinic: number) {
    const step = clinic - (this.count - 1) / 2;
    return new THREE.Vector3(step * (W + 0.6), 0, step * (D + 0.8));
  }

  private frame(time: number, delta: number) {
    const k = 1 - Math.exp(-delta * 5);
    for (const room of this.rooms) {
      if (room.drop < 1 && time > room.delay) {
        room.drop = Math.min(1, room.drop + delta * 1.8);
        if (room.drop === 1) room.pop = 0.6;
      }
      room.chair.visible = room.drop > 0;
      room.pop = damp(room.pop, 0, 5, delta);
      room.chair.position.y = Math.pow(1 - room.drop, 3) * 1.8 + room.pop * 0.1;

      const dim = this.focused !== null && room.clinic !== this.focused;
      room.upholstery.color.lerp(dim ? room.chairTarget.clone().lerp(new THREE.Color('#E9E3DA'), 0.7) : room.chairTarget, k);
      room.floor.color.lerp(room.floorTarget, k);
      const busy = room.state === 'busy';
      room.upholstery.emissive.set(busy ? CLINIC_COLORS.now : '#000000');
      room.upholstery.emissiveIntensity = busy ? 0.25 + Math.sin(time * 2.6 + room.index) * 0.15 : 0;
      const frame = room.frame.material as THREE.MeshBasicMaterial;
      frame.opacity = damp(frame.opacity, busy && !dim ? 0.45 + Math.sin(time * 2.6 + room.index) * 0.25 : 0, 6, delta);
    }
  }
}
