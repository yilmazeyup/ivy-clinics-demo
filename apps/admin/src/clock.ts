import { useEffect, useState } from 'react';

import { hourOf } from './data/format';

const DAY_START = 7;
const DAY_END = 22;
/** Two and a half minutes of demo time every eighth of a second: a full day in about 45 seconds. */
const STEP_MS = 150_000;
const TICK_MS = 125;

/**
 * A link such as …/beheer/?at=2026-10-28T14:20 (seconds optional) starts the clock at that moment, in local time, and lets it run on from
 * there; handy to show a busy afternoon in the evening. Without it the panel follows the real clock.
 */
function startOffset(): number {
  const at = new URLSearchParams(window.location.search).get('at');
  if (!at || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(at)) return 0;
  const moment = new Date(at).getTime();
  return Number.isNaN(moment) ? 0 : moment - Date.now();
}

const OFFSET = startOffset();
const current = () => new Date(Date.now() + OFFSET);

/** Real time by default; "play the day" runs today's clock fast from 07:00 to 22:00. */
export function useDemoClock() {
  const [now, setNow] = useState(current);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) {
      setNow(current());
      const id = window.setInterval(() => setNow(current()), 15_000);
      return () => window.clearInterval(id);
    }
    const id = window.setInterval(() => setNow((prev) => new Date(prev.getTime() + STEP_MS)), TICK_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (playing && now.getHours() >= DAY_END) setPlaying(false);
  }, [playing, now]);

  const play = () => {
    const start = current();
    start.setHours(DAY_START, 0, 0, 0);
    setNow(start);
    setPlaying(true);
  };

  const progress = playing ? Math.min(1, Math.max(0, (hourOf(now) - DAY_START) / (DAY_END - DAY_START))) : 0;
  return { now, playing, progress, play, stop: () => setPlaying(false) };
}
