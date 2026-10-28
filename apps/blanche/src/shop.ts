import type { L10n } from '@pure-clinics/shared';

import { PACKS, productById, SHOP, type BlanchePhoto, type BlancheProduct, type Pack } from './data';

export type CartLine = { id: string; qty: number };
export type Delivery = 'ship' | 'pickup';

/** Something the cart can hold: a product, a gift card or a prepaid pass (id `pack:<id>`). */
export type ShopItem = { id: string; price: number; name: L10n; photo: BlanchePhoto; physical: boolean; product?: BlancheProduct; pack?: Pack };

export function shopItem(id: string): ShopItem | undefined {
  if (id.startsWith('pack:')) {
    const pack = PACKS.find((p) => p.id === id.slice(5));
    if (!pack) return undefined;
    const photo: BlanchePhoto = pack.shade === 'cherry' ? 'nails-nude' : pack.shade === 'lilac' ? 'lashes-lift' : 'brows-lami';
    return { id, price: pack.price, name: pack.name, photo, physical: false, pack };
  }
  const product = productById(id);
  return product ? { id, price: product.price, name: product.name, photo: product.photo, physical: product.kind === 'product', product } : undefined;
}

const cents = (amount: number) => Math.round(amount * 100) / 100;

/** Gift cards and passes come by e-mail; products ship, or wait at the studio for free. Shipping is free above a threshold. */
export function cartTotals(lines: CartLine[], delivery: Delivery) {
  const subtotal = cents(lines.reduce((sum, l) => sum + (shopItem(l.id)?.price ?? 0) * l.qty, 0));
  const physical = lines.some((l) => shopItem(l.id)?.physical);
  const shipping = physical && delivery === 'ship' && subtotal < SHOP.freeShippingFrom ? SHOP.shippingFee : 0;
  return { subtotal, shipping, total: cents(subtotal + shipping), physical, count: lines.reduce((n, l) => n + l.qty, 0) };
}
