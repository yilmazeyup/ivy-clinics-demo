import { ScrollView, View } from 'react-native';

import { useLayout } from '@/layout';
import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Squish } from './Motion';
import { Txt } from './Txt';

export type PillOption<T extends string> = { value: T; label: string; icon?: IconName; color?: string };

/** A row of choices as pills; the chosen one fills with ink or with its own colour. Scrolls sideways on a phone. */
export function Pills<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const theme = useTheme();
  const { wide } = useLayout();
  const row = options.map((o) => {
    const on = o.value === value;
    const fill = o.color ?? theme.c.ink;
    return (
      <Squish
        key={o.value}
        accessibilityRole="radio"
        accessibilityState={{ checked: on }}
        onPress={() => onChange(o.value)}
        scaleTo={0.92}
        style={{
          height: 40,
          paddingHorizontal: 16,
          borderRadius: theme.r.pill,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
          backgroundColor: on ? fill : '#FFFFFF',
          borderWidth: 1.5,
          borderColor: on ? fill : theme.c.lineStrong,
        }}
      >
        {o.icon ? <Icon name={o.icon} size={17} color={on ? '#FFFFFF' : theme.c.ink} strokeWidth={2} /> : null}
        <Txt variant="smallStrong" color={on ? '#FFFFFF' : theme.c.ink}>
          {o.label}
        </Txt>
      </Squish>
    );
  });
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label}>
      {wide ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{row}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {row}
        </ScrollView>
      )}
    </View>
  );
}
