import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

import { damp } from './stage';

export type TileState = 'planned' | 'due' | 'late' | 'onTrack';

/**
 * One treatment plan as a row of session tiles, placed over its row in the list: `x` and `y` are where the row's
 * progress cell starts and its middle, in pixels from the top-left of the overlay.
 */
export type TileRow = { id: string; x: number; y: number; total: number; done: number; state: TileState; reminded: boolean };

/** Tile size and spacing in pixels; the list reserves the same room. */
export const TILE = 10;
export const TILE_GAP = 3;
const RAISED = 8;
const FLAT = 2.5;

const COLOR = {
  done: '#7A6A55',
  rest: '#E2D8CC',
  planned: '#1E1E1C',
  due: '#B29C82',
  late: '#9B3B2D',
  onTrack: '#D8CCBE',
};

type Tile = { mesh: THREE.Mesh; material: THREE.MeshStandardMaterial; height: number; color: THREE.Color; delay: number };
type Row = { group: THREE.Group; tiles: Tile[]; data: TileRow; bump: number; placed: boolean };

/**
 * The treatment plans' sessions as small raised tiles, drawn in one transparent canvas laid over the list so each row
 * of tiles sits exactly where the list row is. Done sessions stand up in taupe, the next one shows its state (booked in
 * ink, due in sand, overdue in red, pulsing), the rest lie flat. Rows slide when the list order changes.
 */
export class CourseTiles {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(0, 1, 0, -1, -100, 100);
  private readonly rows = new Map<string, Row>();
  private readonly geometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.18);
  private readonly resizeObserver: ResizeObserver;
  private readonly visibility: IntersectionObserver;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly started = performance.now();
  private raf = 0;
  private last = performance.now();
  private visible = true;
  private direction = 1;

  constructor(private readonly host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.domElement.className = 'course-tiles-canvas';
    host.appendChild(this.renderer.domElement);
    this.camera.position.z = 50;

    // Light from the front and above, so the tiles keep their palette colours rather than going dark.
    const key = new THREE.DirectionalLight('#FFF6EC', 1.9);
    key.position.set(-0.35, 0.8, 1.2);
    this.scene.add(key, new THREE.HemisphereLight('#FFFFFF', '#E9DED3', 1.9));

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.visibility = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
    });
    this.visibility.observe(host);
    this.resize();
    this.raf = requestAnimationFrame(this.loop);
  }

  /** The rows as the list shows them now; `rtl` lays tiles out from the right, like the rest of the Arabic panel. */
  update(rows: TileRow[], rtl: boolean) {
    this.direction = rtl ? -1 : 1;
    const seen = new Set<string>();
    rows.forEach((data, index) => {
      seen.add(data.id);
      let row = this.rows.get(data.id);
      if (!row || row.tiles.length !== data.total) {
        if (row) this.scene.remove(row.group);
        row = this.makeRow(data, index);
        this.rows.set(data.id, row);
      }
      if (data.reminded && !row.data.reminded) row.bump = 1;
      if (data.state !== row.data.state && data.state === 'planned') row.bump = 1;
      row.data = data;
    });
    for (const [id, row] of this.rows) {
      if (seen.has(id)) continue;
      this.scene.remove(row.group);
      this.rows.delete(id);
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.visibility.disconnect();
    for (const row of this.rows.values()) for (const tile of row.tiles) tile.material.dispose();
    this.geometry.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private makeRow(data: TileRow, index: number): Row {
    const group = new THREE.Group();
    // Tilted back a little, so each tile shows its top and its front.
    group.rotation.x = 0.62;
    const tiles = Array.from({ length: data.total }, (_, i) => {
      const material = new THREE.MeshStandardMaterial({ color: COLOR.rest, roughness: 0.55 });
      const mesh = new THREE.Mesh(this.geometry, material);
      mesh.scale.set(TILE, 0.01, TILE);
      group.add(mesh);
      return { mesh, material, height: 0.01, color: new THREE.Color(COLOR.rest), delay: this.reducedMotion ? 0 : 0.15 + index * 0.06 + i * 0.035 };
    });
    this.scene.add(group);
    return { group, tiles, data, bump: 0, placed: false };
  }

  private resize() {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(width, height, false);
    Object.assign(this.camera, { left: 0, right: width, top: 0, bottom: -height });
    this.camera.updateProjectionMatrix();
  }

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.visible) {
      this.last = now;
      return;
    }
    const delta = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const time = (now - this.started) / 1000;
    const instant = this.reducedMotion;

    for (const row of this.rows.values()) {
      const { data } = row;
      // The row's place follows its list row; it slides there when the order changes.
      const x = data.x + (this.direction > 0 ? TILE / 2 : -TILE / 2);
      const y = -(data.y + 2.5);
      if (!row.placed || instant) {
        row.group.position.set(x, y, 0);
        row.placed = true;
      } else {
        row.group.position.x = damp(row.group.position.x, x, 10, delta);
        row.group.position.y = damp(row.group.position.y, y, 10, delta);
      }
      row.bump = damp(row.bump, 0, 4, delta);
      row.tiles.forEach((tile, i) => {
        const next = i === data.done;
        const done = i < data.done;
        const key: keyof typeof COLOR = done ? 'done' : next ? data.state : 'rest';
        let target = done ? RAISED : next && data.state !== 'onTrack' ? RAISED * 0.75 : FLAT;
        // Due and overdue sessions breathe, so they catch the eye; a reminder or a new booking makes the tile hop.
        if (next && (data.state === 'due' || data.state === 'late') && !instant) target += Math.sin(time * 3 + i) * 1.4;
        const ready = time > tile.delay;
        tile.height = instant ? target : ready ? damp(tile.height, target, 9, delta) : 0.01;
        tile.color.set(COLOR[key]);
        tile.material.color.lerp(tile.color, instant ? 1 : 1 - Math.exp(-delta * 8));
        tile.mesh.scale.y = Math.max(0.01, tile.height);
        tile.mesh.position.set(this.direction * i * (TILE + TILE_GAP), tile.height / 2 + (next ? Math.sin(row.bump * Math.PI) * 6 : 0), 0);
      });
    }
    this.renderer.render(this.scene, this.camera);
  };
}
