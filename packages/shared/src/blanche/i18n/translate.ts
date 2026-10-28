import type { Locale } from '../../i18n/locales';
import { ar } from './ar';
import { de } from './de';
import { en } from './en';
import { fr } from './fr';
import { it } from './it';
import { nl, type BlancheKey, type BlancheMessages } from './nl';

const MESSAGES: Record<Locale, BlancheMessages> = { nl, en, ar, fr, de, it };

export type BlancheVars = Record<string, string | number>;

/** Keys that come in a `.one` / `.other` pair, without the suffix. */
export type BlanchePluralKey = BlancheKey extends infer K ? (K extends `${infer Base}.one` ? Base : never) : never;

function fill(template: string, vars?: BlancheVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (vars[name] === undefined ? match : String(vars[name])));
}

/** The member app's texts for Blanche Beauty, in the six languages of the demo. */
export function blancheText(locale: Locale, key: BlancheKey, vars?: BlancheVars): string {
  return fill(MESSAGES[locale][key] ?? nl[key], vars);
}

export function blanchePlural(locale: Locale, key: BlanchePluralKey, count: number, vars?: BlancheVars): string {
  return blancheText(locale, `${key}.${count === 1 ? 'one' : 'other'}` as BlancheKey, { n: count, ...vars });
}

export type { BlancheKey, BlancheMessages };
