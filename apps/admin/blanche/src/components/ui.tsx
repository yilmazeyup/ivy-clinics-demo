import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { Icon } from './Icon';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Counts from the previous value to the new one, so changing numbers feel alive. */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(() => value * 0.85);
  const from = useRef(value * 0.85);
  useEffect(() => {
    const begin = from.current;
    const start = performance.now();
    const duration = reduced() ? 1 : 1000;
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

/** A smooth line through the values, with a soft fill under it. */
export function Wave({ values, color }: { values: number[]; color: string }) {
  const w = 132;
  const h = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => [(i * w) / (values.length - 1), h - 5 - ((v - min) / (max - min || 1)) * (h - 10)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg className="wave" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} opacity={0.14} />
      <path d={d} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" pathLength={1} className="wave-line" />
      <rect x={lx - 4} y={ly - 4} width={8} height={8} rx={3} fill={color} />
    </svg>
  );
}

/** Pill-shaped bars per hour; the current hour is solid, hours to come are faint. */
export function Pills({ values, current, color }: { values: number[]; current: number; color: string }) {
  const w = 132;
  const h = 40;
  const max = Math.max(...values, 1);
  const step = w / values.length;
  return (
    <svg className="pills" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {values.map((v, i) => {
        const bh = Math.max(5, (v / max) * (h - 2));
        return <rect key={i} x={i * step + 1.5} y={h - bh} width={step - 3} height={bh} rx={(step - 3) / 2} fill={color} opacity={i === current ? 1 : i < current ? 0.55 : 0.18} />;
      })}
    </svg>
  );
}

/** One tall pill per station: filled while someone is in the chair. */
export function Seats({ total, busy, color }: { total: number; busy: number; color: string }) {
  return (
    <svg className="pills" width={total * 22} height={40} viewBox={`0 0 ${total * 22} 40`} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <rect key={i} x={i * 22 + 2} y={4} width={16} height={34} rx={8} fill={color} opacity={i < busy ? 1 : 0.2} />
      ))}
    </svg>
  );
}

const ToastContext = createContext<(message: string) => void>(() => {});

/** Short confirmations drop in from the top as an ink pill. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setMessage(text);
    setKey((k) => k + 1);
    timer.current = window.setTimeout(() => setMessage(null), 3200);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-host" aria-live="polite">
        {message ? (
          <div key={key} className="toast">
            <Icon name="sparkle" size={17} />
            {message}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/** A section heading: big serif title, a line under it and room for actions on the side. */
export function Head({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="head">
      <div>
        <h2>{title}</h2>
        {sub ? <p>{sub}</p> : null}
      </div>
      {children ? <div className="head-side">{children}</div> : null}
    </header>
  );
}
