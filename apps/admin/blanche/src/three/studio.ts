import { POLISH, SHADES } from '@pure-clinics/shared/src/blanche';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { floatTag, Tokens } from '../../../src/three/fx';
import { damp, el, type Stage, type Tip, type Vec } from '../../../src/three/stage';
import { rng } from '../../../src/data/random';
import { lookFor, Person, peopleKit, type PeopleKit } from './people';

export type StationState = 'busy' | 'free' | 'done' | 'off';

/** One station as the scene shows it: the stylist, what is going on, and the client in the chair. */
export type StationView = {
  state: StationState;
  status: string;
  staffed: boolean;
  client: { id: string; name: string; with: string } | null;
};

export type Waiting = { id: string; name: string };

export type StudioLabels = { stylists: string[]; crafts: string[]; desk: string; wall: string; sofa: string; hint: string };

/** Where the camera looks from when it shows the whole studio. */
export const OVERVIEW = { camera: [6.4, 8.4, 10.6] as Vec, target: [-0.2, 0.5, 0.1] as Vec };

const CRAFT = [SHADES.cherry, SHADES.cherry, SHADES.lilac];

type Station = {
  index: number;
  root: THREE.Group;
  pad: THREE.MeshStandardMaterial;
  padTarget: THREE.Color;
  stylist: Person;
  client: Person;
  /** 0 away, 1 in. */
  staff: number;
  seat: number;
  shown: StationView['client'];
  wanted: StationView['client'];
  staffed: boolean;
  state: StationState | null;
  tag: HTMLDivElement;
  status: HTMLSpanElement;
  who: HTMLSpanElement;
  flash: number;
  /** Where coins start and hearts rise. */
  spot: THREE.Vector3;
  bed: boolean;
};

const mat = (color: string, roughness = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, ...extra });

function box(w: number, h: number, d: number, material: THREE.Material, r = 0.04) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2)), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cylinder(radius: number, height: number, material: THREE.Material, top = radius, segments = 24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(top, radius, height, segments), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** The logo's script, drawn once on a canvas for the back wall. Waits for the web font so it is not a fallback. */
function scriptSign(text: string, color: string): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 340;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '210px "Pinyon Script", cursive';
    ctx.fillText(text, 512, 150);
    ctx.font = '64px "Instrument Serif", serif';
    ctx.fillText('B E A U T Y', 530, 290);
    texture.needsUpdate = true;
  };
  draw();
  Promise.all([document.fonts.load('210px "Pinyon Script"'), document.fonts.load('64px "Instrument Serif"')])
    .then(draw)
    .catch(() => {});
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  return new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.2), material);
}

/**
 * Blanche's studio as a small, bright model: two nail tables, the lash & brow bed, the colour wall, the desk and the
 * waiting sofa. Each stylist sits at her station while she works; clients sit down, lie on the bed or wait on the
 * sofa as the day goes; payments fly to the desk as coins and shop orders hop off the colour wall.
 */
export class StudioScene {
  private readonly root = new THREE.Group();
  private readonly kit: PeopleKit = peopleKit();
  private readonly stations: Station[] = [];
  private readonly sofa: { person: Person; wanted: Waiting | null; shown: Waiting | null; fade: number }[] = [];
  private readonly tokens: Tokens;
  private readonly desk = new THREE.Vector3(3.9, 1.0, 2.5);
  private readonly wall = new THREE.Vector3(0.9, 1.4, -4.1);
  private readonly bottles: THREE.Mesh[] = [];
  private readonly hops: { mesh: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; t: number }[] = [];
  private readonly tipEl = el('scene-tip');
  private readonly tip: CSS2DObject;
  private readonly unsubscribe: () => void;

  constructor(
    private readonly stage: Stage,
    labels: StudioLabels,
    private readonly describe: (station: number) => Tip | null,
    private readonly select: (clientId: string | null) => void,
  ) {
    stage.scene.add(this.root);
    this.tokens = new Tokens(this.root, 10);
    this.buildRoom(labels);
    this.buildStations(labels);
    this.buildSofa();

    this.tip = new CSS2DObject(this.tipEl);
    this.tip.visible = false;
    this.root.add(this.tip);

    const targets = [...this.stations.flatMap((s) => [s.client.group, s.stylist.group]), ...this.sofa.map((s) => s.person.group)];
    stage.setHoverTargets(targets, (object) => this.hover(object));
    stage.onSelect(
      (object) => {
        const station = this.stations.find((s) => s.client.group === object);
        const waiting = this.sofa.find((s) => s.person.group === object);
        this.select(station?.shown?.id ?? waiting?.shown?.id ?? null);
      },
      (object) => this.stations.some((s) => s.client.group === object && s.shown) || this.sofa.some((s) => s.person.group === object && s.shown),
    );
    this.unsubscribe = stage.onFrame((time, delta) => this.frame(time, delta));
  }

  private buildRoom(labels: StudioLabels) {
    const floor = box(13.4, 0.26, 9.4, mat('#FFFFFF', 0.85), 0.12);
    floor.position.y = -0.13;
    this.root.add(floor);
    // Terrazzo-like flecks in the studio colours.
    const flecks = new THREE.InstancedMesh(new THREE.CircleGeometry(0.035, 5), mat('#F7DDE5', 0.9), 120);
    const m = new THREE.Matrix4();
    const scatter = rng('blanche-terrazzo');
    for (let i = 0; i < 120; i++) {
      const x = scatter() * 13 - 6.5;
      const z = scatter() * 9 - 4.5;
      m.makeRotationX(-Math.PI / 2).multiply(new THREE.Matrix4().makeRotationZ(scatter() * Math.PI)).setPosition(x, 0.002, z);
      flecks.setMatrixAt(i, m);
      flecks.setColorAt(i, new THREE.Color(['#F9E3EA', '#EEE9FB', '#FBF0D6', '#EFECF3'][i % 4]));
    }
    this.root.add(flecks);

    const back = box(13.4, 2.6, 0.2, mat('#FFE9EF', 0.9), 0.06);
    back.position.set(0, 1.3, -4.6);
    const side = box(0.2, 2.6, 9.4, mat('#F1ECFF', 0.9), 0.06);
    side.position.set(-6.6, 1.3, 0);
    const stripe = box(13.4, 0.12, 0.24, mat(SHADES.cherry.ink, 0.5), 0.04);
    stripe.position.set(0, 0.06, -4.5);
    this.root.add(back, side, stripe);

    const sign = scriptSign('Blanche', '#141114');
    sign.position.set(-2.6, 1.72, -4.48);
    this.root.add(sign);

    // The colour wall: shelves of gel bottles in every shade.
    const shelf = mat('#E9D8B8', 0.5);
    for (let row = 0; row < 4; row++) {
      const board = box(2.5, 0.05, 0.26, shelf, 0.02);
      board.position.set(this.wall.x, 0.75 + row * 0.42, -4.36);
      this.root.add(board);
      for (let i = 0; i < 9; i++) {
        const shade = POLISH[(row * 9 + i) % POLISH.length];
        const bottle = cylinder(0.065, 0.16, mat(shade.hex, 0.25, { metalness: shade.finish === 'chrome' ? 0.6 : 0.05 }));
        bottle.position.set(this.wall.x - 1.1 + i * 0.275, 0.86 + row * 0.42, -4.32);
        const cap = cylinder(0.03, 0.1, mat('#141114', 0.4));
        cap.position.y = 0.13;
        bottle.add(cap);
        this.root.add(bottle);
        this.bottles.push(bottle);
      }
    }
    this.areaLabel(labels.wall, [this.wall.x, 2.6, -4.2]);

    // The desk by the door, in cherry, with the till where payments land.
    const deskBody = box(2.2, 0.95, 0.9, mat(SHADES.cherry.ink, 0.45), 0.12);
    deskBody.position.set(4.3, 0.48, 2.6);
    const deskTop = box(2.35, 0.06, 1.0, mat('#FFFFFF', 0.4), 0.03);
    deskTop.position.set(4.3, 0.98, 2.6);
    const till = box(0.36, 0.22, 0.3, mat('#141114', 0.35), 0.05);
    till.position.set(this.desk.x, 1.12, this.desk.z - 0.1);
    const vase = cylinder(0.09, 0.3, mat('#FFFFFF', 0.3));
    vase.position.set(5.0, 1.16, 2.5);
    for (let i = 0; i < 5; i++) {
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), mat(['#FF8DB3', '#FFFFFF', '#FFC9DA', '#F7E08E', '#FF8DB3'][i], 0.5));
      flower.position.set(5.0 + Math.cos(i * 1.3) * 0.09, 1.42 + (i % 2) * 0.06, 2.5 + Math.sin(i * 1.3) * 0.09);
      this.root.add(flower);
    }
    this.root.add(deskBody, deskTop, till, vase);
    this.areaLabel(labels.desk, [4.3, 1.75, 2.6]);

    // Plants in the corners.
    for (const [x, z] of [
      [-6.0, -4.0],
      [6.1, -4.0],
      [-6.0, 3.9],
    ]) {
      const pot = cylinder(0.22, 0.42, mat('#FFFFFF', 0.4), 0.26);
      pot.position.set(x, 0.21, z);
      const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), mat('#7FB89A', 0.7, { flatShading: true }));
      leaves.position.set(x, 0.78, z);
      leaves.scale.set(1, 1.25, 1);
      leaves.castShadow = true;
      this.root.add(pot, leaves);
    }
  }

  private buildStations(labels: StudioLabels) {
    const places: { x: number; z: number; bed: boolean }[] = [
      { x: -4.6, z: -1.6, bed: false },
      { x: -1.2, z: -1.6, bed: false },
      { x: 3.4, z: -1.5, bed: true },
    ];
    places.forEach((place, index) => {
      const root = new THREE.Group();
      root.position.set(place.x, 0, place.z);
      this.root.add(root);
      const craft = CRAFT[index];
      const pad = mat('#FFFFFF', 0.9);
      const rug = box(place.bed ? 3.4 : 2.4, 0.03, place.bed ? 2.4 : 2.7, pad, 0.4);
      rug.position.y = 0.015;
      rug.receiveShadow = true;
      rug.castShadow = false;
      root.add(rug);

      const stylist = new Person(this.kit, { skin: ['#D9A988', '#F3DCCB', '#8E6044'][index], hair: ['#24191A', '#A06A45', '#3E2A22'][index], style: (['bun', 'pony', 'long'] as const)[index], top: '#1F1B22', bottom: '#1F1B22' }, craft.ink);
      const client = new Person(this.kit, lookFor(`seed-${index}`));
      client.opacity = 0;
      root.add(stylist.group, client.group);

      if (!place.bed) {
        const table = box(1.4, 0.07, 0.78, mat('#FFFFFF', 0.35), 0.03);
        table.position.y = 0.74;
        const leg = box(1.2, 0.7, 0.6, mat(craft.soft, 0.6), 0.1);
        leg.position.y = 0.36;
        const lampArm = cylinder(0.018, 0.55, mat('#141114', 0.4));
        lampArm.position.set(0.55, 1.03, -0.22);
        lampArm.rotation.z = 0.35;
        const lampShade = cylinder(0.14, 0.14, mat(craft.ink, 0.4, { side: THREE.DoubleSide }), 0.05);
        lampShade.position.set(0.45, 1.3, -0.12);
        lampShade.rotation.z = -0.6;
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), mat('#FFF5D6', 0.2, { emissive: '#FFE7A8', emissiveIntensity: 1.6 }));
        bulb.position.set(0.42, 1.25, -0.11);
        const uv = box(0.32, 0.12, 0.26, mat('#FFFFFF', 0.3), 0.05);
        uv.position.set(-0.45, 0.84, 0.05);
        const glow = box(0.24, 0.02, 0.2, mat('#C9B8FF', 0.2, { emissive: '#B49CFF', emissiveIntensity: 1.2 }), 0.01);
        glow.position.set(-0.45, 0.79, 0.05);
        root.add(table, leg, lampArm, lampShade, bulb, uv, glow);
        for (let i = 0; i < 4; i++) {
          const bottle = cylinder(0.04, 0.1, mat(POLISH[(index * 5 + i * 3) % POLISH.length].hex, 0.25));
          bottle.position.set(0.18 + i * 0.1, 0.83, -0.28);
          root.add(bottle);
        }
        for (const z of [-0.78, 0.8]) {
          const stool = cylinder(0.2, 0.46, mat(z < 0 ? '#141114' : craft.ink, 0.45), 0.22);
          stool.position.set(0, 0.23, z);
          root.add(stool);
        }
        stylist.group.position.set(0, 0, -0.78);
        stylist.sit(0.46);
        client.group.position.set(0, 0, 0.8);
        client.group.rotation.y = Math.PI;
        client.sit(0.46);
      } else {
        const base = box(2.0, 0.5, 0.62, mat('#FFFFFF', 0.4), 0.08);
        base.position.y = 0.25;
        const cushion = box(2.15, 0.16, 0.78, mat(craft.soft, 0.55), 0.08);
        cushion.position.y = 0.58;
        const pillow = box(0.42, 0.12, 0.58, mat('#FFFFFF', 0.6), 0.06);
        pillow.position.set(0.82, 0.71, 0);
        const stool = cylinder(0.2, 0.46, mat('#141114', 0.45), 0.22);
        stool.position.set(1.45, 0.23, 0);
        // The ring light lash artists swear by.
        const stand = cylinder(0.02, 1.3, mat('#141114', 0.4));
        stand.position.set(1.15, 0.65, -0.62);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 12, 40), mat('#FFFFFF', 0.2, { emissive: '#FFFFFF', emissiveIntensity: 1.1 }));
        ring.position.set(1.15, 1.32, -0.62);
        ring.rotation.y = Math.PI / 2.6;
        root.add(base, cushion, pillow, stool, stand, ring);
        stylist.group.position.set(1.45, 0, 0);
        stylist.group.rotation.y = -Math.PI / 2;
        stylist.sit(0.46);
        client.group.position.set(0, 0, 0);
        client.lie(0.58);
      }

      const tag = el('station-tag');
      tag.style.setProperty('--craft', craft.ink);
      tag.style.setProperty('--soft', craft.soft);
      tag.innerHTML = `<b>${labels.stylists[index]}</b><span class="status"></span><span class="who"></span>`;
      tag.title = labels.crafts[index];
      // While someone is in the chair, the sign opens her card too (and Enter does, for keyboard users).
      const open = () => {
        const shown = this.stations[index]?.shown;
        if (shown) this.select(shown.id);
      };
      tag.addEventListener('click', open);
      tag.addEventListener('keydown', (event) => event.key === 'Enter' && open());
      const label = new CSS2DObject(tag);
      label.position.set(place.bed ? 0.4 : 0, place.bed ? 1.9 : 2.0, place.bed ? -0.2 : -0.9);
      root.add(label);
      this.stations.push({
        index,
        root,
        pad,
        padTarget: new THREE.Color('#FFFFFF'),
        stylist,
        client,
        staff: 0,
        seat: 0,
        shown: null,
        wanted: null,
        staffed: false,
        state: null,
        tag,
        status: tag.querySelector('.status') as HTMLSpanElement,
        who: tag.querySelector('.who') as HTMLSpanElement,
        flash: 0,
        spot: new THREE.Vector3(place.x, 1.0, place.z),
        bed: place.bed,
      });
    });
  }

  private buildSofa() {
    const sofa = new THREE.Group();
    sofa.position.set(-3.9, 0, 2.9);
    const fabric = mat('#FFE58F', 0.75);
    const seat = box(2.4, 0.4, 0.86, fabric, 0.14);
    seat.position.y = 0.26;
    const back = box(2.4, 0.62, 0.24, fabric, 0.12);
    back.position.set(0, 0.6, 0.36);
    const armL = box(0.26, 0.56, 0.86, fabric, 0.12);
    armL.position.set(-1.23, 0.36, 0);
    const armR = armL.clone();
    armR.position.x = 1.23;
    const table = box(0.9, 0.36, 0.5, mat('#FFFFFF', 0.4), 0.06);
    table.position.set(0, 0.18, -0.95);
    const mag = box(0.32, 0.03, 0.24, mat(SHADES.cherry.ink, 0.5), 0.01);
    mag.position.set(-0.1, 0.38, -0.95);
    mag.rotation.y = 0.3;
    sofa.add(seat, back, armL, armR, table, mag);
    this.root.add(sofa);
    for (let i = 0; i < 3; i++) {
      const person = new Person(this.kit, lookFor(`sofa-${i}`));
      person.group.position.set(-0.75 + i * 0.75, 0, 0.12);
      person.group.rotation.y = Math.PI;
      person.sit(0.42);
      person.opacity = 0;
      sofa.add(person.group);
      this.sofa.push({ person, wanted: null, shown: null, fade: 0 });
    }
    this.areaLabel('', [-3.9, 1.7, 2.9]);
  }

  private areaLabel(text: string, at: Vec) {
    if (!text) return;
    const object = new CSS2DObject(el('area-tag', text));
    object.position.set(...at);
    this.root.add(object);
  }

  /** Updates who is where; the figures fade and the labels change on the next frames. */
  update(views: StationView[], waiting: Waiting[]) {
    views.forEach((view, i) => {
      const s = this.stations[i];
      if (!s) return;
      s.wanted = view.client;
      s.staffed = view.staffed;
      s.status.textContent = view.status;
      s.who.textContent = view.client ? view.client.with : '';
      if (view.state !== s.state) {
        s.state = view.state;
        s.tag.dataset.state = view.state;
        s.tag.tabIndex = view.client ? 0 : -1;
        s.tag.setAttribute('role', view.client ? 'button' : 'note');
        s.padTarget.set(view.state === 'busy' ? CRAFT[i].soft : view.state === 'off' ? '#EEEAF0' : '#FFFFFF');
      }
    });
    this.sofa.forEach((seat, i) => {
      seat.wanted = waiting[i] ?? null;
    });
  }

  /** A payment: a coin in the craft's colour flies from the station to the desk, and the amount floats up. */
  pay(station: number, text: string, fast: boolean) {
    const s = this.stations[station];
    if (!s) return;
    this.tokens.fire(s.spot.clone(), this.desk.clone(), {
      color: CRAFT[station].ink,
      duration: fast ? 0.7 : 1.3,
      height: 1.8,
      onLand: () => floatTag(this.root, this.desk.clone().add(new THREE.Vector3(0, 0.5, 0)), 'float-tag money', text, fast ? 1.2 : 2),
    });
  }

  /** A booking from the app: the station glows and a tag floats up. */
  booked(station: number, text: string) {
    const s = this.stations[station];
    if (!s) return;
    s.flash = 1.6;
    floatTag(this.root, s.spot.clone().add(new THREE.Vector3(0, 1.4, 0)), 'float-tag booking', text, 2.2);
  }

  /** A post that tags the studio: a heart rises from the station. */
  tagged(station: number) {
    const s = this.stations[station];
    if (!s) return;
    floatTag(this.root, s.spot.clone().add(new THREE.Vector3(0.2, 1.6, 0)), 'float-tag heart', '♥', 2);
  }

  /** A shop order: a bottle hops off the colour wall to the desk. */
  order(text: string) {
    const source = this.bottles[Math.floor(Math.random() * this.bottles.length)];
    const mesh = source.clone();
    mesh.position.copy(source.getWorldPosition(new THREE.Vector3()));
    this.root.add(mesh);
    this.hops.push({ mesh, from: mesh.position.clone(), to: this.desk.clone().add(new THREE.Vector3(-0.5, 0.15, 0.1)), t: 0 });
    window.setTimeout(() => floatTag(this.root, this.desk.clone().add(new THREE.Vector3(-0.4, 0.6, 0)), 'float-tag shop', text, 2), 900);
  }

  /** The station's tag, for keyboard focus after the card closes. */
  stationTag(index: number): HTMLElement | null {
    return this.stations[index]?.tag ?? null;
  }

  private hover(object: THREE.Object3D | null) {
    const station = this.stations.find((s) => s.client.group === object || s.stylist.group === object);
    const sofa = this.sofa.find((s) => s.person.group === object);
    let tip: Tip | null = null;
    if (station) tip = this.describe(station.index);
    else if (sofa?.shown) tip = { title: sofa.shown.name, detail: '' };
    if (!tip || !object) {
      this.tip.visible = false;
      return;
    }
    this.tipEl.innerHTML = `<strong>${tip.title}</strong><span>${tip.detail}</span>${tip.hint ? `<em>${tip.hint}</em>` : ''}`;
    object.getWorldPosition(this.tip.position);
    this.tip.position.y += station?.bed && object === station.client.group ? 1.0 : 1.9;
    this.tip.visible = true;
  }

  private frame(time: number, delta: number) {
    for (const s of this.stations) {
      s.pad.color.lerp(s.padTarget, 1 - Math.exp(-6 * delta));
      if (s.flash > 0) {
        s.flash = Math.max(0, s.flash - delta);
        s.pad.emissive.set(CRAFT[s.index].ink);
        s.pad.emissiveIntensity = Math.sin((s.flash / 1.6) * Math.PI) * 0.45;
      } else s.pad.emissiveIntensity = 0;

      s.staff = damp(s.staff, s.staffed ? 1 : 0, 6, delta);
      s.stylist.opacity = s.staff;
      // A new client: the old one fades out first, then the new one fades in.
      if (s.shown?.id !== s.wanted?.id) {
        s.seat = damp(s.seat, 0, 9, delta);
        if (s.seat < 0.02) {
          s.shown = s.wanted;
          if (s.shown) s.client.look = lookFor(s.shown.name);
        }
      } else {
        s.seat = damp(s.seat, s.shown ? 1 : 0, 5, delta);
      }
      s.client.opacity = s.seat;
      const working = s.seat > 0.5 && s.staff > 0.5;
      s.stylist.reach(working ? 1 : 0.15, time + s.index, working);
      if (!s.bed) s.client.reach(0.85, 0, false);
    }
    for (const seat of this.sofa) {
      if (seat.shown?.id !== seat.wanted?.id) {
        seat.fade = damp(seat.fade, 0, 9, delta);
        if (seat.fade < 0.02) {
          seat.shown = seat.wanted;
          if (seat.shown) seat.person.look = lookFor(seat.shown.name);
        }
      } else seat.fade = damp(seat.fade, seat.shown ? 1 : 0, 4, delta);
      seat.person.opacity = seat.fade;
    }
    for (let i = this.hops.length - 1; i >= 0; i--) {
      const hop = this.hops[i];
      hop.t = Math.min(1, hop.t + delta / 0.9);
      const k = hop.t;
      hop.mesh.position.lerpVectors(hop.from, hop.to, k);
      hop.mesh.position.y += Math.sin(k * Math.PI) * 1.4;
      hop.mesh.rotation.z = k * Math.PI * 2;
      if (hop.t >= 1) {
        this.root.remove(hop.mesh);
        this.hops.splice(i, 1);
      }
    }
    this.tokens.update(delta);
  }

  dispose() {
    this.unsubscribe();
    this.tokens.dispose();
    for (const s of this.stations) {
      s.stylist.dispose();
      s.client.dispose();
    }
    for (const seat of this.sofa) seat.person.dispose();
    Object.values(this.kit).forEach((g) => g.dispose());
  }

  /** Where the camera goes to show the studio. */
  static readonly overview = OVERVIEW;
  /** The stylist's station, for the hover tip in React. */
  stationCount() {
    return this.stations.length;
  }
  flyHome() {
    this.stage.flyTo(OVERVIEW.camera, OVERVIEW.target, 1200);
  }
}
