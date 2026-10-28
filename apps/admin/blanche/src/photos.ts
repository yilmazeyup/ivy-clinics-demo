import type { BlanchePhoto } from '@pure-clinics/shared/src/blanche';

// The member app's photos, bundled once more for the panel (client cards, the social grid).
const FILES = import.meta.glob('../../../blanche/assets/photos/*.jpg', { eager: true, import: 'default' }) as Record<string, string>;

export function photoUrl(key: BlanchePhoto): string {
  return FILES[`../../../blanche/assets/photos/${key}.jpg`] ?? '';
}
