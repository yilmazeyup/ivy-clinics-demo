import { addDays, dateKey, startOfDay, startOfWeek } from '@pure-clinics/shared';
import {
  LOOKS,
  POLISH,
  serviceById,
  STYLISTS,
  tierFor,
  type AddOnId,
  type CategoryId,
  type Service,
  type ServiceId,
  type Stylist,
  type Tier,
} from '@pure-clinics/shared/src/blanche';

import { personName, rng } from '../../../src/data/random';
import type { MessageKey } from '../i18n';
import { between, pick, type Appt } from './day';

/** A note the stylist wrote after a visit; the words live in the language files. */
export type NoteKey = Extract<MessageKey, `note.${string}`>;

export type ClientVisit = { date: Date; service: Service; stylist: Stylist; shade: string | null; addOns: AddOnId[]; price: number; note: NoteKey };

export type Source = 'instagram' | 'friend' | 'google' | 'pure' | 'walkin';

export type ClientFile = {
  since: Date;
  source: Source;
  points: number;
  tier: Tier;
  /** Favourite shape and length, for nail clients. */
  shape: 'square' | 'squoval' | 'almond' | 'oval' | null;
  /** Visits before today, newest first; empty for a first visit. */
  visits: ClientVisit[];
  /** Looks she saved in the app's inspo deck. */
  saved: string[];
  /** For a lash lift: when the patch test was done. */
  patch: Date | null;
  /** The visit after this one, if she already booked it. */
  next: { date: Date; service: Service; stylist: Stylist } | null;
};

const NOTES: Record<CategoryId, NoteKey[]> = {
  nails: ['note.biabStrong', 'note.biabShort', 'note.biabCuticles', 'note.biabOil', 'note.biabColour'],
  lashes: ['note.liftCurl', 'note.liftSensitive', 'note.liftTint'],
  brows: ['note.browsSparse', 'note.browsShape', 'note.browsSerum'],
};

/** Days between visits that clients keep to, per craft. */
const RHYTHM: Record<CategoryId, [number, number]> = { nails: [21, 30], lashes: [42, 60], brows: [35, 56] };

const SOURCES: Source[] = ['instagram', 'instagram', 'instagram', 'friend', 'friend', 'google', 'pure', 'walkin'];

/** Everything the studio knows about the client in a chair, made up but the same on every load. */
export function clientFile(appt: Appt): ClientFile {
  const r = rng(`blanche-file-${appt.client}`);
  const category = appt.service.category;
  const visits: ClientVisit[] = [];
  if (!appt.firstVisit) {
    let date = startOfDay(appt.start);
    const count = between(r, 2, 7);
    for (let i = 0; i < count; i++) {
      const [lo, hi] = RHYTHM[category];
      date = addDays(date, -between(r, lo, hi));
      // Now and then she came for something else too.
      const service = i > 0 && r() < 0.25 ? serviceById(pick(r, ['brow-lamination', 'lash-lift', 'biab-color'] as ServiceId[])) : appt.service.id === 'biab-removal' ? serviceById('biab-nude') : appt.service;
      const stylist = STYLISTS.find((s) => s.crafts.includes(service.category) && (r() < 0.8 ? s.id === appt.stylist.id : true)) ?? appt.stylist;
      const art: AddOnId[] = service.addOns && r() < 0.35 ? [pick(r, ['chrome', 'french', 'sparkle', 'polka'] as AddOnId[])] : [];
      visits.push({
        date: new Date(date.getTime() + (10 + between(r, 0, 9)) * 3600000),
        service,
        stylist,
        shade: service.category === 'nails' ? pick(r, POLISH).id : null,
        addOns: art,
        price: service.price + (art.length ? 10 : 0),
        note: pick(r, NOTES[service.category]),
      });
    }
  }
  const since = visits.length ? addDays(visits[visits.length - 1].date, -between(r, 0, 120)) : startOfDay(appt.start);
  const points = visits.reduce((sum, v) => sum + Math.round(v.price), 0) + between(r, 0, 120);
  const [lo] = RHYTHM[category];
  const books = r() < 0.55;
  return {
    since,
    source: pick(r, SOURCES),
    points,
    tier: tierFor(points).tier,
    shape: category === 'nails' ? pick(r, ['square', 'squoval', 'almond', 'oval'] as const) : null,
    visits,
    saved: LOOKS.filter(() => r() < 0.3).map((l) => l.id),
    patch: category === 'lashes' ? addDays(appt.start, -between(r, 2, 40)) : null,
    next: books ? { date: addDays(startOfDay(appt.start), lo + between(r, 0, 7)), service: appt.service, stylist: appt.stylist } : null,
  };
}

/** A client whose BIAB is growing out and who has not booked the next one yet. */
export type DueClient = { id: string; name: string; last: Date; days: number; stylist: Stylist; shade: string; service: Service };

/** About a dozen clients a week who are due for their next BIAB, the same on every load of that week. */
export function dueClients(now: Date): DueClient[] {
  const week = startOfWeek(now);
  const r = rng(`blanche-due-${dateKey(week)}`);
  const nails = STYLISTS.filter((s) => s.crafts.includes('nails'));
  const seen = new Set<string>();
  const list: DueClient[] = [];
  for (let i = 0; i < 12; i++) {
    let name = personName(r);
    while (seen.has(name)) name = personName(r);
    seen.add(name);
    const days = between(r, 20, 38);
    list.push({
      id: `due-${i}`,
      name,
      last: addDays(startOfDay(now), -days),
      days,
      stylist: pick(r, nails),
      shade: pick(r, POLISH).id,
      service: serviceById(r() < 0.55 ? 'biab-color' : 'biab-nude'),
    });
  }
  return list.sort((a, b) => b.days - a.days);
}

/** Grown out after three weeks; overdue after four. */
export const dueState = (days: number): 'due' | 'late' => (days > 28 ? 'late' : 'due');
