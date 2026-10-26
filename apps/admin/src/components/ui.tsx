import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';

import type { Line } from '../i18n';
import { Icon, type IconName } from './Icon';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Counts from the previous value to the new one, so changing numbers feel alive. */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  // Start close to the real figure, so the first frame never shows a misleading zero.
  const [shown, setShown] = useState(() => value * 0.88);
  const from = useRef(value * 0.88);
  useEffect(() => {
    const begin = from.current;
    const start = performance.now();
    const duration = reduced() ? 1 : 1100;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const v = begin + (value - begin) * (1 - Math.pow(1 - t, 3));
      from.current = v;
      setShown(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format(shown)}</>;
}

export function Sparkline({ values }: { values: number[] }) {
  const w = 112;
  const h = 34;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((v, i) => [(i * w) / (values.length - 1), h - 4 - ((v - min) / (max - min || 1)) * (h - 8)]);
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [lx, ly] = points[points.length - 1];
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path className="spark-area" d={`${line} L${w} ${h} L0 ${h} Z`} />
      <path className="spark-line" d={line} pathLength={1} />
      <rect className="spark-dot" x={lx - 3.5} y={ly - 3.5} width={7} height={7} rx={1.5} />
    </svg>
  );
}

/** Small bars per hour; the current hour stands out, hours to come are lighter. */
export function MiniBars({ values, current }: { values: number[]; current: number }) {
  const w = 112;
  const h = 34;
  const max = Math.max(...values, 1);
  const step = w / values.length;
  return (
    <svg className="minibars" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {values.map((v, i) => {
        const bh = Math.max(2, (v / max) * (h - 2));
        return (
          <rect
            key={i}
            className={i === current ? 'now' : i > current ? 'later' : ''}
            x={i * step + 1}
            y={h - bh}
            width={step - 2.5}
            height={bh}
            rx={1.5}
            style={{ animationDelay: `${300 + i * 40}ms` }}
          />
        );
      })}
    </svg>
  );
}

/** A row of small squares, e.g. eight reformers or six classes. */
export function Squares({ total, filled, size = 9 }: { total: number; filled: number; size?: number }) {
  return (
    <span className="squares" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < filled ? 'on' : ''} style={{ width: size, height: size }} />
      ))}
    </span>
  );
}

type KpiProps = {
  label: string;
  value: number;
  format: (n: number) => string;
  sub: ReactNode;
  delta?: number;
  chart?: ReactNode;
  index: number;
};

/** A metric tile that tilts slightly toward the pointer. */
export function KpiTile({ label, value, format, sub, delta, chart, index }: KpiProps) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node || reduced()) return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    node.style.setProperty('--rx', `${(-py * 7).toFixed(2)}deg`);
    node.style.setProperty('--ry', `${(px * 9).toFixed(2)}deg`);
  };
  const leave = () => {
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  };
  return (
    <div ref={ref} className="card kpi rise" style={{ '--d': `${80 + index * 70}ms` } as CSSProperties} onPointerMove={move} onPointerLeave={leave}>
      <div className="kpi-top">
        <span className="eyebrow">{label}</span>
        {delta !== undefined ? (
          <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
            <Icon name={delta >= 0 ? 'up' : 'down'} size={12} stroke={2.2} />
            {Math.abs(Math.round(delta * 100))}%
          </span>
        ) : null}
      </div>
      <div className="kpi-value">
        <CountUp value={value} format={format} />
      </div>
      <div className="kpi-bottom">
        <span className="kpi-sub">{sub}</span>
        {chart}
      </div>
    </div>
  );
}

export function CardHead({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="card-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="card-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/** One line in the live feed. Its words are kept as message keys, so it follows the chosen language. */
export type FeedItem = {
  id: string;
  at: Date;
  source: 'clinic' | 'pilates' | 'webshop';
  icon: IconName;
  title: Line;
  detail: Line;
  amount?: number;
  accent?: boolean;
};

const ToastContext = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number>(0);
  const show = (text: string) => {
    window.clearTimeout(timer.current);
    setMessage(text);
    timer.current = window.setTimeout(() => setMessage(null), 2800);
  };
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast ${message ? 'show' : ''}`} role="status" aria-live="polite">
        {message}
      </div>
    </ToastContext.Provider>
  );
}
