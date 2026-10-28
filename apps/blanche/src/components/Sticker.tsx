import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Wobble } from './Motion';
import { Txt } from './Txt';

type TagProps = { label: string; color?: string; bg?: string; icon?: IconName; style?: StyleProp<ViewStyle> };

/** A small pill label: a craft, "nieuw", a duration. */
export function Tag({ label, color, bg, icon, style }: TagProps) {
  const theme = useTheme();
  const fg = color ?? theme.c.ink;
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 5,
          paddingHorizontal: 10,
          height: 24,
          borderRadius: theme.r.pill,
          backgroundColor: bg ?? theme.c.chalk,
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={12} color={fg} strokeWidth={2.2} /> : null}
      <Txt variant="tag" color={fg} numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

type StickerProps = {
  label: string;
  bg?: string;
  color?: string;
  angle?: number;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  still?: boolean;
  big?: boolean;
};

/**
 * A label stuck on a photo or card: ink outline, a crisp offset shadow and a slight tilt, swaying a little
 * as if just pressed on. Prices, "bestseller", "nieuw".
 */
export function Sticker({ label, bg, color, angle = -5, icon, style, still, big }: StickerProps) {
  const theme = useTheme();
  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: big ? 14 : 11,
        height: big ? 34 : 28,
        borderRadius: theme.r.pill,
        backgroundColor: bg ?? '#FFFFFF',
        borderWidth: 1.5,
        borderColor: theme.c.ink,
        boxShadow: theme.shadow.sticker,
      }}
    >
      {icon ? <Icon name={icon} size={big ? 15 : 13} color={color ?? theme.c.ink} strokeWidth={2.2} /> : null}
      <Txt variant="tag" color={color ?? theme.c.ink} style={big ? { fontSize: 12.5, lineHeight: 15 } : undefined} numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
  if (still) return <View style={[{ alignSelf: 'flex-start', transform: [{ rotate: `${angle}deg` }] }, style]}>{body}</View>;
  return (
    <Wobble angle={angle} style={[{ alignSelf: 'flex-start' }, style]}>
      {body}
    </Wobble>
  );
}
