import { CLINIC_COLORS, type Product, type ProductId } from '@pure-clinics/shared';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { floatTag } from './fx';
import { damp, easeOutCubic, el, type Stage, type Tip, type Vec } from './stage';

type Kind = 'pump' | 'tube' | 'jar' | 'bottle' | 'can' | 'box';
/** How a product looks on the shelf: its shape, colours and height, in the clinic's ivory, sand and taupe. */
type Look = { kind: Kind; body: string; cap: string; ink: string; height: number };

const LOOKS: Record<ProductId, Look> = {
  'zo-cleanser': { kind: 'pump', body: '#F7F4EF', cap: '#2E2A26', ink: '#1E1E1C', height: 0.6 },
  'zo-defense': { kind: 'pump', body: '#3A3530', cap: '#CBBEAA', ink: '#F1E9DF', height: 0.48 },
  'zo-spf': { kind: 'tube', body: '#EFE7DC', cap: '#2E2A26', ink: '#1E1E1C', height: 0.56 },
  'lycogel-camouflage': { kind: 'tube', body: '#EBDDD5', cap: '#B29C82', ink: '#4E463F', height: 0.46 },
  'wiqo-cream': { kind: 'jar', body: '#F4EEE6', cap: '#B29C82', ink: '#4E463F', height: 0.24 },
  'xlhair-revitalix': { kind: 'bottle', body: '#CBBEAA', cap: '#4E463F', ink: '#1E1E1C', height: 0.66 },
  'xlhair-scalpfit': { kind: 'bottle', body: '#8C7B6B', cap: '#E9DED3', ink: '#F7F4EF', height: 0.66 },
  'xlhair-spray': { kind: 'can', body: '#E4D6C8', cap: '#4E463F', ink: '#1E1E1C', height: 0.62 },
  'camouflage-set': { kind: 'box', body: '#E9DED3', cap: '#7A6A55', ink: '#1E1E1C', height: 0.4 },
  'laser-aftercare-set': { kind: 'box', body: '#F4EEE6', cap: '#B29C82', ink: '#1E1E1C', height: 0.4 },
};

/** Two shelves: face and aftercare above, hair and the sets below. */
const SHELVES: ProductId[][] = [
  ['zo-cleanser', 'zo-defense', 'zo-spf', 'lycogel-camouflage', 'wiqo-cream'],
  ['xlhair-revitalix', 'xlhair-scalpfit', 'xlhair-spray', 'camouflage-set', 'laser-aftercare-set'],
];
const SLOT = 0.88;
const SHELF_Y = [1.3, 0.14];
const SHELF_W = SLOT * 5 + 0.3;
const TABLE = new THREE.Vector3(3.2, 0.78, 0.3);

export const SHOP_VIEW = { camera: [1.3, 2.62, 8.3] as Vec, target: [0.74, 1.0, 0.1] as Vec };

const v = (x: number, y: number) => new THREE.Vector2(x, y);

/** Canvas pixels per world unit for the printed labels. */
const PX = 1100;
/** How much of each shape's height its label covers. */
const BAND: Record<Kind, number> = { pump: 0.46, tube: 0.42, jar: 0.52, bottle: 0.44, can: 0.5, box: 0.62 };

/** A label printed on a canvas: brand in spaced capitals, the name in the display face, wrapped to fit. */
function drawLabel(canvas: HTMLCanvasElement, brand: string, name: string, look: Look, face: number) {
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = look.body;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.fillStyle = look.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const brandSize = Math.round(canvas.height * 0.11);
  ctx.font = `500 ${brandSize}px Jost, sans-serif`;
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${Math.round(brandSize * 0.22)}px`;
  ctx.fillText(brand.toUpperCase(), cx, cy - canvas.height * 0.2);
  (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';
  const nameSize = Math.round(canvas.height * 0.2);
  ctx.font = `500 ${nameSize}px "Cormorant Garamond", Georgia, serif`;
  // Wrap the name inside the part of the label that faces the viewer.
  const words = name.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > face && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  lines.push(line);
  lines.slice(0, 2).forEach((text, i, all) => ctx.fillText(text, cx, cy + canvas.height * 0.06 + (i - (all.length - 1) / 2) * nameSize * 1.02));
  // A thin rule under the name, like a printed label.
  ctx.globalAlpha = 0.35;
  ctx.fillRect(cx - face * 0.18, cy + canvas.height * 0.36, face * 0.36, Math.max(1, canvas.height * 0.008));
  ctx.globalAlpha = 1;
}

function labelTexture(brand: string, name: string, look: Look, width: number, height: number, face: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  drawLabel(canvas, brand, name, look, face);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  // Draw again once the web fonts are in, so the labels use the panel's typefaces.
  document.fonts?.ready.then(() => {
    drawLabel(canvas, brand, name, look, face);
    texture.needsUpdate = true;
  });
  return texture;
}

const mat = (color: string, roughness = 0.55, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, ...extra });

/** One unit of a product, built from lathe and cylinder shapes with its printed label. Feet at y = 0, facing +z. */
function makeUnit(look: Look, label: THREE.Texture, parts: { body: THREE.Material; cap: THREE.Material }): THREE.Group {
  const unit = new THREE.Group();
  const h = look.height;
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, y = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    unit.add(mesh);
    return mesh;
  };
  const band = (radius: number, height: number, y: number, scaleZ = 1) => {
    const mesh = add(new THREE.CylinderGeometry(radius, radius, height, 40, 1, true, Math.PI, Math.PI * 2), new THREE.MeshStandardMaterial({ map: label, roughness: 0.6 }), y);
    mesh.scale.z = scaleZ;
    return mesh;
  };
  switch (look.kind) {
    case 'pump': {
      const r = 0.125;
      add(new THREE.LatheGeometry([v(0.001, 0), v(r - 0.02, 0), v(r, 0.02), v(r, h - 0.1), v(r - 0.025, h - 0.04), v(r * 0.45, h - 0.01), v(r * 0.42, h)], 32), parts.body);
      add(new THREE.CylinderGeometry(r * 0.42, r * 0.42, 0.05, 20), parts.cap, h + 0.025);
      add(new THREE.CylinderGeometry(r * 0.26, r * 0.3, 0.1, 20), parts.cap, h + 0.1);
      const nozzle = add(new THREE.BoxGeometry(0.14, 0.03, 0.035), parts.cap, h + 0.14);
      nozzle.position.x = 0.06;
      band(r + 0.002, h * BAND.pump, h * 0.44);
      break;
    }
    case 'tube': {
      const r = 0.105;
      add(new THREE.CylinderGeometry(0.068, 0.068, 0.1, 24), parts.cap, 0.05);
      const body = add(new THREE.LatheGeometry([v(0.068, 0.1), v(0.095, 0.16), v(r, 0.24), v(r, h - 0.06), v(r * 0.92, h - 0.02), v(r * 0.86, h)], 28), parts.body);
      body.scale.z = 0.7;
      add(new THREE.BoxGeometry(r * 1.9, 0.035, 0.035), parts.body, h + 0.012);
      band(r + 0.002, h * BAND.tube, h * 0.58, 0.7);
      break;
    }
    case 'jar': {
      const r = 0.18;
      add(new THREE.LatheGeometry([v(0.001, 0), v(r - 0.02, 0), v(r, 0.02), v(r, h - 0.06), v(r - 0.01, h - 0.05)], 36), parts.body);
      add(new THREE.CylinderGeometry(r * 1.03, r * 1.03, 0.07, 36), parts.cap, h - 0.025);
      band(r + 0.002, h * BAND.jar, h * 0.38);
      break;
    }
    case 'bottle': {
      const r = 0.12;
      add(new THREE.LatheGeometry([v(0.001, 0), v(r - 0.02, 0), v(r, 0.025), v(r, h - 0.16), v(r * 0.82, h - 0.07), v(r * 0.45, h - 0.03), v(r * 0.42, h)], 32), parts.body);
      add(new THREE.CylinderGeometry(r * 0.46, r * 0.5, 0.08, 20), parts.cap, h + 0.035);
      band(r + 0.002, h * BAND.bottle, h * 0.4);
      break;
    }
    case 'can': {
      const r = 0.1;
      add(new THREE.CylinderGeometry(r, r, h - 0.06, 28), parts.body, (h - 0.06) / 2);
      add(new THREE.SphereGeometry(r * 0.95, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), parts.cap, h - 0.06);
      band(r + 0.002, h * BAND.can, h * 0.4);
      break;
    }
    case 'box': {
      const w = 0.66;
      const d = 0.26;
      add(new RoundedBoxGeometry(w, h, d, 2, 0.018), parts.body, h / 2);
      const strip = add(new THREE.BoxGeometry(w + 0.004, h * 0.12, d + 0.004), parts.cap, h * 0.16);
      strip.receiveShadow = false;
      const front = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h * BAND.box), new THREE.MeshStandardMaterial({ map: label, roughness: 0.65 }));
      front.position.set(0, h * 0.6, d / 2 + 0.002);
      unit.add(front);
      break;
    }
  }
  return unit;
}

/** Where up to `n` units stand in a slot, and how many fit. */
function placements(kind: Kind, height: number): { max: number; at: (i: number) => THREE.Vector3 } {
  if (kind === 'box') return { max: 2, at: (i) => new THREE.Vector3(0, i * (height + 0.01), -0.05) };
  if (kind === 'jar') return { max: 2, at: (i) => new THREE.Vector3((i - 0.5) * 0.38, 0, (i % 2) * -0.12) };
  return { max: 3, at: (i) => new THREE.Vector3((i - 1) * 0.25, 0, i === 1 ? -0.14 : 0) };
}

type Slot = {
  product: Product;
  look: Look;
  group: THREE.Group;
  units: THREE.Group[];
  at: (i: number) => THREE.Vector3;
  stock: number;
  tag: HTMLDivElement;
};

type Flying = { unit: THREE.Group; from: THREE.Vector3; to: THREE.Vector3; t: number; delay: number; duration: number };
type Job = { items: ProductId[]; total: string; phase: 'pick' | 'close' | 'send' | 'new'; t: number; flying: Flying[]; speed: number };

/**
 * The webshop as a small shop: the products on two shelves with their stock on the shelf edge, and a parcel on the
 * counter. Each order lifts its products off the shelf into the parcel, which closes and slides away.
 */
export class ShopScene {
  private readonly root = new THREE.Group();
  private readonly slots = new Map<ProductId, Slot>();
  private readonly tip: CSS2DObject;
  private readonly tipEl = el('scene-tip');
  private readonly parcel = new THREE.Group();
  private readonly flaps: THREE.Group[] = [];
  private readonly queue: Job[] = [];
  private readonly unsubscribe: () => void;

  constructor(
    private readonly stage: Stage,
    products: { product: Product; brand: string; name: string }[],
    private readonly describe: (product: ProductId) => Tip | null,
  ) {
    stage.scene.add(this.root);
    const white = mat('#FFFFFF', 0.9);
    const ivory = mat('#F4F1EB', 0.95);
    const oak = mat('#D7BF9B', 0.7);
    const kraft = mat('#D9BE98', 0.85);

    // A wall with a shelving unit: back panel, two oak shelves, a top board and side panels.
    const floor = new THREE.Mesh(new RoundedBoxGeometry(8.4, 0.12, 3.0, 2, 0.04), mat(CLINIC_COLORS.sand, 0.95));
    floor.position.set(0.75, -0.06, 0.55);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(8.4, 2.8, 0.1), ivory);
    wall.position.set(0.75, 1.4, -1.0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(SHELF_W, 2.35, 0.06), white);
    back.position.set(0, 1.2, -0.45);
    this.root.add(floor, wall, back);
    for (const y of [...SHELF_Y.map((s) => s - 0.04), 2.37]) {
      const shelf = new THREE.Mesh(new RoundedBoxGeometry(SHELF_W, 0.08, 0.86, 2, 0.02), oak);
      shelf.position.set(0, y, -0.03);
      this.root.add(shelf);
    }
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(new RoundedBoxGeometry(0.08, 2.4, 0.86, 2, 0.02), white);
      panel.position.set((side * (SHELF_W + 0.08)) / 2, 1.2, -0.03);
      this.root.add(panel);
    }

    // The packing counter on the right, with the parcel on it.
    const counter = new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.74, 1.0, 2, 0.03), white);
    counter.position.set(TABLE.x, 0.37, TABLE.z);
    const top = new THREE.Mesh(new RoundedBoxGeometry(1.36, 0.05, 1.06, 2, 0.02), oak);
    top.position.set(TABLE.x, 0.765, TABLE.z);
    this.root.add(counter, top);
    this.buildParcel(kraft);

    const targets: THREE.Object3D[] = [];
    for (const { product, brand, name } of products) {
      const row = SHELVES.findIndex((shelf) => shelf.includes(product.id));
      if (row < 0) continue;
      const col = SHELVES[row].indexOf(product.id);
      const look = LOOKS[product.id];
      const group = new THREE.Group();
      group.position.set((col - 2) * SLOT, SHELF_Y[row], 0);
      group.userData.product = product.id;
      // An invisible block makes the whole slot hoverable, also when it is empty.
      const hit = new THREE.Mesh(new THREE.BoxGeometry(SLOT * 0.92, 0.75, 0.7), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 0.37;
      group.add(hit);
      const r = look.kind === 'jar' ? 0.18 : look.kind === 'tube' ? 0.105 : look.kind === 'can' ? 0.1 : 0.125;
      const face = look.kind === 'box' ? 500 : Math.PI * 2 * r * PX * 0.3;
      const texture =
        look.kind === 'box'
          ? labelTexture(brand, name, look, 600, 600 * ((look.height * BAND.box) / 0.6), face)
          : labelTexture(brand, name, look, Math.PI * 2 * r * PX, look.height * BAND[look.kind] * PX, face);
      const parts = { body: mat(look.body, look.kind === 'can' ? 0.35 : 0.5, look.kind === 'can' ? { metalness: 0.4 } : {}), cap: mat(look.cap, 0.4) };
      const place = placements(look.kind, look.height);
      const units = Array.from({ length: place.max }, (_, i) => {
        const unit = makeUnit(look, texture, parts);
        unit.position.copy(place.at(i));
        unit.rotation.y = (i - 1) * 0.08;
        group.add(unit);
        return unit;
      });
      const tag = el('shop-tag');
      stage.label(tag, this.root, [(col - 2) * SLOT, SHELF_Y[row] - 0.1, 0.42]);
      this.root.add(group);
      targets.push(group);
      this.slots.set(product.id, { product, look, group, units, at: place.at, stock: -1, tag });
    }

    this.tip = stage.label(this.tipEl, this.root, [0, 0, 0]);
    this.tip.visible = false;
    stage.setHoverTargets(targets, (object) => {
      const id = object?.userData.product as ProductId | undefined;
      const info = id ? this.describe(id) : null;
      if (!object || !info) {
        this.tip.visible = false;
        return;
      }
      this.tipEl.innerHTML = `<strong>${info.title}</strong><span>${info.detail}</span>`;
      this.tip.position.set(object.position.x, object.position.y + 1.0, 0.2);
      this.tip.visible = true;
    });

    this.root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    const key = new THREE.DirectionalLight('#FFF6EC', 2.2);
    key.position.set(-4, 8, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -6, right: 6, top: 5, bottom: -2, far: 25 });
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    const fill = new THREE.HemisphereLight('#FFFFFF', CLINIC_COLORS.sand, 0.55);
    stage.scene.add(key, fill);

    this.unsubscribe = stage.onFrame((time, delta) => this.frame(time, delta));
  }

  /** Units in stock per product; the shelf shows up to a few of each, the tag on the shelf edge the exact count. */
  stock(levels: Map<ProductId, number>, tags: (left: number) => { text: string; tone: 'ok' | 'low' | 'out' }) {
    for (const [id, slot] of this.slots) {
      const left = levels.get(id) ?? 0;
      if (left === slot.stock) continue;
      slot.stock = left;
      slot.units.forEach((unit, i) => (unit.visible = i < left));
      const { text, tone } = tags(left);
      slot.tag.textContent = text;
      slot.tag.className = `shop-tag shop-tag--${tone}`;
    }
  }

  /** An order came in: its products leave the shelf for the parcel, which closes and goes. */
  order(items: ProductId[], total: string, fast: boolean) {
    if (this.stage.reducedMotion) return;
    // When orders pile up (the day playing fast), the queue speeds up rather than falling behind.
    if (this.queue.length > 3) return;
    this.queue.push({ items: items.slice(0, 4), total, phase: 'pick', t: 0, flying: [], speed: fast ? 2 : 1 });
    if (this.queue.length === 1) this.start(this.queue[0]);
  }

  dispose() {
    this.unsubscribe();
    this.stage.scene.remove(this.root);
  }

  private buildParcel(kraft: THREE.Material) {
    const w = 0.66;
    const d = 0.46;
    const h = 0.3;
    const t = 0.02;
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), kraft);
    bottom.position.y = t / 2;
    this.parcel.add(bottom);
    for (const [x, z, sx, sz] of [
      [0, d / 2 - t / 2, w, t],
      [0, -d / 2 + t / 2, w, t],
      [w / 2 - t / 2, 0, t, d],
      [-w / 2 + t / 2, 0, t, d],
    ] as const) {
      const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), kraft);
      wallMesh.position.set(x, h / 2, z);
      this.parcel.add(wallMesh);
    }
    // Two flaps hinged on the long sides; open they lean outward, closed they meet in the middle.
    for (const side of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set(0, h, (side * d) / 2);
      const flap = new THREE.Mesh(new THREE.BoxGeometry(w, 0.014, d / 2), kraft);
      flap.position.z = (-side * d) / 4;
      hinge.add(flap);
      hinge.rotation.x = side * 2.1;
      this.parcel.add(hinge);
      this.flaps.push(hinge);
    }
    this.parcel.position.copy(TABLE);
    this.root.add(this.parcel);
  }

  private start(job: Job) {
    job.phase = 'pick';
    job.t = 0;
    const inside = TABLE.clone().add(new THREE.Vector3(0, 0.12, 0));
    job.flying = job.items.flatMap((id, i) => {
      const slot = this.slots.get(id);
      if (!slot) return [];
      // The unit that just left the shelf, or the front one while there are more behind it.
      const unit = slot.units[0].clone();
      unit.visible = true;
      const from = slot.group.position.clone().add(slot.at(Math.max(0, Math.min(slot.stock, slot.units.length - 1))));
      unit.position.copy(from);
      this.root.add(unit);
      return [{ unit, from, to: inside.clone().add(new THREE.Vector3((i % 2) * 0.16 - 0.08, 0, 0)), t: 0, delay: i * 0.28, duration: 0.95 }];
    });
  }

  private frame(_time: number, delta: number) {
    const job = this.queue[0];
    if (!job) return;
    const step = delta * job.speed * (this.queue.length > 2 ? 1.6 : 1);
    job.t += step;
    if (job.phase === 'pick') {
      let done = true;
      for (const f of job.flying) {
        const k = Math.min(1, Math.max(0, (job.t - f.delay) / f.duration));
        if (k < 1) done = false;
        const e = easeOutCubic(k);
        // Up off the shelf first, then an arc over to the parcel.
        const lift = Math.sin(Math.min(1, k * 1.4) * Math.PI) * 0.5 + k * 0.4;
        f.unit.position.lerpVectors(f.from, f.to, e);
        f.unit.position.y += lift * (1 - k * 0.6);
        f.unit.scale.setScalar(1 - 0.35 * e);
        f.unit.visible = k < 0.98;
      }
      if (done) {
        for (const f of job.flying) this.root.remove(f.unit);
        job.phase = 'close';
        job.t = 0;
      }
    } else if (job.phase === 'close') {
      const k = Math.min(1, job.t / 0.4);
      this.flaps.forEach((flap, i) => (flap.rotation.x = (i === 0 ? -1 : 1) * 2.1 * (1 - easeOutCubic(k))));
      if (k >= 1) {
        job.phase = 'send';
        job.t = 0;
        floatTag(this.root, TABLE.clone().add(new THREE.Vector3(0, 0.75, 0)), 'scene-pay', job.total, 1.6 / job.speed);
      }
    } else if (job.phase === 'send') {
      const k = Math.min(1, job.t / 0.7);
      this.parcel.position.x = TABLE.x + easeOutCubic(k) * 1.4;
      this.parcel.scale.setScalar(1 - 0.5 * k);
      this.parcel.visible = k < 0.97;
      if (k >= 1) {
        job.phase = 'new';
        job.t = 0;
        this.flaps.forEach((flap, i) => (flap.rotation.x = (i === 0 ? -1 : 1) * 2.1));
        this.parcel.position.copy(TABLE);
      }
    } else {
      const k = Math.min(1, job.t / 0.35);
      this.parcel.visible = true;
      this.parcel.scale.setScalar(Math.max(0.001, easeOutCubic(k)));
      if (k >= 1) {
        this.queue.shift();
        if (this.queue[0]) this.start(this.queue[0]);
      }
    }
    // Keep the parcel from drifting if a job was cut short.
    if (!this.queue.length) this.parcel.scale.setScalar(damp(this.parcel.scale.x, 1, 8, delta));
  }
}
