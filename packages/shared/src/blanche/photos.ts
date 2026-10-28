/**
 * Photos of Blanche Beauty's work, studio and products. The files live in each app (Metro needs static requires);
 * this list keeps the keys the same everywhere. Sources: apps/blanche/assets/photos/CREDITS.md.
 */
export const BLANCHE_PHOTOS = [
  // The studio's own work, from its Instagram (@blanchebeauty.nl) and booking site.
  'nails-nude',
  'nails-red',
  'nails-color',
  'nails-peony',
  'nails-sparkle',
  'nails-milky',
  'nails-pink',
  'lashes-lift',
  'brows-map',
  'brows-serum',
  // Free stock photos (Unsplash, Pexels).
  'nails-chrome',
  'nails-french',
  'nails-art',
  'nails-blue',
  'nails-mauve',
  'nails-work',
  'nails-toes',
  'nails-hand',
  'nails-pastel',
  'lashes-up',
  'brows-lami',
  'polish-wall',
  'product-serum',
  'product-cream',
] as const;

export type BlanchePhoto = (typeof BLANCHE_PHOTOS)[number];
