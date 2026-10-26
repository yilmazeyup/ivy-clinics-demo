import { LOCALES, productById, treatmentById, type L10n, type Locale, type ProductId, type TreatmentId } from '@pure-clinics/shared';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ar } from './ar';
import { de } from './de';
import { en } from './en';
import { fr } from './fr';
import { it } from './it';
import { nl, type MessageKey, type Messages } from './nl';

export type { MessageKey };

const MESSAGES: Record<Locale, Messages> = { nl, en, ar, fr, de, it };

/** Number and date formats per language; Arabic keeps Western digits, like the member app. */
const INTL: Record<Locale, string> = { nl: 'nl-NL', en: 'en-GB', ar: 'ar-u-nu-latn', fr: 'fr-FR', de: 'de-DE', it: 'it-IT' };

/** A value in a translated sentence; dates, treatments and products are localized when shown. */
export type Arg =
  | string
  | number
  | Date
  | { treatment: TreatmentId }
  | { msg: MessageKey }
  | { product: ProductId; extra?: number }
  /** A day without the time, e.g. "di 3 nov". */
  | { date: Date };
export type Line = { key: MessageKey; args?: Record<string, Arg> };

type PluralBase = 'shop.title' | 'shop.note' | 'courses.title' | 'clinics.busy';

const pad = (n: number) => String(n).padStart(2, '0');

function makeI18n(locale: Locale) {
  const intl = INTL[locale];
  const euro = new Intl.NumberFormat(intl, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const integer = new Intl.NumberFormat(intl);
  const percent = new Intl.NumberFormat(intl, { style: 'percent', maximumFractionDigits: 0 });
  const longDay = new Intl.DateTimeFormat(intl, { weekday: 'long', day: 'numeric', month: 'long' });
  const shortDay = new Intl.DateTimeFormat(intl, { weekday: 'short' });
  const weekday = new Intl.DateTimeFormat(intl, { weekday: 'long' });
  const shortDate = new Intl.DateTimeFormat(intl, { weekday: 'short', day: 'numeric', month: 'short' });
  const dateShort = (date: Date) => shortDate.format(date).replace(/\./g, '');
  const monthAndYear = new Intl.DateTimeFormat(intl, { month: 'long', year: 'numeric' });
  const dayAndMonth = new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'short' });
  const dayMonthAndYear = new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'short', year: 'numeric' });
  const clock = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  const resolve = (arg: Arg): string => {
    if (arg instanceof Date) return clock(arg);
    if (typeof arg === 'object' && 'treatment' in arg) return treatmentById(arg.treatment).name[locale];
    if (typeof arg === 'object' && 'msg' in arg) return MESSAGES[locale][arg.msg];
    if (typeof arg === 'object' && 'date' in arg) return dateShort(arg.date);
    if (typeof arg === 'object' && 'product' in arg) {
      const product = productById(arg.product);
      const name = product ? (product.brand ? `${product.brand} ${product.name[locale]}` : product.name[locale]) : '';
      return arg.extra ? `${name} +${arg.extra}` : name;
    }
    return String(arg);
  };

  const t = (key: MessageKey, args?: Record<string, Arg>) =>
    (MESSAGES[locale][key] ?? nl[key]).replace(/\{(\w+)\}/g, (match, name: string) => (args && args[name] !== undefined ? resolve(args[name]) : match));

  return {
    locale,
    rtl: locale === 'ar',
    t,
    /** Picks the .one or .other form and fills in {n}. */
    tn: (base: PluralBase, n: number, args?: Record<string, Arg>) => t(`${base}.${n === 1 ? 'one' : 'other'}` as MessageKey, { n, ...args }),
    line: (line: Line) => t(line.key, line.args),
    text: (value: L10n) => value[locale],
    eur: (amount: number) => euro.format(Math.round(amount)),
    num: (value: number) => integer.format(Math.round(value)),
    pct: (value: number) => percent.format(value),
    dayLong: (date: Date) => longDay.format(date),
    dateShort,
    /** "maart 2024": since when someone is a client. */
    monthYear: (date: Date) => monthAndYear.format(date),
    /** "23 sep", with the year when it is not the year of `now`: "12 nov 2025". */
    dayMonth: (date: Date, now: Date) =>
      (date.getFullYear() === now.getFullYear() ? dayAndMonth : dayMonthAndYear).format(date).replace(/\./g, ''),
    weekdayShort: (date: Date) => shortDay.format(date).replace('.', ''),
    /** "maandag", "Monday", "الاثنين": the sentences that use it are written to fit every weekday. */
    weekdayLong: (date: Date) => weekday.format(date),
    clock,
    ago: (then: Date, now: Date) => {
      const minutes = Math.max(0, Math.round((now.getTime() - then.getTime()) / 60000));
      if (minutes < 1) return t('ago.now');
      if (minutes < 60) return t('ago.min', { n: minutes });
      return t('ago.hour', { n: Math.round(minutes / 60) });
    },
    greeting: (date: Date) => {
      const h = date.getHours();
      return t('greet.line', { greeting: t(h < 12 ? 'greet.morning' : h < 18 ? 'greet.afternoon' : 'greet.evening') });
    },
  };
}

export type I18n = ReturnType<typeof makeI18n>;

const isLocale = (value: string | null): value is Locale => value !== null && (LOCALES as readonly string[]).includes(value);

/** A link such as …/beheer/?lang=ar opens the panel in that language; otherwise the last choice, else Dutch. */
function initialLocale(): Locale {
  const fromLink = new URLSearchParams(window.location.search).get('lang');
  if (isLocale(fromLink)) return fromLink;
  try {
    const saved = localStorage.getItem('admin-lang');
    if (isLocale(saved)) return saved;
  } catch {
    // Storage can be blocked; Dutch is the default.
  }
  return 'nl';
}

const I18nContext = createContext<{ i18n: I18n; setLocale: (locale: Locale) => void } | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const i18n = useMemo(() => makeI18n(locale), [locale]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem('admin-lang', locale);
    } catch {
      // The choice simply is not remembered.
    }
  }, [locale]);
  const value = useMemo(() => ({ i18n, setLocale }), [i18n]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  return useContext(I18nContext)!.i18n;
}

export function useSetLocale(): (locale: Locale) => void {
  return useContext(I18nContext)!.setLocale;
}

/** Splits "Wat gebeurt er *nu*?" into plain text and an italic accent. */
export function Accent({ text }: { text: string }) {
  return (
    <>
      {text.split('*').map((part, index) => (index % 2 === 1 ? <em key={index}>{part}</em> : part))}
    </>
  );
}
