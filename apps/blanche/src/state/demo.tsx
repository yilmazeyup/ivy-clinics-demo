import { dateKey, DEFAULT_LOCALE, type Locale } from '@pure-clinics/shared';
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { initialBookings, MEMBER, rewardById, type Booking } from '../data';
import { cartTotals, type CartLine, type Delivery } from '../shop';

export type Order = {
  id: string;
  number: string;
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  delivery: Delivery;
  createdAt: Date;
};

type DemoData = {
  now: Date;
  bookings: Booking[];
  cart: CartLine[];
  orders: Order[];
  /** Blanche Club points. */
  points: number;
  /** Rewards swapped for points, waiting to be used at the next visit. */
  vouchers: string[];
  /** Looks hearted in the inspo deck. */
  saved: string[];
  /** The gel colour last picked in the shade studio. */
  shade: string | null;
};

type DemoContext = DemoData & {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  book: (booking: Omit<Booking, 'id'>) => string;
  cancel: (id: string) => void;
  addToCart: (id: string, qty?: number) => void;
  setCartQty: (id: string, qty: number) => void;
  placeOrder: (delivery: Delivery) => string;
  redeem: (rewardId: string) => boolean;
  toggleSaved: (lookId: string) => void;
  setShade: (shadeId: string | null) => void;
  reset: () => void;
};

function initialData(): DemoData {
  const now = new Date();
  return { now, bookings: initialBookings(now), cart: [], orders: [], points: MEMBER.points, vouchers: [], saved: ['look-red', 'look-sparkle'], shade: null };
}

const Context = createContext<DemoContext | null>(null);

export function DemoProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [data, setData] = useState<DemoData>(initialData);

  const book = useCallback((booking: Omit<Booking, 'id'>) => {
    const id = `bb-${booking.start.getTime()}`;
    setData((d) => ({ ...d, bookings: [...d.bookings.filter((b) => b.id !== id), { ...booking, id }] }));
    return id;
  }, []);

  const cancel = useCallback((id: string) => setData((d) => ({ ...d, bookings: d.bookings.filter((b) => b.id !== id) })), []);

  const setCartQty = useCallback((id: string, qty: number) => {
    setData((d) => {
      const rest = d.cart.filter((l) => l.id !== id);
      if (qty <= 0) return { ...d, cart: rest };
      const at = d.cart.findIndex((l) => l.id === id);
      return { ...d, cart: at === -1 ? [...d.cart, { id, qty }] : d.cart.map((l) => (l.id === id ? { id, qty } : l)) };
    });
  }, []);

  const addToCart = useCallback((id: string, qty = 1) => {
    setData((d) => {
      const line = d.cart.find((l) => l.id === id);
      const cart = line ? d.cart.map((l) => (l.id === id ? { id, qty: l.qty + qty } : l)) : [...d.cart, { id, qty }];
      return { ...d, cart };
    });
  }, []);

  /** A test payment: stores the order and empties the cart. */
  const placeOrder = useCallback(
    (delivery: Delivery) => {
      const number = `BB-${dateKey(new Date()).replace(/-/g, '').slice(2)}-${data.orders.length + 1}`;
      setData((d) => {
        const totals = cartTotals(d.cart, delivery);
        const order: Order = { id: number, number, lines: d.cart, ...totals, delivery, createdAt: new Date() };
        return { ...d, cart: [], orders: [order, ...d.orders] };
      });
      return number;
    },
    [data.orders.length],
  );

  const redeem = useCallback(
    (rewardId: string) => {
      const reward = rewardById(rewardId);
      if (!reward || data.points < reward.points) return false;
      setData((d) => ({ ...d, points: d.points - reward.points, vouchers: [...d.vouchers, rewardId] }));
      return true;
    },
    [data.points],
  );

  const toggleSaved = useCallback(
    (lookId: string) => setData((d) => ({ ...d, saved: d.saved.includes(lookId) ? d.saved.filter((x) => x !== lookId) : [...d.saved, lookId] })),
    [],
  );

  const setShade = useCallback((shade: string | null) => setData((d) => ({ ...d, shade })), []);
  const reset = useCallback(() => setData(initialData()), []);

  const value = useMemo<DemoContext>(
    () => ({ ...data, locale, setLocale, book, cancel, addToCart, setCartQty, placeOrder, redeem, toggleSaved, setShade, reset }),
    [data, locale, book, cancel, addToCart, setCartQty, placeOrder, redeem, toggleSaved, setShade, reset],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDemo(): DemoContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
