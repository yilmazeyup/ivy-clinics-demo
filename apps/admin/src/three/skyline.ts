import { IVY_COLORS } from '@pure-ivy/shared';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { damp, el, type Stage } from './stage';
import type { Tip } from './studio';

export type BlockView = {
  id: string;
  clinic: number;
  room: number;
  startHour: number;
  endHour: number;
  height: number;
  color: string;
  phase: 'done' | 'now' | 'later';
};

/** One clinic: its label and how many treatment rooms (lanes) it has. */
export type Lane = { name: string; detail: string; rooms: number };

const HOUR_W = 0.95;
const ROOM_D = 0.46;
const ROOM_GAP = 0.1;
const CLINIC_GAP = 0.6;

const PLINTH = new THREE.Color(IVY_COLORS.sand);
const FADED = new THREE.Color('#E6DDD2');

type Block = {
  view: BlockView;
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  base: THREE.Color;
  grow: number;
  delay: number;
  leaving: boolean;
};

/**
 * Today's diary for the four clinics as a skyline: one lane per treatment room, time running left to
 * right, and every appointment a block whose height follows its price.
 */
export class SkylineScene {
  private readonly root = new THREE.Group();
  private readonly blocks = new Map<string, Block>();
  private readonly nowGroup = new THREE.Group();
  private readonly nowEl = el('scene-now');
  private readonly tipEl = el('scene-tip');
  private readonly tip: CSS2DObject;
  private readonly unsubscribe: () => void;
  private readonly mid: number;
  /** Front edge of each clinic and its depth along z. */
  private readonly offsets: number[] = [];
  private readonly depths: number[] = [];
  private readonly total: number;
  private nowX: number | null = null;
  private focused: number | null = null;
  private clock = 0;
  private firstBatch = true;

  constructor(
    private readonly stage: Stage,
    lanes: Lane[],
    private readonly open: number,
    private readonly close: number,
    private readonly describe: (id: string) => Tip | null,
  ) {
    this.mid = (open + close) / 2;
    let z = 0;
    for (const lane of lanes) {
      const depth = lane.rooms * ROOM_D + (lane.rooms - 1) * ROOM_GAP;
      this.offsets.push(z);
      this.depths.push(depth);
      z += depth + CLINIC_GAP;
    }
    this.total = z - CLINIC_GAP;
    stage.scene.add(this.root);

    const span = (close - open) * HOUR_W;
    const left = this.x(open) - 2.7;
    const right = this.x(close) + 0.6;

    const base = new THREE.Mesh(
      new RoundedBoxGeometry(right - left + 0.5, 0.18, this.total + 1.9, 2, 0.06),
      new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.9 }),
    );
    base.position.set((left + right) / 2, -0.4, 0.1);
    const plinth = new THREE.Mesh(
      new RoundedBoxGeometry(right - left, 0.32, this.total + 1.4, 2, 0.05),
      new THREE.MeshStandardMaterial({ color: IVY_COLORS.sand, roughness: 0.92 }),
    );
    plinth.position.set((left + right) / 2, -0.16, 0.1);
    base.receiveShadow = plinth.receiveShadow = true;
    this.root.add(base, plinth);

    const strip = new THREE.MeshStandardMaterial({ color: '#FBF8F3', roughness: 0.9 });
    lanes.forEach((lane, index) => {
      const zc = this.clinicZ(index);
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(span + 0.3, 0.03, this.depths[index] + 0.12, 2, 0.012), strip);
      mesh.position.set(this.x(this.mid), 0.015, zc);
      mesh.receiveShadow = true;
      this.root.add(mesh);
      stage.label(el('scene-lane', `<strong>${lane.name}</strong><span>${lane.detail}</span>`), this.root, [left + 1.25, 0.05, zc]);
    });

    const tick = new THREE.MeshStandardMaterial({ color: IVY_COLORS.lineStrong, roughness: 1 });
    for (let h = open; h <= close; h++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.006, this.total + 0.3), tick);
      line.position.set(this.x(h), 0.034, 0);
      line.receiveShadow = true;
      this.root.add(line);
      if ((h - open) % 3 === 0) {
        stage.label(el('scene-hour', `${String(h).padStart(2, '0')}:00`), this.root, [this.x(h), 0.05, this.total / 2 + 0.5]);
      }
    }

    // The present moment: a pale green sheet that slides along the day.
    const sheet = new THREE.Mesh(
      new THREE.PlaneGeometry(this.total + 0.5, 2.1),
      new THREE.MeshBasicMaterial({ color: IVY_COLORS.ivy, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }),
    );
    sheet.rotation.y = Math.PI / 2;
    sheet.position.y = 1.05;
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.012, this.total + 0.5),
      new THREE.MeshBasicMaterial({ color: IVY_COLORS.ivy }),
    );
    line.position.y = 0.04;
    this.nowGroup.add(sheet, line);
    // Like a playhead under the time axis.
    stage.label(this.nowEl, this.nowGroup, [0, 0.05, this.total / 2 + 1.0]);
    this.nowGroup.visible = false;
    this.root.add(this.nowGroup);

    this.tip = stage.label(this.tipEl, this.root, [0, 0, 0]);
    this.tip.visible = false;

    const key = new THREE.DirectionalLight('#FFF6EC', 2.3);
    key.position.set(-6, 11, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -10, right: 10, top: 9, bottom: -9, far: 40 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 4;
    const fill = new THREE.HemisphereLight('#FFFFFF', IVY_COLORS.sand, 0.45);
    stage.scene.add(key, fill);

    this.unsubscribe = stage.onFrame((time, delta) => this.frame(time, delta));
  }

  setBlocks(views: BlockView[]) {
    const seen = new Set<string>();
    for (const view of views) {
      seen.add(view.id);
      const existing = this.blocks.get(view.id);
      if (existing) {
        existing.view = view;
        existing.leaving = false;
        continue;
      }
      const length = (view.endHour - view.startHour) * HOUR_W - 0.06;
      const material = new THREE.MeshStandardMaterial({ color: view.color, roughness: 0.68 });
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(length, view.height, ROOM_D - 0.06, 2, 0.035), material);
      mesh.position.set(this.x((view.startHour + view.endHour) / 2), 0, this.roomZ(view.clinic, view.room));
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.id = view.id;
      this.root.add(mesh);
      this.blocks.set(view.id, {
        view,
        mesh,
        material,
        base: new THREE.Color(view.color),
        grow: this.stage.reducedMotion ? 1 : 0,
        // The opening build sweeps from morning to evening; later bookings rise at once.
        delay: this.firstBatch ? 0.25 + (view.startHour - this.open) * 0.07 : this.clock,
        leaving: false,
      });
    }
    for (const [id, block] of this.blocks) if (!seen.has(id)) block.leaving = true;
    this.firstBatch = false;
    this.stage.setHoverTargets(
      Array.from(this.blocks.values(), (b) => b.mesh),
      (object) => this.hover(object),
    );
  }

  setNow(hour: number | null, label: string) {
    if (hour === null || hour < this.open || hour > this.close) {
      this.nowGroup.visible = false;
      this.nowX = null;
      return;
    }
    const x = this.x(hour);
    if (this.nowX === null) this.nowGroup.position.x = this.x(this.open);
    this.nowX = x;
    this.nowGroup.visible = true;
    this.nowEl.textContent = label;
  }

  /** Zooms in on one clinic and quiets the others; null shows all four again. */
  focus(clinic: number | null) {
    this.focused = clinic;
    if (clinic === null) {
      this.stage.flyTo([-4.5, 9.8, 12.8], [-0.8, 0, 0.5]);
    } else {
      const z = this.clinicZ(clinic);
      this.stage.flyTo([-2.6, 5.6, z + 8.6], [0.4, 0.2, z]);
    }
  }

  dispose() {
    this.unsubscribe();
    this.stage.scene.remove(this.root);
  }

  private x(hour: number) {
    return (hour - this.mid) * HOUR_W;
  }

  private clinicZ(clinic: number) {
    return -this.total / 2 + this.offsets[clinic] + this.depths[clinic] / 2;
  }

  private roomZ(clinic: number, room: number) {
    return -this.total / 2 + this.offsets[clinic] + room * (ROOM_D + ROOM_GAP) + ROOM_D / 2;
  }

  private hover(object: THREE.Object3D | null) {
    const id = object?.userData.id as string | undefined;
    const info = id ? this.describe(id) : null;
    if (!object || !info) {
      this.tip.visible = false;
      return;
    }
    const block = this.blocks.get(id!);
    this.tipEl.innerHTML = `<strong>${info.title}</strong><span>${info.detail}</span>`;
    this.tip.position.set(object.position.x, (block?.view.height ?? 0.5) + 0.45, object.position.z);
    this.tip.visible = true;
  }

  private frame(time: number, delta: number) {
    this.clock = time;
    const target = new THREE.Color();
    for (const [id, block] of this.blocks) {
      const { view, mesh, material } = block;
      const goal = block.leaving ? 0 : time > block.delay ? 1 : 0;
      block.grow = damp(block.grow, goal, this.stage.reducedMotion ? 100 : 4.5, delta);
      if (block.leaving && block.grow < 0.01) {
        this.root.remove(mesh);
        mesh.geometry.dispose();
        material.dispose();
        this.blocks.delete(id);
        continue;
      }
      const g = Math.max(0.001, block.grow);
      mesh.scale.y = g;
      mesh.position.y = (view.height * g) / 2;
      mesh.visible = block.grow > 0.002;

      target.copy(block.base);
      if (view.phase === 'done') target.lerp(FADED, 0.55);
      if (this.focused !== null && view.clinic !== this.focused) target.lerp(PLINTH, 0.75);
      material.color.lerp(target, 1 - Math.exp(-delta * 5));
      if (view.phase === 'now') {
        material.emissive.copy(block.base);
        material.emissiveIntensity = 0.18 + Math.sin(time * 3) * 0.12;
      } else {
        material.emissiveIntensity = damp(material.emissiveIntensity, 0, 4, delta);
      }
    }

    if (this.nowX !== null) {
      this.nowGroup.position.x = damp(this.nowGroup.position.x, this.nowX, this.stage.reducedMotion ? 100 : 2.2, delta);
    }
  }
}
