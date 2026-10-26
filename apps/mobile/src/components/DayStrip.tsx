import { sameDay } from '@pure-ivy/shared';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';

import { Rail } from './Screen';
import { Txt } from './Txt';

type Props = {
  days: Date[];
  selected: Date;
  onSelect: (day: Date) => void;
  /** Days that cannot be picked, e.g. Sunday at the clinic. */
  isDisabled?: (day: Date) => boolean;
  /** Days with something of the member's own, shown as a short bar. */
  isMarked?: (day: Date) => boolean;
};

/** Two weeks of days as rounded tiles: weekday on top, date below. */
export function DayStrip({ days, selected, onSelect, isDisabled, isMarked }: Props) {
  const theme = useTheme();
  const { weekday } = useI18n();
  return (
    <Rail gap={8}>
      {days.map((day) => {
        const active = sameDay(day, selected);
        const disabled = isDisabled?.(day) ?? false;
        const marked = isMarked?.(day) ?? false;
        const fg = active ? theme.c.onPrimary : disabled ? theme.c.lineStrong : theme.c.ink;
        return (
          <Pressable
            key={day.getTime()}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            disabled={disabled}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(day);
            }}
            style={{
              width: 54,
              height: 70,
              borderRadius: theme.r.control,
              backgroundColor: active ? theme.c.ink : theme.c.surface,
              borderWidth: active ? 0 : 1,
              borderColor: theme.c.line,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <Txt
              variant="caption"
              color={active ? theme.c.onPrimary : disabled ? theme.c.lineStrong : theme.c.muted}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {weekday(day)}
            </Txt>
            <Txt variant="heading" color={fg} style={{ fontSize: 19, lineHeight: 22 }}>
              {String(day.getDate())}
            </Txt>
            <View
              style={{
                width: 12,
                height: 2,
                borderRadius: 1,
                backgroundColor: marked ? (active ? (theme.brand === 'pure' ? theme.c.accent : theme.c.onPrimary) : theme.c.primary) : 'transparent',
              }}
            />
          </Pressable>
        );
      })}
    </Rail>
  );
}
