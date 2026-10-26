import { LOCATIONS } from '@pure-clinics/shared';
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';

import { byUrgency, courseState, type Course } from '../data/courses';
import { Accent, useI18n } from '../i18n';
import { CourseTiles, TILE, TILE_GAP, type TileRow } from '../three/courses';
import { Icon } from './Icon';
import { CardHead } from './ui';

const SHOWN = 8;

/**
 * Laser, acne and pigment treatments come in series. This card lists the clients partway through one,
 * the most urgent first, so nobody drops out of sight; a reminder goes out in one click.
 */
export function CoursesCard({ courses, now, onRemind }: { courses: Course[]; now: Date; onRemind: (ids: string[]) => void }) {
  const { t, tn, text, rtl } = useI18n();
  const wrap = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const tiles = useRef<CourseTiles | null>(null);
  const measure = useRef<() => void>(() => {});
  const sorted = [...courses].sort(byUrgency(now));
  const waiting = sorted.filter((c) => {
    const state = courseState(c, now);
    return (state === 'due' || state === 'late') && !c.reminded;
  });
  const due = sorted.filter((c) => ['due', 'late'].includes(courseState(c, now))).length;

  const status = (c: Course) => {
    const state = courseState(c, now);
    if (state === 'planned' && c.planned) return t('courses.planned', { day: { date: c.planned }, time: c.planned });
    if (state === 'late') return t('courses.late', { n: Math.max(1, Math.round((now.getTime() - c.due.getTime()) / (7 * 86400000))) });
    if (state === 'due') return t('courses.due', { n: c.done + 1 });
    return t('courses.onTrack', { day: { date: c.due } });
  };

  const shown = sorted.slice(0, SHOWN);

  // The session tiles are drawn in 3D over the list: each row of tiles goes where its row's progress cell is.
  measure.current = () => {
    const host = overlay.current;
    const list = wrap.current;
    if (!host || !list || !tiles.current) return;
    const base = host.getBoundingClientRect();
    const rows: TileRow[] = [];
    for (const c of shown) {
      const cell = list.querySelector<HTMLElement>(`[data-course="${c.id}"] .course-steps`);
      if (!cell) continue;
      const r = cell.getBoundingClientRect();
      rows.push({
        id: c.id,
        x: (rtl ? r.right : r.left) - base.left,
        y: r.top + r.height / 2 - base.top,
        total: c.total,
        done: c.done,
        state: courseState(c, now),
        reminded: Boolean(c.reminded),
      });
    }
    tiles.current.update(rows, rtl);
  };

  useEffect(() => {
    tiles.current = new CourseTiles(overlay.current!);
    wrap.current!.classList.add('is-3d');
    const observer = new ResizeObserver(() => measure.current());
    observer.observe(wrap.current!);
    document.fonts?.ready.then(() => measure.current());
    return () => {
      observer.disconnect();
      tiles.current?.dispose();
      tiles.current = null;
    };
  }, []);

  useLayoutEffect(() => measure.current());

  return (
    <section id="trajecten" className="card courses-card rise" style={{ '--d': '380ms' } as CSSProperties}>
      <CardHead eyebrow={t('courses.eyebrow')} title={<Accent text={tn('courses.title', courses.length)} />}>
        <span className={`phase ${due ? 'phase--live' : ''}`}>{t('courses.dueCount', { n: due })}</span>
      </CardHead>
      <p className="help">{t('courses.help')}</p>

      <div ref={wrap} className="courses-wrap">
      <ol className="courses">
        {shown.map((c) => {
          const state = courseState(c, now);
          const city = LOCATIONS.find((l) => l.id === c.clinic)?.city ?? '';
          return (
            <li key={c.id} className={`course course--${state}`} data-course={c.id}>
              <span className="course-who">
                <strong>{c.client}</strong>
                <span>
                  {text(c.treatment.name)} · {city}
                </span>
              </span>
              <span className="course-progress" role="img" aria-label={t('courses.progress', { done: c.done, total: c.total })}>
                {/* The squares keep the room; the 3D tiles over the list show the sessions. */}
                <span className="course-steps" style={{ '--tile': `${TILE}px`, '--tile-gap': `${TILE_GAP}px` } as CSSProperties}>
                  {Array.from({ length: c.total }, (_, i) => (
                    <i key={i} className={i < c.done ? 'on' : ''} />
                  ))}
                </span>
                <small>
                  {c.done}/{c.total}
                </small>
              </span>
              <span className="course-state">{status(c)}</span>
              <span className="course-action">
                {state === 'due' || state === 'late' ? (
                  c.reminded ? (
                    <span className="course-sent">
                      <Icon name="check" size={14} /> {t('courses.sent')}
                    </span>
                  ) : (
                    <button className="btn btn-ghost btn-small" onClick={() => onRemind([c.id])}>
                      {t('courses.remind')}
                    </button>
                  )
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
      <div ref={overlay} className="course-tiles" aria-hidden="true" />
      </div>

      <div className="courses-foot">
        <span>{t('courses.more', { n: Math.max(0, courses.length - SHOWN) })}</span>
        <button className="btn btn-primary" disabled={!waiting.length} onClick={() => onRemind(waiting.map((c) => c.id))}>
          <Icon name="mail" size={16} />
          {waiting.length ? t('courses.remindAll', { n: waiting.length }) : t('courses.allSent')}
        </button>
      </div>
    </section>
  );
}
