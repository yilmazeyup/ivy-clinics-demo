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
  translate,
  translatePlural,
  weekdayShort,
  type L10n,
  type MessageKey,
  type PluralKey,
  type Vars,
} from '@pure-ivy/shared';
import { useMemo } from 'react';

import { useDemo } from './state/demo';

export function useI18n() {
  const { locale, now } = useDemo();
  return useMemo(() => {
    const t = (key: MessageKey, vars?: Vars) => translate(locale, key, vars);
    const dayShort = (date: Date) => formatDayShort(date, locale);
    return {
      locale,
      rtl: isRTL(locale),
      t,
      tp: (key: PluralKey, count: number, vars?: Vars) => translatePlural(locale, key, count, vars),
      dayShort,
      dayLong: (date: Date) => formatDayLong(date, locale),
      weekday: (date: Date) => weekdayShort(date, locale),
      time: formatTime,
      euro: (amount: number) => formatEuro(amount, locale),
      text: (value: L10n) => pick(value, locale),
      /** "Vandaag", "Morgen" or "do 29 okt". */
      relativeDay: (date: Date) => {
        if (sameDay(date, now)) return t('common.today');
        if (sameDay(date, addDays(now, 1))) return t('common.tomorrow');
        return dayShort(date);
      },
      /** Like relativeDay, but "morgen" rather than "Morgen", for use mid-sentence. */
      relativeDayInline: (date: Date) => {
        if (sameDay(date, now) || sameDay(date, addDays(now, 1))) {
          return inSentence(sameDay(date, now) ? t('common.today') : t('common.tomorrow'), locale);
        }
        return dayShort(date);
      },
      /** "over 19 uur", "over 2 dagen". */
      fromNow: (date: Date) => {
        const minutes = Math.max(0, Math.round((date.getTime() - now.getTime()) / 60000));
        if (minutes < 60) return t('time.inMinutes', { n: minutes });
        const hours = Math.round(minutes / 60);
        if (hours < 36) return translatePlural(locale, 'time.inHours', hours);
        return translatePlural(locale, 'time.inDays', Math.round(hours / 24));
      },
    };
  }, [locale, now]);
}
