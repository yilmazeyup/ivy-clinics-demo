import type { BlanchePhoto } from './data';

// Metro needs static require() calls, so every photo is listed here once; each resolves to an asset id.
export const PHOTOS: Record<BlanchePhoto, number> = {
  'nails-nude': require('../assets/photos/nails-nude.jpg'),
  'nails-red': require('../assets/photos/nails-red.jpg'),
  'nails-color': require('../assets/photos/nails-color.jpg'),
  'nails-peony': require('../assets/photos/nails-peony.jpg'),
  'nails-sparkle': require('../assets/photos/nails-sparkle.jpg'),
  'nails-milky': require('../assets/photos/nails-milky.jpg'),
  'nails-pink': require('../assets/photos/nails-pink.jpg'),
  'lashes-lift': require('../assets/photos/lashes-lift.jpg'),
  'brows-map': require('../assets/photos/brows-map.jpg'),
  'brows-serum': require('../assets/photos/brows-serum.jpg'),
  'nails-chrome': require('../assets/photos/nails-chrome.jpg'),
  'nails-french': require('../assets/photos/nails-french.jpg'),
  'nails-art': require('../assets/photos/nails-art.jpg'),
  'nails-blue': require('../assets/photos/nails-blue.jpg'),
  'nails-mauve': require('../assets/photos/nails-mauve.jpg'),
  'nails-work': require('../assets/photos/nails-work.jpg'),
  'nails-toes': require('../assets/photos/nails-toes.jpg'),
  'nails-hand': require('../assets/photos/nails-hand.jpg'),
  'nails-pastel': require('../assets/photos/nails-pastel.jpg'),
  'lashes-up': require('../assets/photos/lashes-up.jpg'),
  'brows-lami': require('../assets/photos/brows-lami.jpg'),
  'polish-wall': require('../assets/photos/polish-wall.jpg'),
  'product-serum': require('../assets/photos/product-serum.jpg'),
  'product-cream': require('../assets/photos/product-cream.jpg'),
};
