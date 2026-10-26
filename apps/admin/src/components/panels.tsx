import { useState, type CSSProperties } from 'react';

import { ago, weekdayShort } from '../data/format';
import { Icon, type IconName } from './Icon';
import { CardHead, useToast, type FeedItem } from './ui';

export function LiveFeed({ items, now }: { items: FeedItem[]; now: Date }) {
  return (
    <section className="card feed-card rise" style={{ '--d': '340ms' } as CSSProperties}>
      <CardHead eyebrow="Live" title="Wat er nu gebeurt">
        <span className="live-chip small">
          <i className="live-dot" />
          {items.length} vandaag
        </span>
      </CardHead>
      <ol className="feed">
        {items.slice(0, 9).map((item) => (
          <li key={item.id} className="feed-item">
            <span className={`feed-icon ${item.accent ? 'accent' : item.source.toLowerCase()}`}>
              <Icon name={item.icon} size={17} />
            </span>
            <span className="feed-text">
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </span>
            <span className="feed-meta">
              {item.amount ? <b>{item.amount}</b> : null}
              <span>{ago(item.at, now)}</span>
              <span className="feed-source">{item.source}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export type Series = { label: string; color: string };
export type WeekDay = { date: Date; parts: number[] };

/** This week's revenue per day, stacked by business line; days still to come are faded. */
export function WeekChart({ days, series, today, format }: { days: WeekDay[]; series: Series[]; today: Date; format: (n: number) => string }) {
  const totals = days.map((d) => d.parts.reduce((a, b) => a + b, 0));
  const max = Math.max(...totals, 1);
  const todayKey = today.toDateString();
  return (
    <section className="card week-card rise" style={{ '--d': '520ms' } as CSSProperties}>
      <CardHead eyebrow="Deze week" title={format(totals.reduce((a, b) => a + b, 0))}>
        <span className="week-legend">
          {series.map((s) => (
            <span key={s.label}>
              <i style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </span>
      </CardHead>
      <div className="week">
        {days.map((day, index) => {
          const isToday = day.date.toDateString() === todayKey;
          const future = day.date.getTime() > today.getTime() && !isToday;
          return (
            <div key={day.date.toDateString()} className={`week-col ${isToday ? 'today' : ''} ${future ? 'future' : ''}`}>
              <span className="week-value">{totals[index] > 0 ? format(totals[index]) : 'dicht'}</span>
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

export type Insight = { icon: IconName; title: string; body: string; action: string };

/** Suggestions an AI assistant would make from the bookings; in the demo they are written from the test data. */
export function Insights({ items }: { items: Insight[] }) {
  const toast = useToast();
  const [done, setDone] = useState<string[]>([]);
  return (
    <section className="card insights-card rise" style={{ '--d': '600ms' } as CSSProperties}>
      <CardHead eyebrow="AI-inzichten" title="Wat opvalt deze week">
        <span className="ai-badge">
          <Icon name="sparkle" size={14} /> Claude
        </span>
      </CardHead>
      <ul className="insights">
        {items.map((item) => {
          const isDone = done.includes(item.title);
          return (
            <li key={item.title} className="insight">
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
                  setDone((d) => [...d, item.title]);
                  toast('Ingepland. In de demo wordt er niets echt verstuurd.');
                }}
              >
                {isDone ? <Icon name="check" size={16} /> : null}
                {isDone ? 'Ingepland' : item.action}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
