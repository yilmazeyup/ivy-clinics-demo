import { addDays, dateKey, LOCALE_NAMES, LOCALES, sameDay, type Locale } from '@pure-clinics/shared';
import { SHADES, studioHours } from '@pure-clinics/shared/src/blanche';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { useDemoClock } from '../../src/clock';
import { Agenda } from './components/Agenda';
import { Feed, type ActionItem, type FeedEntry } from './components/Feed';
import { Icon } from './components/Icon';
import { Refills, Sales, Shop, Social } from './components/Panels';
import { StudioView } from './components/Studio';
import { CountUp, Pills, Seats, ToastProvider, useToast, Wave } from './components/ui';
import { occupancy, phaseOf, revenueOf, studioDay, studioViewDay } from './data/day';
import { diaryAt, happenedBy, liveDay, paidBy, revenueAt, weekSales } from './data/live';
import { orderTotal, ordersUntil, shopDay } from './data/shop';
import { Accent, I18nProvider, useI18n, useSetLocale } from './i18n';

/** Where the member app lives on the demo site, next to this panel. */
const APP_URL = '../';

let actionId = 0;

function Kpi({ label, value, sub, tone, chart, delta }: { label: string; value: ReactNode; sub: string; tone: string; chart: ReactNode; delta?: number }) {
  return (
    <div className={`kpi tone-${tone}`}>
      <span className="kpi-label">{label}</span>
      <b className="kpi-value">{value}</b>
      <div className="kpi-foot">
        <span>
          {delta !== undefined ? (
            <em className={delta >= 0 ? 'up' : 'down'}>
              <Icon name={delta >= 0 ? 'up' : 'down'} size={13} stroke={2.4} /> {Math.round(Math.abs(delta) * 100)}%
            </em>
          ) : null}
          {sub}
        </span>
        {chart}
      </div>
    </div>
  );
}

function Panel() {
  const i18n = useI18n();
  const { t, tn, eur, num, pct, locale, weekday, dayLong, clock } = i18n;
  const setLocale = useSetLocale();
  const toast = useToast();
  const demo = useDemoClock();
  const now = demo.now;
  const dayKey = dateKey(now);
  const viewDay = studioViewDay(now);
  const today = sameDay(viewDay, now);
  const live = useMemo(() => liveDay(viewDay, now), [dayKey]);
  const happened = useMemo(() => happenedBy(live.events, now), [live, now]);
  const appts = useMemo(() => (today ? diaryAt(live.appts, now) : live.appts), [live, now, today]);
  const orders = useMemo(() => ordersUntil(live.orders, now), [live, now]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [actions, setActions] = useState<ActionItem[]>([]);
  useEffect(() => {
    setSent(new Set());
    setActions([]);
  }, [dayKey]);

  const booked = useMemo(() => new Set(happened.flatMap((e) => (e.kind === 'refill' ? [e.client.id] : []))), [happened]);
  const remind = (ids: string[]) => {
    const fresh = ids.filter((id) => !sent.has(id) && !booked.has(id));
    if (!fresh.length) return;
    setSent((s) => new Set([...s, ...fresh]));
    setActions((a) => [{ id: `action-${++actionId}`, at: now, kind: 'reminders', n: fresh.length }, ...a]);
    toast(t('refills.toast', { n: fresh.length }));
  };

  const feed: FeedEntry[] = useMemo(
    () => [...happened, ...actions.filter((a) => a.at.getTime() <= now.getTime())].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 50),
    [happened, actions, now],
  );

  // Revenue so far against the same weekday over the last four weeks, at this time of day.
  const paid = today ? revenueOf(paidBy(appts, now)) : 0;
  const shopToday = orderTotal(orders);
  const revenue = paid + shopToday;
  const past = useMemo(() => [7, 14, 21, 28].map((d) => ({ appts: studioDay(addDays(now, -d)), orders: shopDay(addDays(now, -d)) })), [dayKey]);
  const usual = past.reduce((s, p) => s + revenueAt(p.appts, p.orders, now), 0) / past.length;
  const history = useMemo(() => Array.from({ length: 12 }, (_, i) => revenueOf(studioDay(addDays(now, i - 12))) + orderTotal(shopDay(addDays(now, i - 12)))), [dayKey]);
  const week = useMemo(() => weekSales(now, live, now), [live, now]);
  const running = today ? appts.filter((a) => phaseOf(a, now) === 'now').length : 0;
  const hours = studioHours(viewDay);
  const perHour = Array.from({ length: 13 }, (_, i) => appts.filter((a) => a.start.getHours() === 9 + i).length);
  const ordersPerHour = Array.from({ length: 16 }, (_, i) => orders.filter((o) => o.at.getHours() === 8 + i).length);
  const viaApp = happened.filter((e) => e.kind === 'booking').length;
  const tags = happened.filter((e) => e.kind === 'tag').length;

  const nav = ['studio', 'agenda', 'refills', 'sales', 'shop', 'social'] as const;

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <span className="script">Blanche</span>
          <span className="beauty">BEAUTY</span>
          <span className="brand-chip">{t('top.studio')}</span>
        </div>
        <div className="clock">
          <span className="clock-time">{clock(now)}</span>
          <span className="clock-day">{dayLong(now)}</span>
          {demo.playing ? (
            <button className="btn btn-ink btn-sm" onClick={demo.stop}>
              <Icon name="stop" size={14} /> {t('top.stop')}
              <i className="play-bar">
                <i style={{ width: `${demo.progress * 100}%` }} />
              </i>
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={demo.play}>
              <Icon name="play" size={14} /> {t('top.play')}
            </button>
          )}
        </div>
        <div className="top-side">
          <span className="chip chip-demo">{t('top.demo')}</span>
          <label className="lang">
            <Icon name="globe" size={17} />
            <select value={locale} aria-label={t('top.language')} onChange={(e) => setLocale(e.target.value as Locale)}>
              {LOCALES.map((code) => (
                <option key={code} value={code}>
                  {LOCALE_NAMES[code]}
                </option>
              ))}
            </select>
          </label>
          <a className="btn btn-soft btn-sm" href={APP_URL} target="_blank" rel="noopener">
            {t('top.app')} <Icon name="arrow" size={14} />
          </a>
        </div>
      </header>

      <nav className="tabs" aria-label={t('nav.label')}>
        <button className="tab is-on" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          {t('nav.today')}
        </button>
        {nav.map((id) => (
          <button key={id} className="tab" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            {t(`nav.${id}`)}
          </button>
        ))}
      </nav>

      <section className="hello">
        <h1>
          <Accent text={i18n.greeting(now)} />
        </h1>
        <p>{t('top.sub')}</p>
      </section>

      <div className="kpis">
        <Kpi
          tone="cherry"
          label={t('kpi.revenue')}
          value={<CountUp value={revenue} format={eur} />}
          sub={t('kpi.revenueSub', { weekday: weekday(now) })}
          delta={usual > 0 ? revenue / usual - 1 : undefined}
          chart={<Wave values={[...history, revenue]} color={SHADES.cherry.ink} />}
        />
        <Kpi
          tone="lilac"
          label={t('kpi.appts')}
          value={<CountUp value={appts.length} format={num} />}
          sub={hours ? t('kpi.apptsSub', { n: running }) : t('kpi.closed')}
          chart={<Pills values={perHour} current={today ? now.getHours() - 9 : -1} color={SHADES.lilac.ink} />}
        />
        <Kpi
          tone="honey"
          label={t('kpi.occupancy')}
          value={<CountUp value={occupancy(appts, viewDay)} format={pct} />}
          sub={t('kpi.occupancySub', { n: viaApp })}
          chart={<Seats total={3} busy={running} color={SHADES.honey.ink} />}
        />
        <Kpi
          tone="mint"
          label={t('kpi.shop')}
          value={<CountUp value={shopToday} format={eur} />}
          sub={t('kpi.shopSub', { orders: tn('shop.orders', orders.length), revenue: eur(orders.length ? shopToday / orders.length : 0) })}
          chart={<Pills values={ordersPerHour} current={now.getHours() - 8} color="#14876A" />}
        />
      </div>

      <div className="grid-studio">
        <StudioView key={`studio-${locale}`} appts={appts} day={viewDay} now={now} today={today} events={happened} fast={demo.playing} />
        <Feed items={feed} />
      </div>
      <Agenda appts={appts} day={viewDay} now={now} today={today} />
      <div className="grid-two">
        <Refills due={live.due} sent={sent} booked={booked} onRemind={remind} />
        <Sales week={week} now={now} />
      </div>
      <div className="grid-two">
        <Shop orders={orders} day={now} />
        <Social tags={tags} />
      </div>
      <footer className="foot">{t('footer.demo')}</footer>
    </div>
  );
}

export function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <Panel />
      </ToastProvider>
    </I18nProvider>
  );
}
