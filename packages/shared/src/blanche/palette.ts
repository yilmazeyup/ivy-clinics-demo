/**
 * Blanche Beauty's colours: the logo's black ink on white, and a polish shade per craft. `ink` carries white text,
 * `soft` is the wash behind it, `on` is the text colour that reads on `ink`.
 */
export const SHADES = {
  cherry: { ink: '#D81E47', soft: '#FFE3EA', on: '#FFFFFF' },
  lilac: { ink: '#6F4FE8', soft: '#ECE6FF', on: '#FFFFFF' },
  honey: { ink: '#B86E0F', soft: '#FFF0C9', on: '#FFFFFF' },
} as const;

export const BLANCHE_INK = '#141114';
export const BLANCHE_PAPER = '#FFFFFF';

/** Gel colours on the studio's colour wall (a demo selection): the swatches in the app's shade studio and on clients' cards in the admin. */
export type PolishShade = {
  id: string;
  name: string;
  hex: string;
  finish: 'gloss' | 'milky' | 'chrome' | 'shimmer';
  family: 'nude' | 'red' | 'pink' | 'pastel' | 'dark' | 'chrome';
};

export const POLISH: PolishShade[] = [
  { id: 'milk', name: 'Milk Bath', hex: '#F3E9E4', finish: 'milky', family: 'nude' },
  { id: 'ballet', name: 'Ballet Slipper', hex: '#F2C9C8', finish: 'milky', family: 'nude' },
  { id: 'latte', name: 'Oat Latte', hex: '#D9B49B', finish: 'gloss', family: 'nude' },
  { id: 'mocha', name: 'Mocha Mousse', hex: '#9C6F5A', finish: 'gloss', family: 'nude' },
  { id: 'truered', name: 'True Red', hex: '#C8102E', finish: 'gloss', family: 'red' },
  { id: 'cherry', name: 'Cherry Cola', hex: '#8E0F25', finish: 'gloss', family: 'red' },
  { id: 'tomato', name: 'Tomato Girl', hex: '#E5432F', finish: 'gloss', family: 'red' },
  { id: 'bubble', name: 'Bubblegum', hex: '#FF8DC0', finish: 'gloss', family: 'pink' },
  { id: 'peony', name: 'Peony', hex: '#F3A3AE', finish: 'gloss', family: 'pink' },
  { id: 'butter', name: 'Butter', hex: '#F7E08E', finish: 'gloss', family: 'pastel' },
  { id: 'lilac', name: 'Lilac Haze', hex: '#C7B5F5', finish: 'gloss', family: 'pastel' },
  { id: 'pistachio', name: 'Pistachio', hex: '#BFD8A6', finish: 'gloss', family: 'pastel' },
  { id: 'sky', name: 'Baby Blue', hex: '#AFCDEE', finish: 'gloss', family: 'pastel' },
  { id: 'cobalt', name: 'Blue Lagoon', hex: '#2340D8', finish: 'gloss', family: 'dark' },
  { id: 'espresso', name: 'Espresso', hex: '#3B2420', finish: 'gloss', family: 'dark' },
  { id: 'noir', name: 'Noir', hex: '#16131A', finish: 'gloss', family: 'dark' },
  { id: 'glazed', name: 'Glazed Donut', hex: '#EDE4F0', finish: 'chrome', family: 'chrome' },
  { id: 'silver', name: 'Liquid Silver', hex: '#C9CCD6', finish: 'chrome', family: 'chrome' },
  { id: 'rosegold', name: 'Rose Chrome', hex: '#E3A99C', finish: 'chrome', family: 'chrome' },
];

export const polishById = (id: string): PolishShade => POLISH.find((p) => p.id === id) ?? POLISH[0];
