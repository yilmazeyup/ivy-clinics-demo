import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PopIn, Squish } from '@/components/Motion';
import { Pills } from '@/components/Pills';
import { Footer, Screen, useModalTop } from '@/components/Screen';
import { Sticker, Tag } from '@/components/Sticker';
import { TryOnHand } from '@/components/TryOn';
import { Txt } from '@/components/Txt';
import { POLISH, polishById, type PolishShade } from '@/data';
import { useI18n } from '@/i18n';
import { useLayout } from '@/layout';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

type Family = 'all' | PolishShade['family'];

/** Try a gel colour on a real hand before booking: tap a swatch and the nails change colour. */
export default function ShadeStudio() {
  const theme = useTheme();
  const { t } = useI18n();
  const { wide } = useLayout();
  const top = useModalTop();
  const demo = useDemo();
  const [family, setFamily] = useState<Family>('all');
  const [shade, setShade] = useState<PolishShade>(() => (demo.shade ? polishById(demo.shade) : polishById('truered')));
  const previous = useRef<PolishShade | null>(null);
  const shown = POLISH.filter((p) => family === 'all' || p.family === family);

  const choose = (p: PolishShade) => {
    if (p.id === shade.id) return;
    previous.current = shade;
    setShade(p);
    demo.setShade(p.id);
    Haptics.selectionAsync().catch(() => {});
  };

  const book = () => {
    const service = shade.family === 'nude' && shade.finish === 'milky' ? 'biab-nude' : 'biab-color';
    router.replace({ pathname: '/afspraak/[serviceId]', params: { serviceId: service, shade: shade.id, addOns: shade.finish === 'chrome' ? 'chrome' : '' } });
  };

  const finish = { gloss: t('shade.gloss'), milky: t('shade.milky'), chrome: t('shade.chrome'), shimmer: t('shade.shimmer') }[shade.finish];

  const footer = (
    <Footer>
      <Button label={t('shade.book', { name: shade.name })} icon="sparkle" onPress={book} />
      <Txt variant="caption" color={theme.c.muted} align="center">
        {t('shade.note')}
      </Txt>
    </Footer>
  );

  return (
    <Screen sheet footer={footer} gap={20} contentStyle={{ paddingTop: top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="palette" size={22} />
          <Txt variant="tag">{t('shade.eyebrow')}</Txt>
        </View>
        <IconButton icon="close" label={t('common.close')} tone="chalk" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>

      <View style={wide ? { flexDirection: 'row', gap: 28 } : { gap: 18 }}>
        <View style={{ flex: wide ? 1 : undefined }}>
          <TryOnHand shade={shade} previous={previous.current} style={{ height: wide ? 560 : 420, borderRadius: 30 }} />
          <View style={{ position: 'absolute', top: 14, start: 14 }}>
            <Sticker label={t('shade.live')} bg={theme.c.mintSoft} color={theme.c.mint} icon="wand" angle={-4} />
          </View>
        </View>

        <View style={{ flex: wide ? 1 : undefined, gap: 16 }}>
          <PopIn key={shade.id} rise={8} from={0.96}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 50,
                  height: 66,
                  borderRadius: 16,
                  backgroundColor: shade.hex,
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  boxShadow: theme.shadow.card,
                }}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Txt variant="display" style={{ fontSize: 40, lineHeight: 40 }} numberOfLines={1}>
                  {shade.name}
                </Txt>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Tag label={finish} />
                  <Tag label={t(`shade.family.${shade.family}`)} bg={theme.c.blush} color={theme.c.primary} />
                </View>
              </View>
            </View>
          </PopIn>

          <Pills
            label={t('shade.families')}
            value={family}
            onChange={setFamily}
            options={(['all', 'nude', 'red', 'pink', 'pastel', 'dark', 'chrome'] as Family[]).map((f) => ({
              value: f,
              label: f === 'all' ? t('common.all') : t(`shade.family.${f}`),
            }))}
          />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {shown.map((p) => {
              const on = p.id === shade.id;
              return (
                <Squish
                  key={p.id}
                  onPress={() => choose(p)}
                  scaleTo={0.86}
                  haptic={false}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={p.name}
                >
                  <View style={{ alignItems: 'center', gap: 5, width: 64 }}>
                    <View
                      style={{
                        width: 52,
                        height: 66,
                        borderRadius: 17,
                        backgroundColor: p.hex,
                        borderWidth: on ? 3 : 1,
                        borderColor: on ? theme.c.ink : theme.c.lineStrong,
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: [{ translateY: on ? -4 : 0 }],
                      }}
                    >
                      <View
                        style={{ position: 'absolute', top: 7, start: 9, width: 8, height: 26, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' }}
                      />
                      {on ? (
                        <Icon name="check" size={18} color={p.family === 'dark' || p.family === 'red' ? '#FFFFFF' : theme.c.ink} strokeWidth={2.8} />
                      ) : null}
                    </View>
                    <Txt variant="caption" align="center" numberOfLines={1} style={{ fontSize: 10, width: 64 }}>
                      {p.name}
                    </Txt>
                  </View>
                </Squish>
              );
            })}
          </View>
        </View>
      </View>
    </Screen>
  );
}
