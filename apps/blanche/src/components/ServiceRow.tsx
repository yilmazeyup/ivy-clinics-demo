import { router } from 'expo-router';
import { View } from 'react-native';

import type { Service } from '@/data';
import { useI18n } from '@/i18n';
import { categoryColors, useTheme } from '@/theme';

import { Icon } from './Icon';
import { Squish } from './Motion';
import { Photo } from './Photo';
import { Sticker } from './Sticker';
import { Txt } from './Txt';

/** One line of the menu: a photo, the name and what it is, time and price, and a quick-book button. */
export function ServiceRow({ service }: { service: Service }) {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  const colors = categoryColors(service.category);
  return (
    <View>
      <Squish
        onPress={() => router.push({ pathname: '/behandeling/[id]', params: { id: service.id } })}
        scaleTo={0.97}
        accessibilityLabel={text(service.name)}
        style={{ flexDirection: 'row', gap: 14, padding: 10, paddingEnd: 60, borderRadius: 24, backgroundColor: '#FFFFFF', boxShadow: theme.shadow.card }}
      >
        <Photo photo={service.photo} style={{ width: 86, height: 104, borderRadius: 18 }}>
          {service.popular || service.fresh ? (
            <View style={{ position: 'absolute', bottom: 6, start: 6 }}>
              <Sticker label={service.fresh ? t('common.new') : t('common.popular')} bg={service.fresh ? theme.c.honeySoft : colors.soft} angle={-6} still />
            </View>
          ) : null}
        </Photo>
        <View style={{ flex: 1, gap: 4, paddingVertical: 4 }}>
          <Txt variant="heading" numberOfLines={2}>
            {text(service.name)}
          </Txt>
          <Txt variant="small" color={theme.c.muted} numberOfLines={2}>
            {text(service.short)}
          </Txt>
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Txt variant="price" style={{ fontSize: 24, lineHeight: 26 }}>
              {euro(service.price)}
            </Txt>
            <Txt variant="caption" color={theme.c.muted}>
              {t('common.minutes', { n: service.minutes })}
            </Txt>
          </View>
        </View>
      </Squish>
      <Squish
        onPress={() => router.push({ pathname: '/afspraak/[serviceId]', params: { serviceId: service.id } })}
        scaleTo={0.85}
        accessibilityLabel={t('service.book', { name: text(service.name) })}
        style={{ position: 'absolute', end: 10, bottom: 10 }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={20} color="#FFFFFF" strokeWidth={2.4} />
        </View>
      </Squish>
    </View>
  );
}
