import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

type Props = { label: string; selected?: boolean; onPress?: () => void; icon?: IconName; iconAfter?: IconName };

export function Chip({ label, selected, onPress, icon, iconAfter }: Props) {
  const theme = useTheme();
  const fg = selected ? theme.c.onPrimary : theme.c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => ({
        height: 40,
        paddingHorizontal: icon || iconAfter ? 12 : 16,
        borderRadius: theme.r.chip,
        backgroundColor: selected ? theme.c.ink : theme.c.surface,
        borderWidth: selected ? 0 : 1,
        borderColor: theme.c.lineStrong,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <Txt variant="smallStrong" color={fg} style={{ fontSize: 14 }}>
        {label}
      </Txt>
      {iconAfter ? <Icon name={iconAfter} size={14} color={fg} /> : null}
    </Pressable>
  );
}
