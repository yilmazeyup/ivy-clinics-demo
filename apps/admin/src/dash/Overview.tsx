import { addDays, LOCATIONS, productById, PURE_CAPACITY, sameDay, startOfDay } from '@pure-ivy/shared';
import { useEffect, useRef, useState } from 'react';

import { Insights, LiveFeed, WeekChart, type Insight, type Series, type WeekDay } from '../components/panels';
import { ShopCard } from '../components/ShopCard';
import { SkylineView } from '../components/SkylineView';
import { StudioView } from '../components/StudioView';
import { KpiTile, MiniBars, Sparkline, Squares, type FeedItem } from '../components/ui';
import { bookInGap, clinicDay, clinicRevenue, clinicViewDay, phaseOf as apptPhase, revenueOf, type Appt } from '../data/clinics';
import { clock, eur, num, pct, weekdayLong } from '../data/format';
import {
  bookSeat,
  cancelSeat,
  checkedIn,
  classRevenue,
  focusClass,
  freeReformers,
  passSales,
  phaseOf as classPhase,
  pilatesClasses,
  pilatesRevenue,
  type PilatesClass,
} from '../data/pilates';
import { personName, pick, rng } from '../data/random';
import { makeOrder, orderTotal, ordersUntil, productName, shopDay, shopRevenue, stockOf, type Order } from '../data/shop';

const SERIES: Series[] = [
  { label: 'Behandelingen', color: '#2F4A3C' },
  { label: 'Pilates', color: '#9DB5A2' },
  { label: 'Webshop', color: '#D9C2AC' },
];

const PASSES: [string, number][] = [
  ['10 lessen', 210],
  ['Onbeperkt, per maand', 159],
  ['Proefles', 15],
];

let feedId = 0;
const item = (fields: Omit<FeedItem, 'id'> & { id?: string }): FeedItem => ({ id: `f-${Date.now().toString(36)}-${++feedId}`, ...fields });
const cityOf = (a: Appt) => LOCATIONS.find((l) => l.id === a.clinic)?.city ?? '';

function orderLine(order: Order): string {
  const extra = order.lines.reduce((n, l) => n + l.qty, 0) - 1;
  return `${order.customer} · ${productName(order.lines[0].product)}${extra > 0 ? ` +${extra}` : ''}`;
}

const dayTotal = (day: Date) => clinicRevenue(day) + pilatesRevenue(day) + shopRevenue(day);

/** A believable start for the feed: the last half hour across clinics, studio and shop. */
function firstFeed(appts: Appt[], classes: PilatesClass[], orders: Order[], now: Date): FeedItem[] {
  const r = rng(`feed-${now.toDateString()}`);
  const minutes = (m: number) => new Date(now.getTime() - m * 60000);
  const botox = appts.find((a) => a.treatment.id === 'botox');
  const later = classes.filter((c) => c.start.getTime() > now.getTime());
  const evening = later[later.length - 1] ?? classes[classes.length - 1];
  const lastOrder = ordersUntil(orders, now).at(-1);
  const items: FeedItem[] = [];
  if (botox) {
    items.push(item({ at: minutes(3), source: 'Kliniek', icon: 'calendar', title: `${botox.client} · Botox`, detail: `${cityOf(botox)} · ${clock(botox.start)} · aanbetaling betaald`, amount: eur(25), accent: true }));
  }
  items.push(item({ at: minutes(6), source: 'Pilates', icon: 'calendar', title: `${personName(r)} boekte ${evening.name}`, detail: `${clock(evening.start)} · reformer 3 · via de app` }));
  if (lastOrder) {
    items.push(item({ at: lastOrder.at, source: 'Webshop', icon: 'bag', title: `Bestelling #${lastOrder.number}`, detail: orderLine(lastOrder), amount: eur(lastOrder.total) }));
  }
  items.push(item({ at: minutes(17), source: 'Kliniek', icon: 'clipboard', title: 'Medische intake ingevuld', detail: `${personName(r)} · Lipfiller · morgen 10:00` }));
  items.push(item({ at: minutes(24), source: 'Pilates', icon: 'bag', title: 'Pakket verkocht', detail: `${personName(r)} · 10 lessen · iDEAL (test)`, amount: eur(210) }));
  items.push(item({ at: minutes(32), source: 'Kliniek', icon: 'plus', title: 'Gratis adviesgesprek gepland', detail: `${personName(r)} · 's-Hertogenbosch · morgen 16:00` }));
  return items.sort((a, b) => b.at.getTime() - a.at.getTime());
}

/** The one overview of Ivy Clinics: the four clinics, the pilates studio and the webshop, live. */
export function Overview({ now, playing }: { now: Date; playing: boolean }) {
  const [clinicsDay] = useState(() => clinicViewDay(now));
  const [appts, setAppts] = useState(() => clinicDay(clinicsDay));
  const [classes, setClasses] = useState(() => pilatesClasses(now));
  const [passes, setPasses] = useState(0);
  const [orders, setOrders] = useState(() => shopDay(now));
  const [feed, setFeed] = useState(() => firstFeed(appts, classes, orders, now));
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const live = useRef({ appts, classes, orders, now });
  live.current = { appts, classes, orders, now };

  const push = (...items: FeedItem[]) => setFeed((current) => [...items, ...current].slice(0, 40));

  // Every few seconds something happens somewhere: a booking, a sale, a waitlist move, an order.
  useEffect(() => {
    let timer = 0;
    const fire = () => {
      const { appts: diary, classes: list, orders: shop, now: at } = live.current;
      const seed = `${at.getTime()}-${Math.random()}`;
      const r = rng(seed);
      const roll = r();
      const sub = r();

      if (roll < 0.4) {
        if (sub < 0.6) {
          const consult = sub < 0.15;
          const booking = bookInGap(diary, at, seed, consult);
          if (booking) {
            setAppts((current) => [...current, booking]);
            push(
              consult
                ? item({ at, source: 'Kliniek', icon: 'plus', title: 'Gratis adviesgesprek gepland', detail: `${booking.client} · ${cityOf(booking)} · ${clock(booking.start)}`, accent: true })
                : item({
                    at,
                    source: 'Kliniek',
                    icon: 'calendar',
                    title: `${booking.client} · ${booking.treatment.name.nl}`,
                    detail: `${cityOf(booking)} · ${clock(booking.start)} met ${booking.specialist.name}`,
                    amount: booking.treatment.deposit ? eur(booking.treatment.deposit) : undefined,
                    accent: true,
                  }),
            );
            return;
          }
        }
        const later = diary.filter((a) => apptPhase(a, at) === 'later' && a.treatment.id !== 'consult');
        if (!later.length) return;
        const a = pick(r, later);
        push(
          sub < 0.85
            ? item({ at, source: 'Kliniek', icon: 'clipboard', title: 'Medische intake ingevuld', detail: `${a.client} · ${a.treatment.name.nl} om ${clock(a.start)}` })
            : item({ at, source: 'Kliniek', icon: 'mail', title: 'Herinnering verstuurd', detail: `${a.client} · ${a.treatment.name.nl} om ${clock(a.start)} in ${cityOf(a)}` }),
        );
        return;
      }

      if (roll < 0.72) {
        const upcoming = list.filter((c) => classPhase(c, at) === 'later' || classPhase(c, at) === 'soon');
        const open = upcoming.filter((c) => freeReformers(c).length > 0);
        const full = upcoming.filter((c) => freeReformers(c).length === 0);
        const cancellable = list.filter((c) => classPhase(c, at) === 'later' && c.seats.length > 0);
        if (sub < 0.45 && open.length) {
          const c = pick(r, open);
          const booked = bookSeat(c, seed);
          if (booked) {
            setClasses((cs) => cs.map((x) => (x.id === c.id ? booked.next : x)));
            push(item({ at, source: 'Pilates', icon: 'calendar', title: `${booked.seat.member} boekte ${c.name}`, detail: `${clock(c.start)} · reformer ${booked.seat.reformer} · via de app` }));
            return;
          }
        }
        if (sub < 0.65) {
          const [name, price] = pick(r, PASSES);
          setPasses((p) => p + price);
          push(item({ at, source: 'Pilates', icon: 'bag', title: 'Pakket verkocht', detail: `${personName(r)} · ${name} · iDEAL (test)`, amount: eur(price) }));
          return;
        }
        if (sub < 0.8 && full.length) {
          const c = pick(r, full);
          setClasses((cs) => cs.map((x) => (x.id === c.id ? { ...x, waitlist: x.waitlist + 1 } : x)));
          push(item({ at, source: 'Pilates', icon: 'queue', title: `${personName(r)} op de wachtlijst`, detail: `${c.name} ${clock(c.start)} · plek ${c.waitlist + 1} in de rij` }));
          return;
        }
        if (cancellable.length) {
          const c = pick(r, cancellable);
          const seat = pick(r, c.seats);
          const result = cancelSeat(c, seat.reformer, seed);
          setClasses((cs) => cs.map((x) => (x.id === c.id ? result.next : x)));
          const events = [item({ at, source: 'Pilates', icon: 'undo', title: 'Op tijd geannuleerd', detail: `${seat.member} · ${c.name} ${clock(c.start)} · credit terug` })];
          if (result.promoted) {
            events.unshift(
              item({ at, source: 'Pilates', icon: 'queue', title: 'Wachtlijst schoof door', detail: `${result.promoted.member} kreeg reformer ${seat.reformer} · push verstuurd`, accent: true }),
            );
          }
          push(...events);
        }
        return;
      }

      // A webshop order placed right now; the order effect below announces it.
      const number = Math.max(0, ...shop.map((o) => o.number)) + 1;
      setOrders((current) => [...current, makeOrder(seed, at, number)]);
    };
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          fire();
          schedule();
        },
        playing ? 1800 + Math.random() * 1400 : 4200 + Math.random() * 3800,
      );
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [playing]);

  // Check-ins follow the clock; each class keeps one feed line that counts up.
  const seenSeats = useRef<Set<string> | null>(null);
  useEffect(() => {
    const inside = new Set<string>();
    for (const c of classes) for (const s of c.seats) if (checkedIn(s, c, now)) inside.add(`${c.id}|${s.reformer}|${s.member}`);
    const before = seenSeats.current;
    seenSeats.current = inside;
    if (!before) return;
    const byClass = new Map<string, string[]>();
    for (const key of inside) {
      if (before.has(key)) continue;
      const [id, , member] = key.split('|');
      byClass.set(id, [...(byClass.get(id) ?? []), member]);
    }
    if (!byClass.size) return;
    const lines: FeedItem[] = [];
    for (const [id, members] of byClass) {
      const c = classes.find((x) => x.id === id);
      if (!c) continue;
      const count = c.seats.filter((s) => checkedIn(s, c, now)).length;
      lines.push(
        item({
          id: `in-${id}-${count}`,
          at: now,
          source: 'Pilates',
          icon: 'scan',
          title: members.length === 1 ? `${members[0]} checkte in` : `${members.length} leden checkten in`,
          detail: `${c.name} ${clock(c.start)} · ${count} van ${c.seats.length} binnen`,
        }),
      );
    }
    setFeed((current) => [...lines, ...current.filter((f) => !lines.some((l) => f.id.startsWith(l.id.replace(/-\d+$/, '-'))))].slice(0, 40));
  }, [classes, now]);

  // Orders appear in the feed when their time comes, also while the day is being played.
  const seenOrders = useRef<Set<string> | null>(null);
  useEffect(() => {
    const visible = ordersUntil(orders, now);
    const before = seenOrders.current;
    seenOrders.current = new Set(visible.map((o) => o.id));
    if (!before) return;
    const fresh = visible.filter((o) => !before.has(o.id));
    if (!fresh.length) return;
    if (fresh.length > 2) {
      push(item({ at: now, source: 'Webshop', icon: 'bag', title: `${fresh.length} nieuwe bestellingen`, detail: fresh.map((o) => `#${o.number}`).join(' · '), amount: eur(orderTotal(fresh)) }));
      return;
    }
    push(
      ...fresh.map((o) =>
        item({ at: o.at, source: 'Webshop', icon: 'bag', title: `Bestelling #${o.number}`, detail: orderLine(o), amount: eur(o.total), accent: Boolean(o.afterTreatment) }),
      ),
    );
  }, [orders, now]);

  const isClinicDay = sameDay(clinicsDay, now);
  const running = isClinicDay ? appts.filter((a) => apptPhase(a, now) === 'now').length : 0;
  const todaysOrders = ordersUntil(orders, now);
  const shopToday = orderTotal(todaysOrders);
  const revenue = (isClinicDay ? revenueOf(appts) : 0) + classRevenue(classes) + passSales(now) + passes + shopToday;
  // Like for like: the same weekday over the last four weeks, with the webshop counted up to this time of day.
  const [usual] = useState(() => {
    const totals = [7, 14, 21, 28].map((days) => {
      const then = addDays(now, -days);
      return clinicRevenue(then) + pilatesRevenue(then) + orderTotal(ordersUntil(shopDay(then), then));
    });
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  });
  const [history] = useState(() => Array.from({ length: 14 }, (_, i) => dayTotal(addDays(now, i - 13))));
  const [week] = useState<WeekDay[]>(() => {
    const monday = addDays(startOfDay(now), -((now.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      return { date, parts: [clinicRevenue(date), pilatesRevenue(date), shopRevenue(date)] };
    });
  });

  const booked = classes.reduce((n, c) => n + c.seats.length, 0);
  const capacity = classes.length * PURE_CAPACITY;
  const fullClasses = classes.filter((c) => freeReformers(c).length === 0).length;
  const apptsPerHour = Array.from({ length: 12 }, (_, i) => appts.filter((a) => a.start.getHours() === 9 + i).length);
  const ordersPerHour = Array.from({ length: 17 }, (_, i) => todaysOrders.filter((o) => o.at.getHours() === 7 + i).length);

  const selected = (selectedClass === null ? focusClass(classes, now) : classes.find((c) => c.id === selectedClass)) ?? classes[0];
  const busiest = classes.find((c) => freeReformers(c).length === 0 && c.waitlist > 0);
  const aftercare = productById('alhydran')!;
  const aftercareLeft = Math.max(
    0,
    stockOf(aftercare, now) - todaysOrders.reduce((n, o) => n + o.lines.filter((l) => l.product.id === aftercare.id).reduce((q, l) => q + l.qty, 0), 0),
  );
  const insights: Insight[] = [
    {
      icon: 'users',
      title: '22 pilatesleden kwamen nog nooit in de kliniek',
      body: 'Een gratis adviesgesprek na hun tiende les zet gemiddeld één op de vijf om in een behandeling.',
      action: 'Stuur uitnodiging',
    },
    {
      icon: 'bag',
      title: `${productName(aftercare)} loopt hard`,
      body: `Na microneedling en laser koopt 41% de aanbevolen nazorg. Nog ${aftercareLeft} op voorraad.`,
      action: 'Bestel bij',
    },
    {
      icon: 'mail',
      title: '38 cliënten zijn toe aan een vervolgbehandeling',
      body: 'Hun laatste injectiebehandeling was drie tot vier maanden geleden. Nodig ze uit voor een controle bij hun eigen arts.',
      action: 'Plan controles',
    },
    {
      icon: 'trend',
      title: busiest ? `Extra ${busiest.name} rond ${clock(new Date(busiest.start.getTime() - 3600000))}?` : 'Extra Slow Burn rond 17:00?',
      body: `${busiest ? `${busiest.name} om ${clock(busiest.start)}` : 'Slow Burn om 18:00'} zat de afgelopen vier weken negen keer vol. Een extra les levert naar schatting ${eur(1150)} per maand op.`,
      action: 'Plan extra les',
    },
  ];

  return (
    <div className="dash">
      <KpiTile
        index={0}
        label="Omzet vandaag"
        value={revenue}
        format={eur}
        delta={revenue / usual - 1}
        sub={`tegen de vorige vier ${weekdayLong(now)}en`}
        chart={<Sparkline values={[...history.slice(0, -1), revenue]} />}
      />
      <KpiTile
        index={1}
        label="Behandelingen"
        value={appts.length}
        format={num}
        sub={isClinicDay ? `${running} nu in behandeling` : 'zondag gesloten, dit is maandag'}
        chart={<MiniBars values={apptsPerHour} current={isClinicDay ? now.getHours() - 9 : -1} />}
      />
      <KpiTile
        index={2}
        label="Pilates"
        value={booked / capacity}
        format={pct}
        sub={`${booked} van ${capacity} plekken · ${fullClasses} vol`}
        chart={<Squares total={classes.length} filled={fullClasses} size={10} />}
      />
      <KpiTile
        index={3}
        label="Webshop"
        value={todaysOrders.length}
        format={num}
        sub={`${eur(shopToday)} · gem. ${eur(todaysOrders.length ? shopToday / todaysOrders.length : 0)}`}
        chart={<MiniBars values={ordersPerHour} current={now.getHours() - 7} />}
      />

      <SkylineView appts={appts} day={clinicsDay} now={now} focus={focus} onFocus={setFocus} />
      <LiveFeed items={feed} now={now} />
      <StudioView
        classes={classes}
        selected={selected}
        now={now}
        follow={selectedClass === null}
        onSelect={(id) => setSelectedClass(id)}
        onFollow={() => setSelectedClass(null)}
      />
      <ShopCard orders={orders} now={now} />
      <WeekChart days={week} series={SERIES} today={now} format={eur} />
      <Insights items={insights} />
    </div>
  );
}
