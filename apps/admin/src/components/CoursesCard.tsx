import { LOCATIONS } from '@pure-clinics/shared';
import type { CSSProperties } from 'react';

import { byUrgency, courseState, type Course } from '../data/courses';
import { Accent, useI18n } from '../i18n';
import { Icon } from './Icon';
import { CardHead } from './ui';

const SHOWN = 8;

/**
 * Laser, acne and pigment treatments come in series. This card lists the clients partway through one,
 * the most urgent first, so nobody drops out of sight; a reminder goes out in one click.
 */
export function CoursesCard({ courses, now, onRemind }: { courses: Course[]; now: Date; onRemind: (ids: string[]) => void }) {
  const { t, tn, text } = useI18n();
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

  return (
    <section id="trajecten" className="card courses-card rise" style={{ '--d': '380ms' } as CSSProperties}>
      <CardHead eyebrow={t('courses.eyebrow')} title={<Accent text={tn('courses.title', courses.length)} />}>
        <span className={`phase ${due ? 'phase--live' : ''}`}>{t('courses.dueCount', { n: due })}</span>
      </CardHead>
      <p className="help">{t('courses.help')}</p>

      <ol className="courses">
        {sorted.slice(0, SHOWN).map((c) => {
          const state = courseState(c, now);
          const city = LOCATIONS.find((l) => l.id === c.clinic)?.city ?? '';
          return (
            <li key={c.id} className={`course course--${state}`}>
              <span className="course-who">
                <strong>{c.client}</strong>
                <span>
                  {text(c.treatment.name)} · {city}
                </span>
              </span>
              <span className="course-progress" role="img" aria-label={t('courses.progress', { done: c.done, total: c.total })}>
                <span className="course-steps">
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
