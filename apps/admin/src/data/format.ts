const euro = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('nl-NL');
const longDay = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDay = new Intl.DateTimeFormat('nl-NL', { weekday: 'short' });
const weekday = new Intl.DateTimeFormat('nl-NL', { weekday: 'long' });

export const eur = (amount: number) => euro.format(Math.round(amount));
export const num = (value: number) => integer.format(Math.round(value));
export const pct = (value: number) => `${Math.round(value * 100)}%`;
export const dayLong = (date: Date) => longDay.format(date);
export const weekdayShort = (date: Date) => shortDay.format(date).replace('.', '');
/** "maandag"; Dutch weekdays all take -en in the plural. */
export const weekdayLong = (date: Date) => weekday.format(date);

export function clock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function hourOf(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

export function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

/** "nu", "3 min", "1 uur" — how long ago a feed item happened. */
export function ago(then: Date, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - then.getTime()) / 60000));
  if (minutes < 1) return 'nu';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.round(minutes / 60)} uur`;
}
