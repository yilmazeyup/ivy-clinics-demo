import { router } from 'expo-router';
import { View } from 'react-native';

import { SHADES, type Deal } from '@/data';
import { useI18n } from '@/i18n';

import { Squish } from './Motion';
import { Photo } from './Photo';
import { Sticker } from './Sticker';
import { Txt } from './Txt';

/** A deal as a square of colour with the price large and the old price struck through. */
export function DealTile({ deal, index }: { deal: Deal; index: number }) {
  const { text, euro, t } = useI18n();
  const shade = SHADES[deal.shade];
  return (
    <Squish
      onPress={() => router.push({ pathname: '/afspraak/[serviceId]', params: { serviceId: deal.service, deal: deal.id } })}
      scaleTo={0.96}
      accessibilityLabel={text(deal.title)}
    >
      <View style={{ width: 236, height: 236, borderRadius: 26, backgroundColor: shade.ink, padding: 18, justifyContent: 'space-between', overflow: 'hidden' }}>
        <Photo
          photo={deal.photo}
          style={{ position: 'absolute', end: -30, top: -30, width: 140, height: 140, borderRadius: 30, transform: [{ rotate: '12deg' }], opacity: 0.9 }}
        />
        <Sticker label={text(deal.when)} angle={index % 2 ? 4 : -4} />
        <View style={{ gap: 6 }}>
          <Txt variant="title" color="#FFFFFF" numberOfLines={2}>
            {text(deal.title)}
          </Txt>
          <Txt variant="small" color="rgba(255,255,255,0.85)" numberOfLines={2}>
            {text(deal.body)}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Txt variant="price" color="#FFFFFF" style={{ fontSize: 32, lineHeight: 34 }}>
              {euro(deal.price)}
            </Txt>
            <Txt variant="small" color="rgba(255,255,255,0.7)" style={{ textDecorationLine: 'line-through' }}>
              {euro(deal.was)}
            </Txt>
            <Txt variant="caption" color="rgba(255,255,255,0.7)">
              {t('deal.save', { amount: euro(deal.was - deal.price) })}
            </Txt>
          </View>
        </View>
      </View>
    </Squish>
  );
}
