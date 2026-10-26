import { CLINIC_COLORS } from '@pure-clinics/shared';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

import { Tokens } from './fx';
import { damp, el, type Stage, type Tip, type Vec } from './stage';

/** One clinic on one day: treatments paid, webshop sold, and treatments still booked to come. */
export type SalesColumn = { treatments: number; webshop: number; booked: number };

const STEP = 1.28;
const ROW = 0.58;
const SIZE = 0.6;
/** The tallest column of the week stands this high. */
const HEIGHT = 2.9;

export const SALES_VIEW = { camera: [0, 6.55, 10.2] as Vec, target: [0, 1.5, 0.25] as Vec };

const COLORS = { treatments: '#7A6A55', webshop: '#DCC9B3', booked: '#FFFFFF', edge: '#BFB3A5', plate: '#EFE7DC' };

type Part = 'treatments' | 'webshop' | 'booked';

type Column = {
  day: number;
  clinic: number;
  group: THREE.Group;
  parts: Record<Part, THREE.Mesh>;
  edges: THREE.LineSegments;
  cap: THREE.Mesh;
  target: Record<Part, number>;
  current: Record<Part, number>;
  bump: number;
};

/**
 * The week's sales as a small model: a column per clinic per day, treatments at the bottom and webshop on top, with
 * what is still booked as a light outline. Today's columns are the live ones: they carry a green cap and grow while
 * payments and orders come in.
 */
export class SalesScene {
  private readonly root = new THREE.Group();
  private readonly columns: Column[] = [];
  private readonly tip: CSS2DObject;
  private readonly tipEl = el('scene-tip');
  private readonly todayTag: CSS2DObject;
  private readonly todayEl = el('sales-today');
  private readonly marker: THREE.Mesh;
  private readonly tokens: Tokens;
  private readonly unsubscribe: () => void;
  private scale = 1;
  /** Taller views get taller columns, so the week fills its card. */
  private stretch = 1;
  private today: number;

  /** 1 when the week runs left to right, -1 when it runs right to left (Arabic), like the rest of the panel. */
  private readonly flow: number;

  constructor(
    private readonly stage: Stage,
    labels: { days: string[]; clinics: string[] },
    today: number,
    rtl: boolean,
    private readonly describe: (day: number, clinic: number) => Tip | null,
  ) {
    this.today = today;
    this.flow = rtl ? -1 : 1;
    stage.scene.add(this.root);
    this.tokens = new Tokens(this.root, 14);

    const width = STEP * 7 + 0.6;
    const depth = ROW * 2 + SIZE + 0.9;
    const plinth = new THREE.Mesh(new RoundedBoxGeometry(width, 0.16, depth, 2, 0.05), new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.9 }));
    plinth.position.set(0, -0.08, 0.1);
    const floor = new THREE.Mesh(new RoundedBoxGeometry(width - 0.3, 0.04, depth - 0.3, 2, 0.02), new THREE.MeshStandardMaterial({ color: CLINIC_COLORS.sand, roughness: 0.95 }));
    floor.position.set(0, 0.0, 0.1);
    plinth.receiveShadow = floor.receiveShadow = true;
    this.root.add(plinth, floor);

    // Today's place on the floor: a thin green frame, the only green in the view besides today's caps.
    const shape = new THREE.Shape();
    const hw = 0.66;
    const hd = ROW + SIZE / 2 + 0.16;
    shape.moveTo(-hw, -hd).lineTo(hw, -hd).lineTo(hw, hd).lineTo(-hw, hd).lineTo(-hw, -hd);
    const hole = new THREE.Path();
    hole.moveTo(-hw + 0.04, -hd + 0.04).lineTo(-hw + 0.04, hd - 0.04).lineTo(hw - 0.04, hd - 0.04).lineTo(hw - 0.04, -hd + 0.04).lineTo(-hw + 0.04, -hd + 0.04);
    shape.holes.push(hole);
    this.marker = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: CLINIC_COLORS.now, transparent: true, opacity: 0.55, depthWrite: false }));
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.position.y = 0.025;
    this.root.add(this.marker);

    const unit = new THREE.BoxGeometry(SIZE, 1, SIZE);
    unit.translate(0, 0.5, 0);
    const plateGeo = new RoundedBoxGeometry(SIZE + 0.08, 0.03, SIZE + 0.08, 2, 0.012);
    const capGeo = new RoundedBoxGeometry(SIZE + 0.04, 0.05, SIZE + 0.04, 2, 0.015);
    const solid = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.62 });
    const treatments = solid(COLORS.treatments);
    const webshop = solid(COLORS.webshop);
    const booked = new THREE.MeshStandardMaterial({ color: COLORS.booked, roughness: 0.4, transparent: true, opacity: 0.42, depthWrite: false });
    const edgeMaterial = new THREE.LineBasicMaterial({ color: COLORS.edge, transparent: true, opacity: 0.9 });
    const plate = new THREE.MeshStandardMaterial({ color: COLORS.plate, roughness: 0.9 });
    const capMaterial = new THREE.MeshStandardMaterial({ color: CLINIC_COLORS.now, roughness: 0.5, emissive: CLINIC_COLORS.now, emissiveIntensity: 0.3 });
    const edgeGeo = new THREE.EdgesGeometry(unit);

    const targets: THREE.Object3D[] = [];
    for (let day = 0; day < 7; day++) {
      for (let clinic = 0; clinic < labels.clinics.length; clinic++) {
        const group = new THREE.Group();
        group.position.set(this.x(day), 0.02, this.z(clinic));
        group.userData = { day, clinic };
        const base = new THREE.Mesh(plateGeo, plate);
        base.position.y = 0.015;
        base.receiveShadow = true;
        const parts = {
          treatments: new THREE.Mesh(unit, treatments),
          webshop: new THREE.Mesh(unit, webshop),
          booked: new THREE.Mesh(unit, booked),
        };
        for (const part of Object.values(parts)) {
          part.scale.y = 0.0001;
          part.castShadow = part !== parts.booked;
          part.receiveShadow = true;
          group.add(part);
        }
        const edges = new THREE.LineSegments(edgeGeo, edgeMaterial);
        edges.scale.y = 0.0001;
        const cap = new THREE.Mesh(capGeo, capMaterial);
        cap.visible = false;
        cap.castShadow = true;
        group.add(base, edges, cap);
        this.root.add(group);
        targets.push(group);
        this.columns.push({
          day,
          clinic,
          group,
          parts,
          edges,
          cap,
          target: { treatments: 0, webshop: 0, booked: 0 },
          current: { treatments: 0, webshop: 0, booked: 0 },
          bump: 0,
        });
      }
      stage.label(el('sales-day', `<strong>${labels.days[day].split(' ')[0]}</strong><span>${labels.days[day].split(' ').slice(1).join(' ')}</span>`), this.root, [
        this.x(day),
        0.05,
        this.z(labels.clinics.length - 1) + SIZE / 2 + 0.42,
      ]);
    }
    // The clinic names end just before the first column of their row, on the side where the week starts.
    labels.clinics.forEach((name, clinic) => {
      const label = stage.label(el('sales-clinic', name), this.root, [this.x(0) - this.flow * (SIZE / 2 + 0.12), 0.05, this.z(clinic)]);
      label.center.set(this.flow > 0 ? 1 : 0, 0.5);
    });

    this.todayTag = stage.label(this.todayEl, this.root, [0, 0, 0]);
    this.tip = stage.label(this.tipEl, this.root, [0, 0, 0]);
    this.tip.visible = false;
    stage.setHoverTargets(targets, (object) => {
      const info = object ? this.describe(object.userData.day as number, object.userData.clinic as number) : null;
      if (!object || !info) {
        this.tip.visible = false;
        return;
      }
      const column = this.columns.find((c) => c.group === object)!;
      this.tipEl.innerHTML = `<strong>${info.title}</strong><span>${info.detail}</span>`;
      this.tip.position.set(object.position.x, this.top(column) + 0.55, object.position.z);
      this.tip.visible = true;
    });

    const key = new THREE.DirectionalLight('#FFF6EC', 2.3);
    key.position.set(-5, 9, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -7, right: 7, top: 6, bottom: -4, far: 30 });
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
    const fill = new THREE.HemisphereLight('#FFFFFF', CLINIC_COLORS.sand, 0.5);
    stage.scene.add(key, fill);

    this.placeToday();
    this.unsubscribe = stage.onFrame((time, delta) => this.frame(time, delta));
  }

  /** New amounts for the week, [day][clinic]; the columns grow or shrink toward them. */
  update(week: SalesColumn[][], todayText: string) {
    let max = 1;
    for (const day of week) for (const c of day) max = Math.max(max, c.treatments + c.webshop + c.booked);
    // The scale only moves in steps, so one payment does not make every column twitch.
    const step = Math.pow(10, Math.floor(Math.log10(max))) / 2;
    this.scale = HEIGHT / (Math.ceil(max / step) * step);
    for (const column of this.columns) {
      const data = week[column.day]?.[column.clinic];
      if (!data) continue;
      column.target.treatments = data.treatments;
      column.target.webshop = data.webshop;
      column.target.booked = data.booked;
    }
    if (this.todayEl.innerHTML !== todayText) this.todayEl.innerHTML = todayText;
  }

  /** Money came in today for a clinic: a coin drops onto its column, which grows when it lands. */
  pay(clinic: number, kind: 'treatments' | 'webshop', fast: boolean) {
    const column = this.columns.find((c) => c.day === this.today && c.clinic === clinic);
    if (!column || this.stage.reducedMotion) return;
    const top = new THREE.Vector3(column.group.position.x, this.top(column) + 0.05, column.group.position.z);
    const from = top.clone().add(new THREE.Vector3(0.9, 2.2, -0.4));
    this.tokens.fire(from, top, {
      color: kind === 'treatments' ? '#C9A46C' : '#D8BE98',
      duration: fast ? 0.7 : 1.2,
      height: 0.5,
      scale: 0.85,
      onLand: () => {
        column.bump = 1;
      },
    });
  }

  dispose() {
    this.unsubscribe();
    this.tokens.dispose();
    this.stage.scene.remove(this.root);
  }

  private x(day: number) {
    return this.flow * (day - 3) * STEP;
  }

  private z(clinic: number) {
    return (clinic === 0 ? -1 : 1) * ROW;
  }

  /** The top of the column, where a coin lands and the tooltip floats. */
  private top(column: Column) {
    return (column.current.treatments + column.current.webshop + column.current.booked) * this.scale * this.stretch + 0.02;
  }

  private placeToday() {
    const visible = this.today >= 0;
    this.marker.visible = visible;
    this.todayTag.visible = visible;
    if (visible) this.marker.position.x = this.x(this.today);
  }

  private frame(time: number, delta: number) {
    this.tokens.update(delta);
    const instant = this.stage.reducedMotion;
    const stretch = THREE.MathUtils.clamp(1.85 / this.stage.camera.aspect, 1, 1.6);
    this.stretch = instant ? stretch : damp(this.stretch, stretch, 4, delta);
    const scale = this.scale * this.stretch;
    let todayTop = 0;
    for (const column of this.columns) {
      let y = 0;
      column.bump = damp(column.bump, 0, 6, delta);
      for (const part of ['treatments', 'webshop', 'booked'] as Part[]) {
        const goal = column.target[part];
        column.current[part] = instant ? goal : damp(column.current[part], goal, 4, delta);
        const h = column.current[part] * scale;
        const mesh = column.parts[part];
        mesh.visible = h > 0.004;
        mesh.position.y = y;
        mesh.scale.y = Math.max(0.0001, h);
        if (part === 'booked') {
          column.edges.visible = mesh.visible;
          column.edges.position.y = y;
          column.edges.scale.y = mesh.scale.y;
        }
        // The paid part of today's column wears the green cap.
        if (part === 'webshop') {
          const live = column.day === this.today && y + h > 0.01;
          column.cap.visible = live;
          if (live) column.cap.position.y = y + h + 0.02;
        }
        y += h;
      }
      const s = 1 + column.bump * 0.06;
      column.group.scale.set(s, 1, s);
      if (column.day === this.today) todayTop = Math.max(todayTop, y);
    }
    (this.columns[0]?.cap.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.25 + Math.sin(time * 2.6) * 0.15;
    if (this.today >= 0) this.todayTag.position.set(this.x(this.today), todayTop + 0.75, 0);
  }
}
