export const LOCALES = ['nl', 'en', 'ar', 'fr', 'de', 'it'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'nl';

/** Each language in its own script, so people can find theirs; Dutch is the exception and shows its English name, by request. */
export const LOCALE_NAMES: Record<Locale, string> = {
  nl: 'Dutch',
  en: 'English',
  ar: 'العربية',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
};

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

/** Maps a device language code such as "de" or "ar-EG" to a supported locale. */
export function matchLocale(code?: string | null): Locale {
  if (!code) return DEFAULT_LOCALE;
  const base = code.toLowerCase().split(/[-_]/)[0];
  return (LOCALES as readonly string[]).includes(base) ? (base as Locale) : DEFAULT_LOCALE;
}

/** Text that is written once per language, used for demo content. */
export type L10n = Record<Locale, string>;

export function pick(text: L10n, locale: Locale): string {
  return text[locale] ?? text[DEFAULT_LOCALE];
}
