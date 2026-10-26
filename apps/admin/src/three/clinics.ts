import { CLINIC_COLORS } from '@pure-clinics/shared';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { Client, figureKit, lookFor, SPOT_X, Therapist, type Spot } from './figures';
import { floatTag, Tokens } from './fx';
import { damp, easeOutCubic, el, type Stage, type Tip, type Vec } from './stage';

export type RoomState = 'busy' | 'free' | 'done' | 'off';

/** One clinic as the scene shows it: a name, a detail line and the specialist of each treatment room. */
export type ClinicSpec = { name: string; detail: string; rooms: string[] };

/**
 * Who is in the chair right now. The sign says "met Noor V." and, in narrow rooms, the treatment and "tot 14:15" on lines
 * of their own; `action` is what a click does, for screen readers.
 */
export type RoomClient = { id: string; name: string; with: string; treatment: string; until: string; action: string; spot: Spot };

export type RoomView = {
  state: RoomState;
  status: string;
  /** Whether the specialist is in: on a working day, while the clinic is open. */
  staffed: boolean;
  client: RoomClient | null;
};

export type RoomRef = { clinic: number; room: number };

const W = 7.2;
const D = 4.6;

/** Where the camera looks from when it shows both clinics. */
export const OVERVIEW = { camera: [2.5, 18.1, 17.1] as Vec, target: [0, 0, 0.55] as Vec };

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

/** The chair from headrest to footend, and the room it needs, in chair units. */
const CHAIR_LEFT = -1.28;
const CHAIR_RIGHT = 0.78;

type Room = {
  clinic: number;
  index: number;
  name: string;
  /** Chair, client and therapist together, scaled to fit the room. */
  station: THREE.Group;
  chair: THREE.Group;
  upholstery: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  frame: THREE.Mesh;
  chairTarget: THREE.Color;
  floorTarget: THREE.Color;
  state: RoomState | null;
  tag: HTMLDivElement;
  tagObject: CSS2DObject;
  who: HTMLSpanElement;
  status: HTMLSpanElement;
  until: HTMLSpanElement;
  /** Narrow rooms put the client on a line of her own; every other one hangs its sign on the back wall. */
  narrow: boolean;
  back: boolean;
  drop: number;
  delay: number;
  pop: number;
  therapist: Therapist;
  staffed: boolean;
  /** 0 out, 1 in the room. */
  staff: number;
  work: number;
  client: Client;
  /** Who the model shows in the chair, and who should be there; they differ while one leaves and the next arrives. */
  shown: RoomClient | null;
  wanted: RoomClient | null;
  seat: number;
  /** Seconds left of the glow after an online booking. */
  flash: number;
};

/**
 * The clinics as small architectural models on a diagonal, seen from above. In every treatment room the specialist
 * stands by the chair while she is in; a client lies in it while a treatment is going on, and the chair turns green.
 * Clicking a client flies into the room and opens her card next to the chair.
 */
export class ClinicsScene {
  private readonly root = new THREE.Group();
  private readonly rooms: Room[] = [];
  private readonly tiles: THREE.Group[] = [];
  private readonly tip: CSS2DObject;
  private readonly tipEl = el('scene-tip');
  private readonly card: CSS2DObject;
  /** The client card is rendered into this element by React; the scene only places it. */
  readonly cardElement = el('client-card-anchor');
  private cardRoom: Room | null = null;
  private returnTo: { position: Vec; target: Vec } | null = null;
  private readonly unsubscribe: () => void;
  private focused: number | null = null;
  private readonly count: number;
  private readonly fit: number;
  private readonly tokens: Tokens;
  /** Where each clinic's reception desk is: payments fly there. */
  private readonly desks: THREE.Vector3[] = [];

  constructor(
    private readonly stage: Stage,
    clinics: ClinicSpec[],
    private readonly describe: (clinic: number, room: number) => Tip | null,
    private readonly select: (room: RoomRef | null) => void,
  ) {
    stage.scene.add(this.root);
    this.count = clinics.length;
    this.tokens = new Tokens(this.root, 10);
    // Every chair the same size, small enough for the narrowest room.
    const narrowest = Math.min(...clinics.map((c) => (W - 0.3) / c.rooms.length));
    this.fit = Math.min(1, (narrowest - 0.26) / (CHAIR_RIGHT - CHAIR_LEFT));

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
    const kit = figureKit();

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
      this.desks.push(tile.position.clone().add(new THREE.Vector3(-W / 2 + 1.25, 0.9, D / 2 - 0.75)));
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

        // The chair reclines toward the headrest; the station is centred in the room.
        const station = new THREE.Group();
        station.position.set(x - ((CHAIR_LEFT + CHAIR_RIGHT) / 2) * this.fit, 0, roomZ + 0.05);
        station.scale.setScalar(this.fit);
        station.userData.room = this.rooms.length;
        const upholstery = new THREE.MeshStandardMaterial({ color: CHAIR.free, roughness: 0.75 });
        const chair = new THREE.Group();
        const pedestal = new THREE.Mesh(geo.pedestal, taupe);
        pedestal.position.y = 0.18;
        const seat = new THREE.Mesh(geo.seat, upholstery);
        seat.position.set(0.1, 0.43, 0);
        const backrest = new THREE.Mesh(geo.back, upholstery);
        backrest.position.set(-0.78, 0.62, 0);
        backrest.rotation.z = -0.5;
        const head = new THREE.Mesh(geo.head, upholstery);
        head.position.set(-1.12, 0.84, 0);
        head.rotation.z = -0.5;
        const client = new Client(kit);
        client.opacity = 0;
        chair.add(pedestal, seat, backrest, head, client.group);
        // The specialist stands behind the chair, facing the client and the viewer.
        const therapist = new Therapist(kit, lookFor(clinic.rooms[r], ['bun', 'tail', 'bob', 'crop']));
        therapist.group.position.set(SPOT_X.idle, 0, -0.64);
        therapist.opacity = 0;
        station.add(chair, therapist.group);
        tile.add(station);
        targets.push(station);

        const trolley = new THREE.Mesh(geo.cart, cart);
        trolley.position.set(x + roomW / 2 - 0.42, 0.31, roomZ - 0.55);
        const tray = new THREE.Mesh(geo.tray, taupe);
        tray.position.set(x + roomW / 2 - 0.42, 0.64, roomZ - 0.55);
        const stool = new THREE.Mesh(geo.stool, taupe);
        stool.position.set(x + 0.55, 0.18, roomZ + 0.75);
        tile.add(trolley, tray, stool);

        // Like a sign by the door, just in front of the room; in narrow rooms every other sign hangs on the back wall,
        // so neighbouring signs never cover each other.
        const narrow = roomW < 2.4;
        const back = narrow && r % 2 === 1;
        const tag = el(
          'scene-room',
          `<strong>${clinic.rooms[r]}<span class="scene-room-who"></span></strong><span class="scene-room-status"></span><span class="scene-room-until"></span>`,
        );
        const index = this.rooms.length;
        const open = () => {
          if (this.rooms[index].wanted) this.select({ clinic: c, room: r });
        };
        tag.addEventListener('click', open);
        tag.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open();
          }
        });
        // Signs never cover their room: a front sign hangs below the room's open side, a back sign stands on the wall.
        const tagObject = stage.label(tag, tile, back ? [x, 1.56, -D / 2 + 0.12] : [x, 0.1, roomZ + roomD / 2 + 0.04]);
        tagObject.center.set(0.5, back ? 1 : 0);

        this.rooms.push({
          clinic: c,
          index: r,
          name: clinic.rooms[r],
          station,
          chair,
          upholstery,
          floor: floorMat,
          frame,
          chairTarget: new THREE.Color(CHAIR.free),
          floorTarget: new THREE.Color(FLOOR.free),
          state: null,
          tag,
          tagObject,
          who: tag.querySelector('.scene-room-who')!,
          status: tag.querySelector('.scene-room-status')!,
          until: tag.querySelector('.scene-room-until')!,
          back,
          narrow,
          drop: stage.reducedMotion ? 1 : 0,
          delay: 0.25 + c * 0.12 + r * 0.08,
          pop: 0,
          therapist,
          staffed: false,
          staff: 0,
          work: 0,
          client,
          shown: null,
          wanted: null,
          seat: 0,
          flash: 0,
        });
      }

      tile.traverse((o) => {
        if (o instanceof THREE.Mesh && !(o.material instanceof THREE.MeshBasicMaterial)) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      stage.label(el('scene-clinic', `<strong>${clinic.name}</strong><span>${clinic.detail}</span>`), tile, [0.4, 0.05, D / 2 + 1.38]);
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
      this.tipEl.innerHTML = `<strong>${info.title}</strong><span>${info.detail}</span>${info.hint ? `<em>${info.hint}</em>` : ''}`;
      const world = new THREE.Vector3();
      object.getWorldPosition(world);
      this.tip.position.set(world.x, 2.1, world.z);
      this.tip.visible = true;
    });
    stage.onSelect(
      (object) => {
        const room = object ? this.rooms[object.userData.room as number] : undefined;
        this.select(room ? { clinic: room.clinic, room: room.index } : null);
      },
      (object) => Boolean(this.rooms[object.userData.room as number]?.wanted),
    );

    this.card = stage.label(this.cardElement, this.root, [0, 0, 0]);
    this.card.visible = false;

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

  /** Sets each room's state, status line, specialist and client, in the order the rooms were given. */
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
        }
        room.staffed = view.staffed;
        room.wanted = view.client;

        const who = view.client?.with ?? '';
        // Narrow rooms stack the busy sign: name, client, treatment, until when.
        const stacked = room.narrow && view.client;
        const status = stacked ? view.client!.treatment : view.status;
        const until = stacked ? view.client!.until : '';
        if (room.who.textContent !== who) room.who.textContent = who;
        if (room.status.textContent !== status) room.status.textContent = status;
        if (room.until.textContent !== until) room.until.textContent = until;
        const className = `scene-room scene-room--${view.state} scene-room--${room.narrow ? 'narrow' : 'wide'}${view.client ? ' scene-room--client' : ''}`;
        if (room.tag.className !== className) room.tag.className = className;
        // A room with a client in it is a button: Enter on its sign opens her card.
        if (view.client) {
          room.tag.tabIndex = 0;
          room.tag.setAttribute('role', 'button');
          room.tag.setAttribute('aria-label', `${room.name} · ${who} · ${view.status}. ${view.client.action}`);
        } else if (room.tag.hasAttribute('role')) {
          room.tag.removeAttribute('tabindex');
          room.tag.removeAttribute('role');
          room.tag.removeAttribute('aria-label');
        }
      }),
    );
  }

  /** Zooms in on one clinic; null shows them all again. */
  focus(clinic: number | null) {
    this.closeCard(false);
    this.focused = clinic;
    if (clinic === null) {
      this.stage.flyTo(OVERVIEW.camera, OVERVIEW.target);
    } else {
      const c = this.tileCenter(clinic);
      this.stage.flyTo([c.x + 1.2, 8.6, c.z + 6.2], [c.x, 0.2, c.z + 0.3]);
    }
  }

  /**
   * Flies into a room and shows the card element next to its chair, where it stays when the view is turned. On a wide
   * view the card stands to the right of the chair; on a narrow one it floats above it.
   */
  openCard(clinic: number, index: number) {
    const room = this.rooms.find((r) => r.clinic === clinic && r.index === index);
    if (!room) return;
    if (!this.cardRoom) this.returnTo = this.stage.pose();
    this.cardRoom = room;
    const host = this.stage.host;
    host.classList.add('has-card');
    // Reading the size after the class is set: on a phone the view grows to make room for the card, so the camera is
    // fitted to the new size right away rather than on the next resize callback.
    this.stage.resize();
    const width = host.clientWidth;
    const height = host.clientHeight;
    const narrow = width < 560;
    const cardWidth = Math.min(372, width - 24);

    const camera = this.stage.camera;
    const distance = narrow ? 7 : 7.2;
    const pixels = ((height / 2) * camera.zoom) / (distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const direction = new THREE.Vector3(0.2, 0.62, 0.76).normalize();
    const forward = direction.clone().negate();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();

    const station = room.station.getWorldPosition(new THREE.Vector3());
    const fit = this.fit;
    let anchor: THREE.Vector3;
    let screen: [number, number];
    let maxHeight: number;
    if (!narrow) {
      // Chair on the left, card on the right, the two centred together.
      anchor = station.clone().add(new THREE.Vector3((CHAIR_RIGHT + 0.24) * fit, 0.85 * fit, 0));
      const chairToAnchor = (CHAIR_RIGHT + 0.24 - CHAIR_LEFT) * fit * pixels;
      const total = chairToAnchor + cardWidth;
      screen = [Math.max(12, (width - total) / 2) + chairToAnchor, height / 2];
      this.card.center.set(0, 0.5);
      maxHeight = height - 24;
    } else {
      // Card above, chair and specialist below it.
      anchor = station.clone().add(new THREE.Vector3(-0.24 * fit, 2.05 * fit, -0.3 * fit));
      screen = [width / 2, height - 1.9 * fit * pixels - 36];
      this.card.center.set(0.5, 1);
      maxHeight = screen[1] - 12;
    }
    this.cardElement.style.setProperty('--card-w', `${cardWidth}px`);
    this.cardElement.style.setProperty('--card-max', `${Math.max(180, maxHeight)}px`);
    this.card.position.copy(anchor);
    this.card.visible = true;

    const target = anchor
      .clone()
      .addScaledVector(right, -(screen[0] - width / 2) / pixels)
      .addScaledVector(up, (screen[1] - height / 2) / pixels);
    const position = target.clone().addScaledVector(direction, distance);
    this.stage.hold(true);
    this.stage.flyTo(position.toArray() as Vec, target.toArray() as Vec, 1300);
  }

  /** Hides the card; with `flyBack` the camera returns to where it was before the card opened. */
  closeCard(flyBack: boolean) {
    if (!this.cardRoom) return;
    this.cardRoom = null;
    this.card.visible = false;
    this.stage.host.classList.remove('has-card');
    this.stage.hold(false);
    if (flyBack && this.returnTo) this.stage.flyTo(this.returnTo.position, this.returnTo.target, 1200);
    this.returnTo = null;
  }

  /** A treatment was paid at the desk: a coin flies from the room to reception, where the amount rises. */
  pay(clinic: number, index: number, amount: string, fast: boolean) {
    const room = this.rooms.find((r) => r.clinic === clinic && r.index === index);
    if (!room || this.stage.reducedMotion) return;
    const from = room.station.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(-0.15, 0.8, 0));
    const desk = this.desks[clinic];
    this.tokens.fire(from, desk, {
      color: '#C9A46C',
      duration: fast ? 0.8 : 1.5,
      height: 1.5,
      scale: 1.3,
      // The amount rises just beside the desk, over open floor rather than over the room signs.
      onLand: () => floatTag(this.root, desk.clone().add(new THREE.Vector3(-0.75, 0.35, 0.35)), 'scene-pay', amount, fast ? 1.2 : 2),
    });
  }

  /** An online booking came in for this room: its floor glows and the booked time floats up. */
  booked(clinic: number, index: number, text: string, fast: boolean) {
    const room = this.rooms.find((r) => r.clinic === clinic && r.index === index);
    if (!room || this.stage.reducedMotion) return;
    room.flash = fast ? 1.6 : 3.2;
    const above = room.station.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.95, 0.45));
    floatTag(this.root, above, 'scene-flash', text, fast ? 1.6 : 3.2);
  }

  /** The sign of a room, to give focus back to it when its card closes. */
  roomTag(clinic: number, index: number): HTMLElement | null {
    return this.rooms.find((r) => r.clinic === clinic && r.index === index)?.tag ?? null;
  }

  dispose() {
    this.unsubscribe();
    this.tokens.dispose();
    this.stage.scene.remove(this.root);
  }

  /** The clinics stand on a diagonal, the first at the back on the left, so two of them fill a landscape view. */
  private tileCenter(clinic: number) {
    const step = clinic - (this.count - 1) / 2;
    return new THREE.Vector3(step * (W + 0.6), 0, step * (D + 0.8));
  }

  private labelScale = 0;

  private frame(time: number, delta: number) {
    this.tokens.update(delta);
    // Signs shrink a little when the camera is far out, so the rooms stay readable; close up they are full size.
    const distance = this.stage.camera.position.distanceTo(this.stage.controls.target);
    const scale = Math.round(THREE.MathUtils.clamp(1 - (distance - 11) * 0.012, 0.9, 1) * 100) / 100;
    if (scale !== this.labelScale) {
      this.labelScale = scale;
      this.stage.host.style.setProperty('--label-scale', String(scale));
    }
    const k = 1 - Math.exp(-delta * 5);
    const instant = this.stage.reducedMotion;
    for (const room of this.rooms) {
      if (room.drop < 1 && time > room.delay) {
        room.drop = Math.min(1, room.drop + delta * 1.8);
        if (room.drop === 1) room.pop = 0.6;
      }
      room.chair.visible = room.drop > 0;
      room.tagObject.visible = room.drop > 0.5;
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

      // After an online booking the floor glows warm for a moment.
      if (room.flash > 0) {
        room.flash = Math.max(0, room.flash - delta);
        room.floor.emissive.set('#F0DFC2');
        room.floor.emissiveIntensity = Math.sin(Math.min(1, room.flash / 0.6) * Math.PI * 0.5) * (0.55 + Math.sin(time * 9) * 0.15);
      } else if (room.floor.emissiveIntensity) {
        room.floor.emissiveIntensity = 0;
      }

      // Figures come in once the chair has landed.
      const ready = room.drop >= 1;
      this.moveClient(room, ready, delta, instant);
      this.moveTherapist(room, ready, time, delta, instant);
    }
  }

  /** One client leaves before the next one lies down: fade out while getting up, fade in while settling. */
  private moveClient(room: Room, ready: boolean, delta: number, instant: boolean) {
    const wanted = ready ? room.wanted : null;
    if ((room.shown?.id ?? null) !== (wanted?.id ?? null)) {
      if (room.shown && room.seat > 0) {
        room.seat = instant ? 0 : Math.max(0, room.seat - delta * 2.4);
      } else {
        room.shown = wanted;
        if (wanted) room.client.look = lookFor(wanted.name, ['bob', 'crop', 'bun']);
      }
    } else if (room.shown && room.seat < 1) {
      room.seat = instant ? 1 : Math.min(1, room.seat + delta * 1.8);
    }
    if (room.shown && wanted?.id === room.shown.id) room.shown = wanted;
    const eased = easeOutCubic(room.seat);
    room.client.opacity = eased;
    room.client.group.position.y = (1 - eased) * 0.34;
  }

  /** The specialist rises into the room when she starts, steps to the client's side, and treats. */
  private moveTherapist(room: Room, ready: boolean, time: number, delta: number, instant: boolean) {
    const present = ready && room.staffed;
    room.staff = instant ? (present ? 1 : 0) : Math.min(1, Math.max(0, room.staff + (present ? delta * 1.6 : -delta * 1.6)));
    const eased = easeOutCubic(room.staff);
    room.therapist.opacity = eased;
    room.therapist.body.position.y = (eased - 1) * 0.16;

    const treating = Boolean(room.shown) && room.seat > 0.6;
    const spot = treating && room.shown ? SPOT_X[room.shown.spot] : SPOT_X.idle;
    const turn = treating ? -0.28 : 1.15;
    const group = room.therapist.group;
    if (instant || room.staff < 0.05) {
      group.position.x = spot;
      group.rotation.y = turn;
    } else {
      group.position.x = damp(group.position.x, spot, 3.2, delta);
      group.rotation.y = damp(group.rotation.y, turn, 3.2, delta);
    }
    room.work = instant ? (treating ? 1 : 0) : damp(room.work, treating ? 1 : 0, 3, delta);
    room.therapist.pose(room.work, time);
  }
}
