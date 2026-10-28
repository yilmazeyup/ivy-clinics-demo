import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, useWindowDimensions, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { LookCard } from '@/components/LookCard';
import { nativeDriver, PopIn, Squish } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { Rail, Screen, useModalTop } from '@/components/Screen';
import { Sticker, Tag } from '@/components/Sticker';
import { Txt } from '@/components/Txt';
import { LOOKS, polishById, serviceById, stylistById, type Look } from '@/data';
import { useI18n } from '@/i18n';
import { useLayout } from '@/layout';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

/** Swipe through finished sets: right to keep it on your moodboard, left to skip. The stylist sees what you saved. */
export default function InspoScreen() {
  const theme = useTheme();
  const { t, text } = useI18n();
  const top = useModalTop();
  const { width } = useWindowDimensions();
  const { wide } = useLayout();
  const { saved, toggleSaved } = useDemo();
  const [index, setIndex] = useState(0);
  const deck = LOOKS;
  const cardWidth = Math.min(width - 40, wide ? 400 : 380);
  const x = useRef(new Animated.Value(0)).current;
  const done = index >= deck.length;

  const fly = (dir: 1 | -1) => {
    const look = deck[index];
    if (!look) return;
    if (dir === 1 && !saved.includes(look.id)) toggleSaved(look.id);
    Haptics.impactAsync(dir === 1 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.timing(x, { toValue: dir * (width + 120), duration: 260, useNativeDriver: nativeDriver }).start(() => {
      x.setValue(0);
      setIndex((i) => i + 1);
    });
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
        onPanResponderMove: (_, g) => x.setValue(g.dx),
        onPanResponderRelease: (_, g) => {
          if (g.dx > 110) fly(1);
          else if (g.dx < -110) fly(-1);
          else Animated.spring(x, { toValue: 0, stiffness: 260, damping: 18, useNativeDriver: nativeDriver }).start();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, width, saved],
  );

  const rotate = x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-16deg', '0deg', '16deg'] });
  const like = x.interpolate({ inputRange: [0, 120], outputRange: [0, 1], extrapolate: 'clamp' });
  const nope = x.interpolate({ inputRange: [-120, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const keep = LOOKS.filter((l) => saved.includes(l.id));

  const card = (look: Look, depth: number) => {
    const shade = polishById(look.shade);
    const service = serviceById(look.service);
    return (
      <View
        style={{ width: cardWidth, height: cardWidth * 1.32, borderRadius: 32, overflow: 'hidden', backgroundColor: '#FFFFFF', boxShadow: theme.shadow.lift }}
      >
        <Photo photo={look.photo} scrim style={{ flex: 1 }}>
          <View style={{ position: 'absolute', top: 16, start: 16, flexDirection: 'row', gap: 6 }}>
            {look.own ? <Sticker label={t('inspo.own')} bg="#FFFFFF" angle={-4} still={depth > 0} /> : null}
          </View>
          <View style={{ position: 'absolute', start: 20, end: 20, bottom: 20, gap: 8 }}>
            <Txt variant="display" color="#FFFFFF" style={{ fontSize: 44, lineHeight: 44 }}>
              {look.name}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Tag label={text(service.name)} bg="rgba(255,255,255,0.92)" />
              <Tag label={shade.name} bg="rgba(255,255,255,0.92)" icon="polish" />
              <Tag label={stylistById(look.by).name} bg="rgba(255,255,255,0.92)" icon="user" />
            </View>
          </View>
        </Photo>
      </View>
    );
  };

  return (
    <Screen sheet gap={22} contentStyle={{ paddingTop: top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tag label={t('inspo.count', { n: Math.min(index + 1, deck.length), total: deck.length })} icon="cards" />
        <IconButton icon="close" label={t('common.close')} tone="chalk" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
      <Txt variant="display">{t('inspo.title')}</Txt>

      <View style={{ height: cardWidth * 1.32 + 10, alignItems: 'center' }}>
        {done ? (
          <PopIn
            style={{
              width: cardWidth,
              height: cardWidth * 1.32,
              borderRadius: 32,
              backgroundColor: theme.c.lilacSoft,
              padding: 26,
              justifyContent: 'center',
              gap: 14,
            }}
          >
            <Icon name="heartFill" size={40} color={theme.c.primary} />
            <Txt variant="display">{t('inspo.doneTitle')}</Txt>
            <Txt variant="body" color={theme.c.inkSoft}>
              {t('inspo.doneBody', { n: keep.length })}
            </Txt>
            <Button label={t('inspo.again')} kind="outline" size="md" icon="refresh" onPress={() => setIndex(0)} style={{ alignSelf: 'flex-start' }} />
          </PopIn>
        ) : (
          <>
            {deck[index + 1] ? (
              <View style={{ position: 'absolute', transform: [{ scale: 0.94 }, { translateY: 14 }, { rotate: '3deg' }] }}>{card(deck[index + 1], 1)}</View>
            ) : null}
            <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: x }, { rotate }] }}>
              {card(deck[index], 0)}
              <Animated.View style={{ position: 'absolute', top: 26, start: 22, opacity: like, transform: [{ rotate: '-12deg' }] }}>
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 12,
                    borderWidth: 3,
                    borderColor: theme.c.mint,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                  }}
                >
                  <Txt variant="title" color={theme.c.mint}>
                    {t('inspo.keep')}
                  </Txt>
                </View>
              </Animated.View>
              <Animated.View style={{ position: 'absolute', top: 26, end: 22, opacity: nope, transform: [{ rotate: '12deg' }] }}>
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 12,
                    borderWidth: 3,
                    borderColor: theme.c.primary,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                  }}
                >
                  <Txt variant="title" color={theme.c.primary}>
                    {t('inspo.skip')}
                  </Txt>
                </View>
              </Animated.View>
            </Animated.View>
          </>
        )}
      </View>

      {done ? null : (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, alignItems: 'center' }}>
          <Squish onPress={() => fly(-1)} scaleTo={0.85} accessibilityLabel={t('inspo.skip')}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 22,
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5,
                borderColor: theme.c.lineStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="close" size={26} strokeWidth={2.4} />
            </View>
          </Squish>
          <Squish
            onPress={() => {
              const look = deck[index];
              router.replace({ pathname: '/afspraak/[serviceId]', params: { serviceId: look.service, look: look.id, shade: look.shade, stylist: look.by } });
            }}
            scaleTo={0.9}
            accessibilityLabel={t('look.book')}
          >
            <View
              style={{ height: 52, paddingHorizontal: 20, borderRadius: 999, backgroundColor: theme.c.ink, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Icon name="sparkle" size={18} color="#FFFFFF" />
              <Txt variant="button" color="#FFFFFF">
                {t('look.book')}
              </Txt>
            </View>
          </Squish>
          <Squish onPress={() => fly(1)} scaleTo={0.85} accessibilityLabel={t('inspo.keep')}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 22,
                backgroundColor: theme.c.primary,
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: theme.shadow.pop,
              }}
            >
              <Icon name="heartFill" size={26} color="#FFFFFF" />
            </View>
          </Squish>
        </View>
      )}

      {keep.length ? (
        <View style={{ gap: 12 }}>
          <Txt variant="title">{t('inspo.saved', { n: keep.length })}</Txt>
          <Rail gap={12} wrap={false}>
            {keep.map((look, i) => (
              <LookCard key={look.id} look={look} width={140} tilt={i % 2 ? 1.5 : -1.5} />
            ))}
          </Rail>
        </View>
      ) : null}
    </Screen>
  );
}
