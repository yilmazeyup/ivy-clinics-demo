import {
  addDays,
  formatDayLong,
  formatDayShort,
  formatEuro,
  formatTime,
  inSentence,
  isRTL,
  pick,
  sameDay,
  weekdayShort,
  type L10n,
} from '@pure-clinics/shared';
import { useMemo } from 'react';

import { blanchePlural, blancheText, type BlancheKey, type BlanchePluralKey, type BlancheVars } from './data';
import { useDemo } from './state/demo';

export type { BlancheKey };

export function useI18n() {
  const { locale, now } = useDemo();
  return useMemo(() => {
    const t = (key: BlancheKey, vars?: BlancheVars) => blancheText(locale, key, vars);
    const dayShort = (date: Date) => formatDayShort(date, locale);
    return {
      locale,
      rtl: isRTL(locale),
      t,
      tp: (key: BlanchePluralKey, count: number, vars?: BlancheVars) => blanchePlural(locale, key, count, vars),
      dayShort,
      dayLong: (date: Date) => formatDayLong(date, locale),
      weekday: (date: Date) => weekdayShort(date, locale),
      time: formatTime,
      euro: (amount: number) => formatEuro(amount, locale),
      num: (value: number) => new Intl.NumberFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale).format(Math.round(value)),
      /** One decimal, e.g. a rating: "4,9" in Dutch, "4.9" in English. */
      decimal: (value: number) =>
        new Intl.NumberFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value),
      text: (value: L10n) => pick(value, locale),
      /** "Vandaag", "Morgen" or "do 29 okt". */
      relativeDay: (date: Date) => {
        if (sameDay(date, now)) return t('common.today');
        if (sameDay(date, addDays(now, 1))) return t('common.tomorrow');
        return dayShort(date);
      },
      /** Like relativeDay, but "morgen" rather than "Morgen", for use mid-sentence. */
      relativeDayInline: (date: Date) => {
        if (sameDay(date, now) || sameDay(date, addDays(now, 1))) return inSentence(sameDay(date, now) ? t('common.today') : t('common.tomorrow'), locale);
        return dayShort(date);
      },
      /** "over 19 uur", "over 2 dagen". */
      fromNow: (date: Date) => {
        const minutes = Math.max(0, Math.round((date.getTime() - now.getTime()) / 60000));
        if (minutes < 60) return t('time.inMinutes', { n: minutes });
        const hours = Math.round(minutes / 60);
        if (hours < 36) return blanchePlural(locale, 'time.inHours', hours);
        return blanchePlural(locale, 'time.inDays', Math.round(hours / 24));
      },
      /** "3 weken geleden". */
      ago: (date: Date) => {
        const days = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
        if (days < 14) return blanchePlural(locale, 'time.daysAgo', days);
        return blanchePlural(locale, 'time.weeksAgo', Math.round(days / 7));
      },
    };
  }, [locale, now]);
}
