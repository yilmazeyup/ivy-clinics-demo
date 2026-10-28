import { LOCALES, type L10n, type Locale } from '@pure-clinics/shared';
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

export type Arg = string | number | Date;
type PluralBase = 'studio.waiting' | 'shop.orders';

const pad = (n: number) => String(n).padStart(2, '0');

function makeI18n(locale: Locale) {
  const intl = INTL[locale];
  const euro = new Intl.NumberFormat(intl, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const integer = new Intl.NumberFormat(intl);
  const percent = new Intl.NumberFormat(intl, { style: 'percent', maximumFractionDigits: 0 });
  const longDay = new Intl.DateTimeFormat(intl, { weekday: 'long', day: 'numeric', month: 'long' });
  const shortDate = new Intl.DateTimeFormat(intl, { weekday: 'short', day: 'numeric', month: 'short' });
  const dayMonth = new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'short' });
  const monthYear = new Intl.DateTimeFormat(intl, { month: 'long', year: 'numeric' });
  const weekday = new Intl.DateTimeFormat(intl, { weekday: 'long' });
  const weekdayShort = new Intl.DateTimeFormat(intl, { weekday: 'short' });
  const clock = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const resolve = (arg: Arg) => (arg instanceof Date ? clock(arg) : String(arg));
  const t = (key: MessageKey, args?: Record<string, Arg>) =>
    (MESSAGES[locale][key] ?? nl[key]).replace(/\{(\w+)\}/g, (match, name: string) => (args && args[name] !== undefined ? resolve(args[name]) : match));
  return {
    locale,
    rtl: locale === 'ar',
    t,
    tn: (base: PluralBase, n: number, args?: Record<string, Arg>) => t(`${base}.${n === 1 ? 'one' : 'other'}` as MessageKey, { n, ...args }),
    text: (value: L10n) => value[locale],
    eur: (amount: number) => euro.format(Math.round(amount)),
    num: (value: number) => integer.format(Math.round(value)),
    pct: (value: number) => percent.format(value),
    clock,
    dayLong: (date: Date) => longDay.format(date),
    dateShort: (date: Date) => shortDate.format(date).replace(/\./g, ''),
    dayMonth: (date: Date) => dayMonth.format(date).replace(/\./g, ''),
    monthYear: (date: Date) => monthYear.format(date),
    weekday: (date: Date) => weekday.format(date),
    weekdayShort: (date: Date) => weekdayShort.format(date).replace(/\./g, ''),
    greeting: (date: Date) => t(date.getHours() < 12 ? 'top.greeting.morning' : date.getHours() < 18 ? 'top.greeting.afternoon' : 'top.greeting.evening'),
  };
}

export type I18n = ReturnType<typeof makeI18n>;

const Context = createContext<{ i18n: I18n; setLocale: (locale: Locale) => void } | null>(null);

/** The language comes from ?lang= when it is one of the six, otherwise Dutch; the menu changes it. */
function initialLocale(): Locale {
  const lang = new URLSearchParams(window.location.search).get('lang');
  return lang && (LOCALES as readonly string[]).includes(lang) ? (lang as Locale) : 'nl';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const i18n = useMemo(() => makeI18n(locale), [locale]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);
  return <Context.Provider value={{ i18n, setLocale }}>{children}</Context.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx.i18n;
}

export function useSetLocale() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useSetLocale must be used inside I18nProvider');
  return ctx.setLocale;
}

/** Renders "Goedemiddag, *studio*." with the starred part in the italic serif. */
export function Accent({ text }: { text: string }) {
  return (
    <>
      {text.split('*').map((part, i) =>
        i % 2 ? (
          <em key={i} className="accent">
            {part}
          </em>
        ) : (
          part
        ),
      )}
    </>
  );
}
