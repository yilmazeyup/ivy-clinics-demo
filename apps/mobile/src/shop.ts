import { PURE_PACKAGES, productById, SHIPPING_FEE, type PhotoKey, type Product, type PurePackage } from '@pure-ivy/shared';

export type CartLine = { id: string; qty: number };
export type Delivery = 'ship' | 'pickup';

/** Something the shop sells: a webshop product, or a pilates package that adds credits. */
export type ShopItem =
  | { kind: 'product'; id: string; price: number; product: Product }
  | { kind: 'package'; id: string; price: number; pkg: PurePackage };

export const packageItemId = (id: PurePackage['id']) => `pilates-${id}`;

/** Studio photos that stand for the pilates packages in the shop. */
export const PACKAGE_PHOTOS: Record<PurePackage['id'], PhotoKey> = { trial: 'pure-flow', ten: 'pure-core', unlimited: 'pure-burn' };

export function shopItem(id: string): ShopItem | undefined {
  const product = productById(id);
  if (product) return { kind: 'product', id, price: product.price, product };
  const pkg = PURE_PACKAGES.find((p) => packageItemId(p.id) === id);
  return pkg ? { kind: 'package', id, price: pkg.price, pkg } : undefined;
}

const cents = (amount: number) => Math.round(amount * 100) / 100;

/** Shipping only applies to physical products sent home; pilates credits and pickups are free. */
export function cartTotals(lines: CartLine[], delivery: Delivery) {
  const subtotal = cents(lines.reduce((sum, l) => sum + (shopItem(l.id)?.price ?? 0) * l.qty, 0));
  const physical = lines.some((l) => shopItem(l.id)?.kind === 'product');
  const shipping = physical && delivery === 'ship' ? SHIPPING_FEE : 0;
  return { subtotal, shipping, total: cents(subtotal + shipping), physical, count: lines.reduce((n, l) => n + l.qty, 0) };
}
