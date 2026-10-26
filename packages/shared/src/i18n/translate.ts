import type { Locale } from './locales';
import { ar } from './messages/ar';
import { de } from './messages/de';
import { en } from './messages/en';
import { fr } from './messages/fr';
import { it } from './messages/it';
import { nl, type MessageKey, type Messages } from './messages/nl';

const MESSAGES: Record<Locale, Messages> = { nl, en, ar, fr, de, it };

export type Vars = Record<string, string | number>;

/** Keys that come in a `.one` / `.other` pair, without the suffix. */
export type PluralKey = MessageKey extends infer K ? (K extends `${infer Base}.one` ? Base : never) : never;

function fill(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (vars[name] === undefined ? match : String(vars[name])));
}

export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  return fill(MESSAGES[locale][key] ?? nl[key], vars);
}

export function translatePlural(locale: Locale, key: PluralKey, count: number, vars?: Vars): string {
  const form = count === 1 ? 'one' : 'other';
  return translate(locale, `${key}.${form}` as MessageKey, { n: count, ...vars });
}

export type Segment = { text: string; accent: boolean };

/** Splits "Tijd voor je *wimperlift*." into plain and accented parts. */
export function splitAccents(text: string): Segment[] {
  return text
    .split('*')
    .map((part, index) => ({ text: part, accent: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
}

/** Lower-cases the first letter so a name can sit mid-sentence; German nouns and Arabic stay as they are. */
export function inSentence(name: string, locale: Locale): string {
  if (locale === 'de' || locale === 'ar' || name.length === 0) return name;
  return name.charAt(0).toLocaleLowerCase(locale) + name.slice(1);
}

export type { MessageKey, Messages };
