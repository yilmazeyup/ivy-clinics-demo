import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Glass } from './Glass';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './Motion';
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

/** A button that gives way under the finger and springs back, with a light tick on a phone. */
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
    <PressableScale
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      haptic={!disabled}
      onPress={onPress}
      style={[
        {
          height,
          paddingHorizontal: size === 'md' ? 22 : 14,
          borderRadius: size === 'md' ? theme.r.control : theme.r.chip,
          backgroundColor: bg,
          borderWidth: border ? 1 : 0,
          borderColor: border,
          opacity: disabled ? 0.45 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        kind === 'primary' || kind === 'accent' ? { boxShadow: '0px 6px 18px rgba(30, 30, 28, 0.18)' } : null,
        kind === 'light' ? { boxShadow: theme.shadow.card } : null,
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
    </PressableScale>
  );
}

type IconButtonProps = { icon: IconName; label: string; onPress?: () => void; tone?: 'plain' | 'surface' | 'ink'; size?: number };

/** A 44pt square target with just an icon; on a page or a photo the surface tone is a pane of glass. Never a circle. */
export function IconButton({ icon, label, onPress, tone = 'plain', size = 44 }: IconButtonProps) {
  const theme = useTheme();
  const fg = tone === 'ink' ? theme.c.onPrimary : theme.c.ink;
  const frame: ViewStyle = { width: size, height: size, borderRadius: 14, alignItems: 'center', justifyContent: 'center' };
  return (
    <PressableScale accessibilityLabel={label} onPress={onPress} scaleTo={0.9} style={{ borderRadius: 14 }}>
      {tone === 'surface' ? (
        <Glass style={frame} interactive>
          <Icon name={icon} color={fg} />
        </Glass>
      ) : (
        <View style={[frame, { backgroundColor: tone === 'ink' ? theme.c.ink : 'transparent' }]}>
          <Icon name={icon} color={fg} />
        </View>
      )}
    </PressableScale>
  );
}
