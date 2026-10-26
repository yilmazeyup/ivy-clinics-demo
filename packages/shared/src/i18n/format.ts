import type { Locale } from './locales';

type Calendar = {
  /** Indexed like Date#getDay(): 0 is Sunday. */
  weekdaysShort: string[];
  weekdaysLong: string[];
  monthsShort: string[];
  monthsLong: string[];
};

// Written out per language instead of Intl, so dates look the same in every JS engine.
const CALENDARS: Record<Locale, Calendar> = {
  nl: {
    weekdaysShort: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
    weekdaysLong: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
    monthsShort: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
    monthsLong: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
  },
  en: {
    weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    weekdaysLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    monthsLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  ar: {
    weekdaysShort: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
    weekdaysLong: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    monthsShort: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    monthsLong: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  },
  fr: {
    weekdaysShort: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
    weekdaysLong: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
    monthsShort: ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'],
    monthsLong: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  },
  de: {
    weekdaysShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    weekdaysLong: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    monthsShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    monthsLong: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  },
  it: {
    weekdaysShort: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
    weekdaysLong: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'],
    monthsShort: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
    monthsLong: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
  },
};

export function weekdayShort(date: Date, locale: Locale): string {
  return CALENDARS[locale].weekdaysShort[date.getDay()];
}

/** "do 29 okt", "Thu 29 Oct", "الخميس 29 أكتوبر", "Do 29. Okt" */
export function formatDayShort(date: Date, locale: Locale): string {
  const c = CALENDARS[locale];
  const d = date.getDate();
  const m = date.getMonth();
  switch (locale) {
    case 'en':
      return `${c.weekdaysShort[date.getDay()]} ${d} ${c.monthsShort[m]}`;
    case 'ar':
      return `${c.weekdaysLong[date.getDay()]} ${d} ${c.monthsLong[m]}`;
    case 'de':
      return `${c.weekdaysShort[date.getDay()]} ${d}. ${c.monthsShort[m]}`;
    default:
      return `${c.weekdaysShort[date.getDay()]} ${d} ${c.monthsShort[m]}`;
  }
}

/** "donderdag 29 oktober", "Thursday 29 October", "Donnerstag, 29. Oktober" */
export function formatDayLong(date: Date, locale: Locale): string {
  const c = CALENDARS[locale];
  const day = c.weekdaysLong[date.getDay()];
  const d = date.getDate();
  const month = c.monthsLong[date.getMonth()];
  if (locale === 'de') return `${day}, ${d}. ${month}`;
  return `${day} ${d} ${month}`;
}

export function monthLong(date: Date, locale: Locale): string {
  return CALENDARS[locale].monthsLong[date.getMonth()];
}

export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** "€ 129" in Dutch, "€129" in English, "129 €" elsewhere; cents only when needed. */
export function formatEuro(amount: number, locale: Locale): string {
  const whole = Number.isInteger(amount);
  const decimalSep = locale === 'en' ? '.' : ',';
  const value = whole ? String(amount) : amount.toFixed(2).replace('.', decimalSep);
  if (locale === 'nl') return `€ ${value}`;
  if (locale === 'en') return `€${value}`;
  return `${value} €`;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Monday of the week that contains `date`. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7;
  return addDays(day, -offset);
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
