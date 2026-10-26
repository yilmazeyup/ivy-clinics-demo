import * as Haptics from 'expo-haptics';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

type Kind = 'primary' | 'secondary' | 'accent' | 'light' | 'quiet';

type Props = {
  label: string;
  onPress?: () => void;
  kind?: Kind;
  size?: 'md' | 'sm';
  icon?: IconName;
  iconAfter?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({ label, onPress, kind = 'primary', size = 'md', icon, iconAfter, disabled, style, accessibilityLabel }: Props) {
  const theme = useTheme();
  const colors: Record<Kind, { bg: string; fg: string; border?: string }> = {
    primary: { bg: theme.c.primary, fg: theme.c.onPrimary },
    secondary: { bg: 'transparent', fg: theme.c.ink, border: theme.c.ink },
    accent: { bg: theme.c.accent, fg: theme.c.onAccent },
    light: { bg: theme.c.surface, fg: theme.c.ink },
    quiet: { bg: theme.c.bg, fg: theme.c.ink },
  };
  const { bg, fg, border } = colors[kind];
  const height = size === 'md' ? 52 : 40;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          height,
          paddingHorizontal: size === 'md' ? 22 : 14,
          borderRadius: size === 'md' ? theme.r.control : theme.r.chip,
          backgroundColor: bg,
          borderWidth: border ? (theme.brand === 'pure' ? 1.5 : 1) : 0,
          borderColor: border,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Txt variant="button" color={fg} numberOfLines={1} style={size === 'sm' ? { fontSize: 14 } : undefined}>
        {label}
      </Txt>
      {iconAfter ? (
        <View>
          <Icon name={iconAfter} size={16} color={fg} />
        </View>
      ) : null}
    </Pressable>
  );
}

type IconButtonProps = { icon: IconName; label: string; onPress?: () => void; tone?: 'plain' | 'surface' | 'ink'; size?: number };

/** A 44pt square target with just an icon; never a circle. */
export function IconButton({ icon, label, onPress, tone = 'plain', size = 44 }: IconButtonProps) {
  const theme = useTheme();
  const bg = tone === 'surface' ? theme.c.surface : tone === 'ink' ? theme.c.ink : 'transparent';
  const fg = tone === 'ink' ? theme.c.onPrimary : theme.c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: theme.brand === 'pure' ? 12 : 8,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} color={fg} />
    </Pressable>
  );
}
