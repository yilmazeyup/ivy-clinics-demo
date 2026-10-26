import {
  dateKey,
  DEFAULT_LOCALE,
  generatePureSessions,
  initialIvyAppointments,
  initialPureBooking,
  PURE_MEMBER,
  type BrandId,
  type IvyAppointment,
  type Locale,
  type LocationId,
  type PureSession,
} from '@pure-ivy/shared';
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { cartTotals, shopItem, type CartLine, type Delivery } from '../shop';

export type PureBooking = { sessionId: string; reformer: number };

export type Order = {
  id: string;
  number: string;
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  delivery: Delivery;
  locationId: LocationId;
  createdAt: Date;
};

type DemoData = {
  now: Date;
  sessions: PureSession[];
  credits: number;
  unlimited: boolean;
  bookings: PureBooking[];
  waitlist: string[];
  appointments: IvyAppointment[];
  cart: CartLine[];
  orders: Order[];
};

type DemoContext = DemoData & {
  brand: BrandId;
  locale: Locale;
  setBrand: (brand: BrandId) => void;
  setLocale: (locale: Locale) => void;
  bookClass: (sessionId: string, reformer: number) => boolean;
  cancelClass: (sessionId: string) => void;
  joinWaitlist: (sessionId: string) => void;
  bookAppointment: (appointment: Omit<IvyAppointment, 'id'>) => string;
  cancelAppointment: (id: string) => void;
  addToCart: (id: string, qty?: number) => void;
  setCartQty: (id: string, qty: number) => void;
  placeOrder: (delivery: Delivery, locationId: LocationId) => string;
  reset: () => void;
};

function initialData(): DemoData {
  const now = new Date();
  const sessions = generatePureSessions(now, 14);
  const first = initialPureBooking(sessions, now);
  return {
    now,
    sessions,
    credits: PURE_MEMBER.credits,
    unlimited: false,
    bookings: first ? [first] : [],
    waitlist: [],
    appointments: initialIvyAppointments(now),
    cart: [],
    orders: [],
  };
}

const Context = createContext<DemoContext | null>(null);

export function DemoProvider({ children }: PropsWithChildren) {
  const [brand, setBrand] = useState<BrandId>('ivy');
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [data, setData] = useState<DemoData>(initialData);

  const bookClass = useCallback(
    (sessionId: string, reformer: number) => {
      if (!data.unlimited && data.credits < 1) return false;
      setData((d) => {
        if (d.bookings.some((b) => b.sessionId === sessionId)) return d;
        return {
          ...d,
          credits: d.unlimited ? d.credits : d.credits - 1,
          bookings: [...d.bookings, { sessionId, reformer }],
          waitlist: d.waitlist.filter((id) => id !== sessionId),
        };
      });
      return true;
    },
    [data.credits, data.unlimited],
  );

  const cancelClass = useCallback((sessionId: string) => {
    setData((d) => ({
      ...d,
      credits: d.unlimited ? d.credits : d.credits + 1,
      bookings: d.bookings.filter((b) => b.sessionId !== sessionId),
    }));
  }, []);

  const joinWaitlist = useCallback((sessionId: string) => {
    setData((d) => (d.waitlist.includes(sessionId) ? d : { ...d, waitlist: [...d.waitlist, sessionId] }));
  }, []);

  const bookAppointment = useCallback((appointment: Omit<IvyAppointment, 'id'>) => {
    const id = `appt-${appointment.start.getTime()}`;
    setData((d) => ({ ...d, appointments: [...d.appointments, { ...appointment, id }] }));
    return id;
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    setData((d) => ({ ...d, appointments: d.appointments.filter((a) => a.id !== id) }));
  }, []);

  const setCartQty = useCallback((id: string, qty: number) => {
    setData((d) => {
      const rest = d.cart.filter((l) => l.id !== id);
      if (qty <= 0) return { ...d, cart: rest };
      const at = d.cart.findIndex((l) => l.id === id);
      const cart = at === -1 ? [...d.cart, { id, qty }] : d.cart.map((l) => (l.id === id ? { id, qty } : l));
      return { ...d, cart };
    });
  }, []);

  const addToCart = useCallback((id: string, qty = 1) => {
    setData((d) => {
      const line = d.cart.find((l) => l.id === id);
      // A package is bought once per order; products add up.
      const next = shopItem(id)?.kind === 'package' ? 1 : (line?.qty ?? 0) + qty;
      const cart = line ? d.cart.map((l) => (l.id === id ? { id, qty: next } : l)) : [...d.cart, { id, qty: next }];
      return { ...d, cart };
    });
  }, []);

  /** A test payment: stores the order, adds bought pilates credits and empties the cart. */
  const placeOrder = useCallback(
    (delivery: Delivery, locationId: LocationId) => {
      const number = `IVY-${dateKey(new Date()).replace(/-/g, '').slice(2)}-${data.orders.length + 1}`;
      setData((d) => {
        const totals = cartTotals(d.cart, delivery);
        let { credits, unlimited } = d;
        for (const line of d.cart) {
          const item = shopItem(line.id);
          if (item?.kind !== 'package') continue;
          if (item.pkg.monthly) unlimited = true;
          else credits += item.pkg.credits * line.qty;
        }
        const order: Order = {
          id: number,
          number,
          lines: d.cart,
          subtotal: totals.subtotal,
          shipping: totals.shipping,
          total: totals.total,
          delivery: totals.physical ? delivery : 'pickup',
          locationId,
          createdAt: new Date(),
        };
        return { ...d, credits, unlimited, cart: [], orders: [order, ...d.orders] };
      });
      return number;
    },
    [data.orders.length],
  );

  const reset = useCallback(() => setData(initialData()), []);

  const value = useMemo<DemoContext>(
    () => ({
      ...data,
      brand,
      locale,
      setBrand,
      setLocale,
      bookClass,
      cancelClass,
      joinWaitlist,
      bookAppointment,
      cancelAppointment,
      addToCart,
      setCartQty,
      placeOrder,
      reset,
    }),
    [data, brand, locale, bookClass, cancelClass, joinWaitlist, bookAppointment, cancelAppointment, addToCart, setCartQty, placeOrder, reset],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDemo(): DemoContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
