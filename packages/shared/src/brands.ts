export type BrandId = 'pure' | 'ivy';

export const BRAND_NAMES: Record<BrandId, string> = {
  pure: 'Pure',
  ivy: 'Ivy Clinics',
};

/** Pure: chalk, ink and one sharp sun accent. */
export const PURE_COLORS = {
  bg: '#F5F4F0',
  surface: '#FFFFFF',
  ink: '#15171A',
  muted: '#5E636B',
  line: '#E6E3DC',
  lineStrong: '#D6D2C9',
  accent: '#F0C543',
  accentDeep: '#E0A800',
  sand: '#E7DED0',
  inkSoft: '#2B2E33',
  onInk: '#E9E7E1',
  onInkMuted: '#C8C6C0',
  taken: '#ECE9E3',
  takenText: '#9A9DA3',
  window: '#C9D6E8',
  live: '#2E9E5B',
} as const;

/** Ivy: ivory and sand, warm taupe text, deep ivy green for actions. */
export const IVY_COLORS = {
  bg: '#F6F1EA',
  surface: '#FFFFFF',
  ink: '#1E1E1C',
  muted: '#6E6259',
  body: '#4E463F',
  line: '#E2D8CC',
  lineStrong: '#D8CCBE',
  sand: '#E9DED3',
  blush: '#EBDDD5',
  ivy: '#2F4A3C',
  onPhoto: '#F1E9DF',
  dashed: '#C9BCAE',
} as const;

export const PHOTO_KEYS = [
  'ivy-hero',
  'ivy-facial',
  'ivy-hands',
  'ivy-lashes',
  'ivy-brows',
  'ivy-microneedling',
  'ivy-peel',
  'ivy-cream',
  'ivy-serum',
  'ivy-room',
  'ivy-neck',
  'ivy-white',
  'ivy-glow',
  'pure-hero',
  'pure-studio',
  'pure-flow',
  'pure-burn',
  'pure-stretch',
  'pure-detail',
  'pure-arches',
  'pure-core',
] as const;

export type PhotoKey = (typeof PHOTO_KEYS)[number];
