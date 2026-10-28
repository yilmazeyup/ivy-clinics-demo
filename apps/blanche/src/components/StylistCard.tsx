import { View } from 'react-native';

import { firstSlot, type Service, type StudioLocationId, type Stylist } from '@/data';
import { useI18n } from '@/i18n';
import { useStudio } from '@/studio';
import { categoryColors, useTheme } from '@/theme';

import { Icon } from './Icon';
import { Squish } from './Motion';
import { Photo } from './Photo';
import { Txt } from './Txt';

type Props = { stylist: Stylist; service: Service; onPress: () => void; selected?: boolean; note?: string; location?: StudioLocationId };

/** A stylist as her work: a photo of a set she made, her name, what she is known for and her first free moment. */
export function StylistCard({ stylist, service, onPress, selected, note, location = 'nijmegen' }: Props) {
  const theme = useTheme();
  const { t, text, time, relativeDayInline, decimal } = useI18n();
  const { now, bookings } = useStudio();
  const colors = categoryColors(service.category);
  const first = firstSlot(service, stylist.id, now, bookings, location);
  return (
    <Squish onPress={onPress} scaleTo={0.95} accessibilityRole="radio" accessibilityState={{ checked: !!selected }} accessibilityLabel={stylist.name}>
      <View
        style={{
          width: 172,
          padding: 8,
          paddingBottom: 14,
          borderRadius: 24,
          backgroundColor: selected ? colors.soft : '#FFFFFF',
          borderWidth: 2,
          borderColor: selected ? colors.ink : 'transparent',
          boxShadow: selected ? undefined : theme.shadow.card,
          gap: 10,
        }}
      >
        <Photo photo={stylist.work} style={{ height: 120, borderRadius: 18 }}>
          {selected ? (
            <View
              style={{
                position: 'absolute',
                top: 8,
                end: 8,
                width: 30,
                height: 30,
                borderRadius: 11,
                backgroundColor: colors.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="check" size={17} color="#FFFFFF" strokeWidth={2.6} />
            </View>
          ) : null}
        </Photo>
        <View style={{ paddingHorizontal: 6, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt variant="title" style={{ fontSize: 26, lineHeight: 28 }}>
              {stylist.name}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Icon name="star" size={13} color={theme.c.ink} />
              <Txt variant="caption">{decimal(stylist.rating)}</Txt>
            </View>
          </View>
          <Txt variant="caption" color={theme.c.muted} numberOfLines={2} style={{ minHeight: 28 }}>
            {note ?? text(stylist.known)}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
            <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: first ? theme.c.mint : theme.c.muted }} />
            <Txt variant="caption" color={theme.c.inkSoft} numberOfLines={1}>
              {first ? t('stylist.first', { when: `${relativeDayInline(first.start)} ${time(first.start)}` }) : t('stylist.full')}
            </Txt>
          </View>
        </View>
      </View>
    </Squish>
  );
}
