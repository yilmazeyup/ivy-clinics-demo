import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { type BookingView } from '@/studio';
import { useI18n } from '@/i18n';
import { categoryColors, useTheme } from '@/theme';

import { Icon } from './Icon';
import { Photo } from './Photo';
import { Txt } from './Txt';

type Props = { booking: BookingView; style?: StyleProp<ViewStyle>; right?: ReactNode; compact?: boolean };

/**
 * An appointment as a ticket in the colour of its craft: what and when on the left, a tear-off stub with the countdown
 * on the right, and the stylist's work as a small photo.
 */
export function Ticket({ booking, style, right, compact }: Props) {
  const theme = useTheme();
  const { t, text, relativeDay, time, fromNow } = useI18n();
  const colors = categoryColors(booking.service.category);
  return (
    <View style={[{ flexDirection: 'row', borderRadius: 24, backgroundColor: colors.soft, overflow: 'hidden' }, style]}>
      <View style={{ flex: 1, padding: compact ? 12 : 14, gap: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Photo photo={booking.service.photo} style={{ width: compact ? 48 : 56, height: compact ? 60 : 72, borderRadius: 16 }} />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt variant="tag" color={colors.ink}>
            {t('home.next')}
          </Txt>
          <Txt variant="heading" numberOfLines={2}>
            {text(booking.service.name)}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name="clock" size={14} color={theme.c.inkSoft} strokeWidth={2} />
            <Txt variant="small" color={theme.c.inkSoft} numberOfLines={2} style={{ flexShrink: 1 }}>
              {`${relativeDay(booking.start)} · ${time(booking.start)} · ${booking.stylist.name}`}
            </Txt>
          </View>
        </View>
      </View>
      <View style={{ width: 1.5, marginVertical: 14, borderStyle: 'dashed', borderWidth: 0.75, borderColor: colors.ink, opacity: 0.35 }} />
      <View style={{ width: compact ? 78 : 86, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 2 }}>
        {right ?? (
          <>
            <Icon name="sparkle" size={18} color={colors.ink} strokeWidth={2} />
            <Txt variant="smallStrong" color={colors.ink} align="center" numberOfLines={2}>
              {fromNow(booking.start)}
            </Txt>
          </>
        )}
      </View>
    </View>
  );
}
