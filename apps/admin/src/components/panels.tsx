import { useState, type CSSProperties } from 'react';

import { useI18n, type MessageKey } from '../i18n';
import { Icon, type IconName } from './Icon';
import { CardHead, useToast, type FeedItem } from './ui';

const SOURCE_KEY: Record<FeedItem['source'], MessageKey> = {
  clinic: 'source.clinic',
  blanche: 'source.blanche',
  webshop: 'source.webshop',
};

export function LiveFeed({ items, now }: { items: FeedItem[]; now: Date }) {
  const { t, line, eur, ago } = useI18n();
  return (
    <section id="live" className="card feed-card rise" style={{ '--d': '340ms' } as CSSProperties}>
      <CardHead eyebrow={t('feed.eyebrow')} title={t('feed.title')}>
        <span className="live-chip small">
          <i className="live-dot" />
          {t('feed.count', { n: items.length })}
        </span>
      </CardHead>
      <p className="help">{t('feed.help')}</p>
      <ol className="feed">
        {items.slice(0, 9).map((item) => (
          <li key={item.id} className="feed-item">
            <span className={`feed-icon ${item.accent ? 'accent' : item.source}`}>
              <Icon name={item.icon} size={17} />
            </span>
            <span className="feed-text">
              <strong>{line(item.title)}</strong>
              <span>{line(item.detail)}</span>
            </span>
            <span className="feed-meta">
              {item.amount !== undefined ? <b>{eur(item.amount)}</b> : null}
              <span>{ago(item.at, now)}</span>
              <span className="feed-source">{t(SOURCE_KEY[item.source])}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export type Series = { label: MessageKey; color: string };
export type WeekDay = { date: Date; parts: number[] };

/** This week's revenue per day, stacked by business line; days still to come are faded. */
export function WeekChart({ days, series, today }: { days: WeekDay[]; series: Series[]; today: Date }) {
  const { t, eur, weekdayShort } = useI18n();
  const totals = days.map((d) => d.parts.reduce((a, b) => a + b, 0));
  const max = Math.max(...totals, 1);
  const todayKey = today.toDateString();
  return (
    <section className="card week-card rise" style={{ '--d': '520ms' } as CSSProperties}>
      <CardHead eyebrow={t('week.eyebrow')} title={eur(totals.reduce((a, b) => a + b, 0))}>
        <span className="week-legend">
          {series.map((s) => (
            <span key={s.label}>
              <i style={{ background: s.color }} /> {t(s.label)}
            </span>
          ))}
        </span>
      </CardHead>
      <p className="help">{t('week.help')}</p>
      <div className="week">
        {days.map((day, index) => {
          const isToday = day.date.toDateString() === todayKey;
          const future = day.date.getTime() > today.getTime() && !isToday;
          return (
            <div key={day.date.toDateString()} className={`week-col ${isToday ? 'today' : ''} ${future ? 'future' : ''}`}>
              <span className="week-value">{totals[index] > 0 ? eur(totals[index]) : t('week.closed')}</span>
              <span className="week-track">
                <span className="week-stack" style={{ height: `${(totals[index] / max) * 100}%`, animationDelay: `${560 + index * 60}ms` }}>
                  {day.parts.map((part, i) =>
                    part > 0 ? <span key={series[i].label} style={{ flexGrow: part, background: series[i].color }} /> : null,
                  )}
                </span>
              </span>
              <span className="week-day">{weekdayShort(day.date)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** `run` does the action for real in the demo, where it can; otherwise the button only confirms. */
export type Insight = { id: string; icon: IconName; title: string; body: string; action: string; run?: () => void };

/** Suggestions an AI assistant would make from the bookings; in the demo they are written from the test data. */
export function Insights({ items }: { items: Insight[] }) {
  const { t } = useI18n();
  const toast = useToast();
  const [done, setDone] = useState<string[]>([]);
  return (
    <section className="card insights-card rise" style={{ '--d': '600ms' } as CSSProperties}>
      <CardHead eyebrow={t('tips.eyebrow')} title={t('tips.title')} />
      <p className="help">{t('tips.help')}</p>
      <ul className="insights">
        {items.map((item) => {
          const isDone = done.includes(item.id);
          return (
            <li key={item.id} className="insight">
              <span className="feed-icon">
                <Icon name={item.icon} size={17} />
              </span>
              <span className="insight-text">
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </span>
              <button
                className={`btn ${isDone ? 'btn-done' : 'btn-ghost'}`}
                onClick={() => {
                  if (isDone) return;
                  setDone((d) => [...d, item.id]);
                  if (item.run) item.run();
                  else toast(t('tips.toast'));
                }}
              >
                {isDone ? <Icon name="check" size={16} /> : null}
                {isDone ? t('tips.done') : item.action}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
