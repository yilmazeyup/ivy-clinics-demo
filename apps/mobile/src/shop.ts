import { productById, SHIPPING_FEE, type Product } from '@pure-clinics/shared';

export type CartLine = { id: string; qty: number };
export type Delivery = 'ship' | 'pickup';

/** Something the shop sells: a care product. */
export type ShopItem = { kind: 'product'; id: string; price: number; product: Product };

export function shopItem(id: string): ShopItem | undefined {
  const product = productById(id);
  return product ? { kind: 'product', id, price: product.price, product } : undefined;
}

const cents = (amount: number) => Math.round(amount * 100) / 100;

/** Shipping only applies when products are sent home; picking them up at the clinic is free. */
export function cartTotals(lines: CartLine[], delivery: Delivery) {
  const subtotal = cents(lines.reduce((sum, l) => sum + (shopItem(l.id)?.price ?? 0) * l.qty, 0));
  const physical = lines.length > 0;
  const shipping = physical && delivery === 'ship' ? SHIPPING_FEE : 0;
  return { subtotal, shipping, total: cents(subtotal + shipping), physical, count: lines.reduce((n, l) => n + l.qty, 0) };
}
