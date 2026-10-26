import { useEffect, useState } from 'react';

import { hourOf } from './data/format';

const DAY_START = 7;
const DAY_END = 22;
/** Two and a half minutes of demo time every eighth of a second: a full day in about 45 seconds. */
const STEP_MS = 150_000;
const TICK_MS = 125;

/** Real time by default; "play the day" runs today's clock fast from 07:00 to 22:00. */
export function useDemoClock() {
  const [now, setNow] = useState(() => new Date());
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) {
      setNow(new Date());
      const id = window.setInterval(() => setNow(new Date()), 15_000);
      return () => window.clearInterval(id);
    }
    const id = window.setInterval(() => setNow((prev) => new Date(prev.getTime() + STEP_MS)), TICK_MS);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (playing && now.getHours() >= DAY_END) setPlaying(false);
  }, [playing, now]);

  const play = () => {
    const start = new Date();
    start.setHours(DAY_START, 0, 0, 0);
    setNow(start);
    setPlaying(true);
  };

  const progress = playing ? Math.min(1, Math.max(0, (hourOf(now) - DAY_START) / (DAY_END - DAY_START))) : 0;
  return { now, playing, progress, play, stop: () => setPlaying(false) };
}
