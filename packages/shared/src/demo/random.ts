/** FNV-1a: the same id always produces the same demo numbers. */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic shuffle driven by `seed`. */
export function shuffle<T>(items: T[], seed: number): T[] {
  const out = items.slice();
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function atTime(day: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const out = new Date(day);
  out.setHours(h, m, 0, 0);
  return out;
}
