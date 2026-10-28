import { addDays, dateKey, startOfDay } from '../i18n/format';
import { atTime, hash } from '../demo/random';
import { placesFor, serviceById, type AddOnId, type Service, type ServiceId } from './catalog';
import { studioHours, type StudioLocationId } from './studio';
import { STYLISTS, stylistById, worksAt, type Stylist, type StylistId } from './team';

export type Booking = {
  id: string;
  serviceId: ServiceId;
  stylistId: StylistId;
  location: StudioLocationId;
  start: Date;
  /** Nail art and other extras picked with it. */
  addOns?: AddOnId[];
  /** A gel colour from the shade studio or a saved look, so the stylist can prepare. */
  shadeId?: string;
  lookId?: string;
};

export type Slot = { start: Date; stylistId: StylistId };

/** Stylists who do a service, optionally only those who do it at one location. */
export function stylistsFor(service: Service, location?: StudioLocationId): Stylist[] {
  if (location && !placesFor(service).includes(location)) return [];
  return STYLISTS.filter((s) => s.crafts.includes(service.category) && !s.skips?.includes(service.id) && (location !== 'uden' || (s.uden?.length ?? 0) > 0));
}

type Block = { start: number; end: number };

/** Other clients' appointments for a stylist on a day, the same on every run. */
function busyBlocks(stylist: Stylist, day: Date, location: StudioLocationId): Block[] {
  const hours = studioHours(day, location);
  if (!hours) return [];
  const seed = hash(`blanche-${stylist.id}-${location}-${dateKey(day)}`);
  const blocks: Block[] = [];
  for (let i = 0; i < 5; i++) {
    const part = hash(`${seed}-${i}`);
    const startHour = hours.open + (part % Math.max(1, hours.close - hours.open - 1));
    const start = atTime(day, `${String(startHour).padStart(2, '0')}:${part % 2 === 0 ? '00' : '30'}`).getTime();
    blocks.push({ start, end: start + (45 + ((part >> 4) % 4) * 15) * 60000 });
  }
  return blocks;
}

/**
 * Bookable start times for a service on a day at a location: inside the opening hours, on the stylist's days there,
 * clear of other clients and of `extraBusy` (the member's own bookings), at least 30 minutes apart.
 */
export function openSlots(
  service: Service,
  stylistId: StylistId | 'any',
  day: Date,
  now: Date,
  extraBusy: Booking[] = [],
  minutes = service.minutes,
  location: StudioLocationId = 'nijmegen',
): Slot[] {
  const hours = studioHours(day, location);
  if (!hours || !placesFor(service).includes(location)) return [];
  const candidates = stylistsFor(service, location).filter((s) => stylistId === 'any' || s.id === stylistId);
  const found = new Map<number, StylistId>();
  for (const stylist of candidates) {
    if (!worksAt(stylist, day, location)) continue;
    const blocks = busyBlocks(stylist, day, location).concat(
      extraBusy
        .filter((b) => b.stylistId === stylist.id)
        .map((b) => ({ start: b.start.getTime(), end: b.start.getTime() + serviceById(b.serviceId).minutes * 60000 })),
    );
    let lastAccepted = -Infinity;
    for (let m = hours.open * 60; m + minutes <= hours.close * 60; m += 15) {
      const start = startOfDay(day).getTime() + m * 60000;
      if (start < now.getTime() + 2 * 3600000) continue;
      const end = start + minutes * 60000;
      if (blocks.some((b) => start < b.end && end > b.start) || start - lastAccepted < 30 * 60000) continue;
      lastAccepted = start;
      if (!found.has(start)) found.set(start, stylist.id);
    }
  }
  return Array.from(found.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([start, id]) => ({ start: new Date(start), stylistId: id }));
}

/** The first free moment with a stylist (or anyone), within three weeks. */
export function firstSlot(
  service: Service,
  stylistId: StylistId | 'any',
  now: Date,
  extraBusy: Booking[] = [],
  location: StudioLocationId = 'nijmegen',
): Slot | null {
  for (let d = 0; d < 21; d++) {
    const slots = openSlots(service, stylistId, addDays(startOfDay(now), d), now, extraBusy, service.minutes, location);
    if (slots.length) return slots[0];
  }
  return null;
}

/**
 * Lisa's history at Blanche: BIAB with a gel colour (True Red) with Mila three weeks ago and in the summer, a Korean lash
 * lift with Nova, and a brow lamination coming up. The BIAB is due again, which Home suggests.
 */
export function initialBookings(now: Date): Booking[] {
  const today = startOfDay(now);
  let next = addDays(today, 2);
  while (!worksAt(stylistById('nova'), next, 'nijmegen') || !studioHours(next)) next = addDays(next, 1);
  return [
    { id: 'bb-next', serviceId: 'brow-lamination', stylistId: 'nova', location: 'nijmegen', start: atTime(next, '16:30') },
    {
      id: 'bb-biab',
      serviceId: 'biab-color',
      stylistId: 'mila',
      location: 'nijmegen',
      start: atTime(addDays(today, -20), '18:00'),
      shadeId: 'truered',
      lookId: 'look-red',
    },
    { id: 'bb-lift', serviceId: 'lash-lift', stylistId: 'nova', location: 'nijmegen', start: atTime(addDays(today, -41), '11:00') },
    { id: 'bb-biab-0', serviceId: 'biab-nude', stylistId: 'mila', location: 'nijmegen', start: atTime(addDays(today, -48), '17:30'), addOns: ['sparkle'] },
  ];
}

/**
 * BIAB grows out: once a set is about three weeks old, suggest the next one with the same stylist, at the time of day
 * the member usually comes.
 */
export function refillSuggestion(
  now: Date,
  booked: Booking[],
): { last: Booking; service: Service; refill: Service; days: number; due: number; slot: Slot } | null {
  const past = booked.filter((b) => b.start.getTime() < now.getTime()).sort((a, b) => b.start.getTime() - a.start.getTime());
  for (const last of past) {
    const service = serviceById(last.serviceId);
    if (!service.refill) continue;
    const refill = serviceById(service.refill.service);
    // Already planned: nothing to suggest.
    if (booked.some((b) => b.start.getTime() > now.getTime() && serviceById(b.serviceId).category === service.category && b.serviceId !== 'biab-removal'))
      return null;
    const days = Math.floor((now.getTime() - last.start.getTime()) / 86400000);
    if (days < service.refill.days - 7) return null;
    const hour = last.start.getHours();
    for (let d = 1; d <= 14; d++) {
      const slots = openSlots(refill, last.stylistId, addDays(startOfDay(now), d), now, booked, refill.minutes, last.location);
      const pick = slots.find((s) => Math.abs(s.start.getHours() - hour) <= 1) ?? slots[slots.length - 1];
      if (pick) return { last, service, refill, days, due: service.refill.days, slot: pick };
    }
    return null;
  }
  return null;
}
