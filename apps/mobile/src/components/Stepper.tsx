import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

/** Quantity picker: minus, the number, plus. Going below `min` is not possible. */
export function Stepper({ value, onChange, min = 1, max = 9 }: { value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  const theme = useTheme();
  const { t } = useI18n();
  const step = (icon: IconName, label: string, next: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => {
        Haptics.selectionAsync();
        onChange(next);
      }}
      style={({ pressed }) => ({ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : pressed ? 0.6 : 1 })}
    >
      <Icon name={icon} size={16} />
    </Pressable>
  );
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderRadius: theme.r.control,
        borderWidth: 1,
        borderColor: theme.c.lineStrong,
        backgroundColor: theme.c.surface,
      }}
    >
      {step('minus', t('shop.decrease'), value - 1, value <= min)}
      <Txt variant="bodyStrong" style={{ minWidth: 20, textAlign: 'center' }}>
        {String(value)}
      </Txt>
      {step('plus', t('shop.increase'), value + 1, value >= max)}
    </View>
  );
}
