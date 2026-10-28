import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Squish } from './Motion';
import { Txt } from './Txt';

type Kind = 'primary' | 'ink' | 'outline' | 'soft' | 'white';

type Props = {
  label: string;
  onPress?: () => void;
  kind?: Kind;
  size?: 'lg' | 'md' | 'sm';
  icon?: IconName;
  iconAfter?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Overrides the fill, e.g. the colour of a craft. */
  color?: string;
};

/** A pill that squishes under the finger. Cherry for the main action, ink or outline for the rest. */
export function Button({ label, onPress, kind = 'primary', size = 'lg', icon, iconAfter, disabled, style, accessibilityLabel, color }: Props) {
  const theme = useTheme();
  const colors: Record<Kind, { bg: string; fg: string; border?: string }> = {
    primary: { bg: color ?? theme.c.primary, fg: theme.c.onPrimary },
    ink: { bg: theme.c.ink, fg: '#FFFFFF' },
    outline: { bg: 'transparent', fg: theme.c.ink, border: theme.c.ink },
    soft: { bg: theme.c.chalk, fg: theme.c.ink },
    white: { bg: '#FFFFFF', fg: theme.c.ink },
  };
  const { bg, fg, border } = colors[kind];
  const height = size === 'lg' ? 56 : size === 'md' ? 46 : 36;
  return (
    <Squish
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      haptic={!disabled}
      onPress={onPress}
      style={[
        {
          height,
          paddingHorizontal: size === 'sm' ? 14 : 24,
          borderRadius: theme.r.pill,
          backgroundColor: bg,
          borderWidth: border ? 1.5 : 0,
          borderColor: border,
          opacity: disabled ? 0.4 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
        kind === 'primary' && !disabled ? { boxShadow: color ? `0px 8px 22px ${color}55` : theme.shadow.pop } : null,
        kind === 'white' ? { boxShadow: theme.shadow.card } : null,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 19} color={fg} strokeWidth={2} /> : null}
      <Txt variant="button" color={fg} numberOfLines={1} style={size === 'sm' ? { fontSize: 13 } : undefined}>
        {label}
      </Txt>
      {iconAfter ? (
        <View>
          <Icon name={iconAfter} size={size === 'sm' ? 15 : 18} color={fg} strokeWidth={2.2} />
        </View>
      ) : null}
    </Squish>
  );
}

type IconButtonProps = { icon: IconName; label: string; onPress?: () => void; tone?: 'white' | 'ink' | 'chalk' | 'clear'; size?: number; badge?: number };

/** A round-cornered square with just an icon, 44 points so it is easy to hit. */
export function IconButton({ icon, label, onPress, tone = 'white', size = 44, badge }: IconButtonProps) {
  const theme = useTheme();
  const bg = tone === 'ink' ? theme.c.ink : tone === 'chalk' ? theme.c.chalk : tone === 'clear' ? 'transparent' : '#FFFFFF';
  const fg = tone === 'ink' ? '#FFFFFF' : theme.c.ink;
  return (
    <Squish accessibilityLabel={label} onPress={onPress} scaleTo={0.88} style={{ borderRadius: 16 }}>
      <View
        style={[
          { width: size, height: size, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: bg },
          tone === 'white' ? { boxShadow: theme.shadow.card } : null,
        ]}
      >
        <Icon name={icon} color={fg} size={21} />
        {badge ? (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 19,
              height: 19,
              paddingHorizontal: 5,
              borderRadius: 7,
              backgroundColor: theme.c.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}
          >
            <Txt variant="caption" color="#FFFFFF" style={{ fontSize: 10, lineHeight: 12, fontFamily: theme.f.heavy }}>
              {String(badge)}
            </Txt>
          </View>
        ) : null}
      </View>
    </Squish>
  );
}
