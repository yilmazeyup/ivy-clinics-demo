import type { Treatment } from '@pure-clinics/shared';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';

import { Glass } from './Glass';
import { Icon } from './Icon';
import { useMorphSource } from './Morph';
import { PressableScale } from './Motion';
import { Photo } from './Photo';
import { Txt } from './Txt';

/** Opens a treatment's page, with the card's photo growing into the page's header photo. */
export function useOpenTreatment(treatment: Treatment, radius: number, location?: string) {
  const source = useMorphSource(treatment.photo, radius);
  const open = () =>
    source.lift().then(() => router.push({ pathname: '/behandeling/[id]', params: { id: treatment.id, ...(location ? { location } : {}) } }));
  return { ref: source.ref, open };
}

/** A treatment as a tall photo card: its category on a pane of glass, the name and price over the photo. */
export function TreatmentCard({ treatment, height, location, compact }: { treatment: Treatment; height: number; location?: string; compact?: boolean }) {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  const radius = compact ? theme.r.photo : theme.r.card;
  const { ref, open } = useOpenTreatment(treatment, radius, location);
  const price = treatment.priceFrom ? t('clinic.price.from', { price: euro(treatment.priceFrom) }) : t('clinic.price.free');
  return (
    <PressableScale accessibilityLabel={text(treatment.name)} onPress={open} style={{ height, borderRadius: radius, boxShadow: theme.shadow.card }}>
      <View ref={ref} collapsable={false} style={{ flex: 1, borderRadius: radius, overflow: 'hidden' }}>
        <Photo photo={treatment.photo} style={StyleSheet.absoluteFill} />
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" pointerEvents="none">
          <Defs>
            <LinearGradient id="cardShade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.4" stopColor="#141210" stopOpacity={0} />
              <Stop offset="1" stopColor="#141210" stopOpacity={0.72} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill="url(#cardShade)" />
        </Svg>
        <View style={{ position: 'absolute', top: 12, start: 12, end: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Glass style={{ borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Txt variant="caption" style={{ fontFamily: theme.f.medium }} numberOfLines={1}>
              {t(`clinic.cat.${treatment.category}`)}
            </Txt>
          </Glass>
          {compact ? null : (
            <Glass style={{ width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ transform: [{ rotate: theme.rtl ? '45deg' : '-45deg' }] }}>
                <Icon name="arrow" size={16} />
              </View>
            </Glass>
          )}
        </View>
        <View style={{ position: 'absolute', start: compact ? 12 : 16, end: compact ? 12 : 16, bottom: compact ? 12 : 16, gap: 3 }}>
          <Txt variant={compact ? 'heading' : 'title'} color="#FFFFFF" numberOfLines={2}>
            {text(treatment.name)}
          </Txt>
          <Txt variant="small" color="rgba(255, 255, 255, 0.86)" numberOfLines={1}>
            {`${t('common.minutes', { n: treatment.minutes })} · ${price}`}
          </Txt>
        </View>
      </View>
    </PressableScale>
  );
}
