/** Seeded random numbers, so the demo shows the same day on every load. */
export type Rng = () => number;

export function seedOf(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32: tiny, fast and good enough for demo data. */
export function rng(seed: number | string): Rng {
  let s = (typeof seed === 'string' ? seedOf(seed) : seed) >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(r: Rng, items: readonly T[]): T {
  return items[Math.floor(r() * items.length)];
}

export function between(r: Rng, min: number, max: number): number {
  return min + Math.floor(r() * (max - min + 1));
}

const FIRST = [
  'Emma', 'Anouk', 'Sanne', 'Lisa', 'Fatima', 'Zeynep', 'Yara', 'Lina', 'Amira', 'Meryem',
  'Charlotte', 'Floor', 'Maud', 'Isa', 'Romy', 'Esmée', 'Nina', 'Hanna', 'Ilse', 'Merel',
  'Joyce', 'Priya', 'Mei', 'Rania', 'Nadia', 'Kim', 'Marloes', 'Tessa', 'Babette', 'Dewi',
  'Sevda', 'Hira', 'Laura', 'Jasmijn', 'Vera', 'Eline', 'Naomi', 'Aylin', 'Ines', 'Saar',
];
const LAST = ['B.', 'K.', 'M.', 'P.', 'E.', 'A.', 'V.', 'J.', 'D.', 'S.', 'H.', 'W.', 'O.', 'Y.', 'T.', 'R.', 'de V.', 'van D.', 'de J.', 'van L.'];

/** "Emma B." — first name and initial only, as staff screens show them. */
export function personName(r: Rng): string {
  return `${pick(r, FIRST)} ${pick(r, LAST)}`;
}
