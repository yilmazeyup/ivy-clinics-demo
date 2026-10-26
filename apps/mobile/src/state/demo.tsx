import {
  dateKey,
  DEFAULT_LOCALE,
  initialIvyAppointments,
  type IvyAppointment,
  type Locale,
  type LocationId,
} from '@pure-ivy/shared';
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { cartTotals, type CartLine, type Delivery } from '../shop';

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
  /** Whether the member joined the Pure Clinics membership in this demo. */
  member: boolean;
  appointments: IvyAppointment[];
  cart: CartLine[];
  orders: Order[];
};

type DemoContext = DemoData & {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  joinMembership: () => void;
  bookAppointment: (appointment: Omit<IvyAppointment, 'id'>) => string;
  cancelAppointment: (id: string) => void;
  addToCart: (id: string, qty?: number) => void;
  setCartQty: (id: string, qty: number) => void;
  placeOrder: (delivery: Delivery, locationId: LocationId) => string;
  reset: () => void;
};

function initialData(): DemoData {
  const now = new Date();
  return {
    now,
    member: false,
    appointments: initialIvyAppointments(now),
    cart: [],
    orders: [],
  };
}

const Context = createContext<DemoContext | null>(null);

export function DemoProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [data, setData] = useState<DemoData>(initialData);

  const joinMembership = useCallback(() => setData((d) => ({ ...d, member: true })), []);

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
      const next = (line?.qty ?? 0) + qty;
      const cart = line ? d.cart.map((l) => (l.id === id ? { id, qty: next } : l)) : [...d.cart, { id, qty: next }];
      return { ...d, cart };
    });
  }, []);

  /** A test payment: stores the order and empties the cart. */
  const placeOrder = useCallback(
    (delivery: Delivery, locationId: LocationId) => {
      const number = `PURE-${dateKey(new Date()).replace(/-/g, '').slice(2)}-${data.orders.length + 1}`;
      setData((d) => {
        const totals = cartTotals(d.cart, delivery);
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
        return { ...d, cart: [], orders: [order, ...d.orders] };
      });
      return number;
    },
    [data.orders.length],
  );

  const reset = useCallback(() => setData(initialData()), []);

  const value = useMemo<DemoContext>(
    () => ({
      ...data,
      locale,
      setLocale,
      joinMembership,
      bookAppointment,
      cancelAppointment,
      addToCart,
      setCartQty,
      placeOrder,
      reset,
    }),
    [data, locale, joinMembership, bookAppointment, cancelAppointment, addToCart, setCartQty, placeOrder, reset],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useDemo(): DemoContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
