import { dateKey, PRODUCTS, SHIPPING_FEE, startOfDay, treatmentById, type Product, type ProductId } from '@pure-ivy/shared';

import { between, personName, pick, rng } from './random';

export type OrderLine = { product: Product; qty: number };

export type Order = {
  id: string;
  number: number;
  at: Date;
  customer: string;
  city: string;
  lines: OrderLine[];
  total: number;
  /** The treatment whose aftercare this order follows, when a specialist recommended it. */
  afterTreatment: string | null;
};

const CITIES = ['Amsterdam', 'Amstelveen', "'s-Hertogenbosch", 'Westervoort', 'Utrecht', 'Haarlem', 'Arnhem', 'Nijmegen', 'Eindhoven', 'Rotterdam'];

/** Aftercare and the cleanser sell most; the big set least. */
const WEIGHT: Partial<Record<ProductId, number>> = {
  alhydran: 4,
  'pomegranate-cleanser': 3,
  'eyelight-serum': 2,
  'earth-cream': 2,
  'ayz-drops': 2,
};
const POOL = PRODUCTS.filter((p) => !p.soldOut).flatMap((p) => Array<Product>(WEIGHT[p.id] ?? 1).fill(p));

/** Orders come in all day, busiest around lunch and in the evening. */
const HOURS = [7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 15, 16, 17, 18, 19, 20, 20, 21, 21, 22, 22, 23];

export function makeOrder(seed: string, at: Date, number: number): Order {
  const r = rng(seed);
  const lines: OrderLine[] = [];
  const count = r() < 0.6 ? 1 : r() < 0.8 ? 2 : 3;
  for (let i = 0; i < count; i++) {
    const product = pick(r, POOL);
    const line = lines.find((l) => l.product.id === product.id);
    if (line) line.qty += 1;
    else lines.push({ product, qty: 1 });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const after = lines.find((l) => l.product.after?.length)?.product.after;
  return {
    id: `order-${number}`,
    number,
    at,
    customer: personName(r),
    city: pick(r, CITIES),
    lines,
    total: Math.round((subtotal + SHIPPING_FEE) * 100) / 100,
    afterTreatment: after && r() < 0.55 ? treatmentById(pick(r, after)).name.nl : null,
  };
}

/** The day's webshop orders, the same on every load. Order numbers keep rising from day to day. */
export function shopDay(day: Date): Order[] {
  const r = rng(`shop-${dateKey(day)}`);
  const base = startOfDay(day).getTime();
  const firstNumber = 2000 + (Math.floor(base / 86400000) % 1000) * 30;
  return Array.from({ length: between(r, 18, 30) }, () => base + (pick(r, HOURS) * 60 + between(r, 0, 59)) * 60000)
    .sort((a, b) => a - b)
    .map((at, i) => makeOrder(`shop-${dateKey(day)}-${i}`, new Date(at), firstNumber + i));
}

export const ordersUntil = (orders: Order[], now: Date) => orders.filter((o) => o.at.getTime() <= now.getTime());

export const orderTotal = (orders: Order[]) => orders.reduce((sum, o) => sum + o.total, 0);

export const shopRevenue = (day: Date) => orderTotal(shopDay(day));

/** Units on the shelf at the start of the day: demo stock, with the sold-out product at zero. */
export function stockOf(product: Product, day: Date): number {
  if (product.soldOut) return 0;
  if (product.id === 'best-seller-edit') return 4;
  return between(rng(`stock-${product.id}-${dateKey(day)}`), 7, 36);
}
