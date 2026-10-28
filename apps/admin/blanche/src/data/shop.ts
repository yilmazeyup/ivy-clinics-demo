import { dateKey, startOfDay } from '@pure-clinics/shared';
import { PRODUCTS, SHOP, type BlancheProduct } from '@pure-clinics/shared/src/blanche';

import { between, personName, pick, rng } from '../../../src/data/random';

export type OrderLine = { product: BlancheProduct; qty: number };

export type Order = {
  id: string;
  number: number;
  at: Date;
  customer: string;
  city: string;
  lines: OrderLine[];
  total: number;
  /** Picked up at the studio instead of shipped. */
  pickup: boolean;
};

const CITIES = ['Nijmegen', 'Nijmegen', 'Nijmegen', 'Uden', 'Wijchen', 'Beuningen', 'Arnhem', 'Malden', 'Elst', 'Lent'];

/** Cuticle oil and the € 50 gift card sell most. */
const WEIGHT: Record<string, number> = { 'cuticle-oil': 5, 'gift-50': 3, 'lash-serum': 3, 'gift-25': 2, 'hand-cream': 2, 'brow-gel': 2, 'gift-75': 1, 'gift-100': 1 };
const POOL = PRODUCTS.flatMap((p) => Array<BlancheProduct>(WEIGHT[p.id] ?? 1).fill(p));

/** Orders come in all day, busiest in the evening when people scroll. */
const HOURS = [8, 9, 10, 11, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23];

function makeOrder(seed: string, at: Date, number: number): Order {
  const r = rng(seed);
  const lines: OrderLine[] = [];
  const count = r() < 0.7 ? 1 : 2;
  for (let i = 0; i < count; i++) {
    const product = pick(r, POOL);
    const line = lines.find((l) => l.product.id === product.id);
    if (line) line.qty += 1;
    else lines.push({ product, qty: 1 });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const physical = lines.some((l) => l.product.kind === 'product');
  const pickup = physical && r() < 0.35;
  const shipping = physical && !pickup && subtotal < SHOP.freeShippingFrom ? SHOP.shippingFee : 0;
  return { id: `bb-order-${number}`, number, at, customer: personName(r), city: pick(r, CITIES), lines, total: Math.round((subtotal + shipping) * 100) / 100, pickup };
}

/** The day's shop orders, the same on every load; order numbers keep rising from day to day. */
export function shopDay(day: Date): Order[] {
  const r = rng(`blanche-shop-${dateKey(day)}`);
  const base = startOfDay(day).getTime();
  const first = 410 + (Math.floor(base / 86400000) % 1000) * 9;
  return Array.from({ length: between(r, 3, 7) }, () => base + (pick(r, HOURS) * 60 + between(r, 0, 59)) * 60000)
    .sort((a, b) => a - b)
    .map((at, i) => makeOrder(`blanche-shop-${dateKey(day)}-${i}`, new Date(at), first + i));
}

export const ordersUntil = (orders: Order[], now: Date) => orders.filter((o) => o.at.getTime() <= now.getTime());
export const orderTotal = (orders: Order[]) => orders.reduce((sum, o) => sum + o.total, 0);

/** Units on the shelf at the start of the day (demo stock); gift cards are digital and never run out. */
export function stockOf(product: BlancheProduct, day: Date): number | null {
  if (product.kind === 'giftcard') return null;
  return between(rng(`blanche-stock-${product.id}-${dateKey(day)}`), 4, 26);
}
