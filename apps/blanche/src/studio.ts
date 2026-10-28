import { useMemo } from 'react';

import { refillSuggestion, serviceById, stylistById, tierFor, type Booking, type Service, type ServiceId, type Stylist, type StylistId } from './data';
import { useDemo } from './state/demo';

export type BookingView = Booking & { service: Service; stylist: Stylist };

/** Studio data joined with the member's own bookings, ready for screens. */
export function useStudio() {
  const demo = useDemo();
  return useMemo(() => {
    const view = (b: Booking): BookingView => ({ ...b, service: serviceById(b.serviceId), stylist: stylistById(b.stylistId) });
    const all = demo.bookings.map(view);
    const now = demo.now.getTime();
    const upcoming = all.filter((b) => b.start.getTime() > now).sort((a, b) => a.start.getTime() - b.start.getTime());
    const past = all.filter((b) => b.start.getTime() <= now).sort((a, b) => b.start.getTime() - a.start.getTime());
    return {
      ...demo,
      upcoming,
      past,
      next: upcoming[0],
      refill: refillSuggestion(demo.now, demo.bookings),
      level: tierFor(demo.points),
      byId: (id: string) => all.find((b) => b.id === id),
      /** Who did this service last time, so the booking flow can suggest the same stylist. */
      lastStylistFor: (serviceId: ServiceId): StylistId | undefined => past.find((b) => b.serviceId === serviceId)?.stylistId,
    };
  }, [demo]);
}

/** Points a visit earns: one per euro. */
export const pointsFor = (amount: number) => Math.round(amount);
