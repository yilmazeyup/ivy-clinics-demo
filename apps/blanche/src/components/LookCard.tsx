import { router } from 'expo-router';
import { View } from 'react-native';

import { polishById, serviceById, stylistById, type Look } from '@/data';
import { useI18n } from '@/i18n';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { Squish } from './Motion';
import { Photo } from './Photo';
import { Txt } from './Txt';

/** A finished set from the studio, like a polaroid pinned slightly askew: tap to book exactly this look. */
export function LookCard({ look, tilt = 0, width = 176 }: { look: Look; tilt?: number; width?: number }) {
  const theme = useTheme();
  const { t, num } = useI18n();
  const { saved, toggleSaved } = useDemo();
  const shade = polishById(look.shade);
  const on = saved.includes(look.id);
  const book = () =>
    router.push({ pathname: '/afspraak/[serviceId]', params: { serviceId: look.service, look: look.id, shade: look.shade, stylist: look.by } });
  return (
    <View style={{ transform: [{ rotate: `${tilt}deg` }] }}>
      <Squish onPress={book} scaleTo={0.95} accessibilityLabel={`${look.name} · ${t('look.book')}`}>
        <View style={{ width, padding: 8, paddingBottom: 12, borderRadius: 24, backgroundColor: '#FFFFFF', boxShadow: theme.shadow.card, gap: 10 }}>
          <Photo photo={look.photo} style={{ height: width * 1.2, borderRadius: 18 }} />
          <View style={{ paddingHorizontal: 6, gap: 4 }}>
            <Txt variant="title" style={{ fontSize: 23, lineHeight: 25 }} numberOfLines={1}>
              {look.name}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 14, height: 18, borderRadius: 6, backgroundColor: shade.hex, borderWidth: 1, borderColor: theme.c.lineStrong }} />
              <Txt variant="caption" color={theme.c.muted} numberOfLines={1} style={{ flex: 1 }}>
                {`${shade.name} · ${stylistById(look.by).name}`}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              {width >= 170 ? (
                <Txt variant="caption" color={theme.c.muted}>
                  {t('look.saves', { n: num(look.saves + (on ? 1 : 0)) })}
                </Txt>
              ) : (
                <View />
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Txt variant="smallStrong" color={theme.c.primary}>
                  {t('look.book')}
                </Txt>
                <Icon name="arrow" size={14} color={theme.c.primary} strokeWidth={2.4} />
              </View>
            </View>
          </View>
        </View>
      </Squish>
      <Squish
        onPress={() => toggleSaved(look.id)}
        scaleTo={0.8}
        accessibilityLabel={on ? t('look.unsave') : t('look.save')}
        style={{ position: 'absolute', top: 16, end: 16 }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 13,
            backgroundColor: on ? theme.c.primary : 'rgba(255,255,255,0.92)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={on ? 'heartFill' : 'heart'} size={18} color={on ? '#FFFFFF' : theme.c.ink} strokeWidth={2} />
        </View>
      </Squish>
    </View>
  );
}

/** The service a look is made with, for a line under it. */
export const lookService = (look: Look) => serviceById(look.service);
