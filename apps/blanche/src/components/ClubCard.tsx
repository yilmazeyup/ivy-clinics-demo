import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { MEMBER, REWARDS } from '@/data';
import { useI18n } from '@/i18n';
import { useStudio } from '@/studio';
import { useTheme } from '@/theme';

import { useCountUp, useLoop } from './Motion';
import { Txt } from './Txt';

/**
 * The Blanche Club card: an iridescent card like a chrome nail, with a sheen that sweeps across now and then.
 * It shows the level, the points (counting up) and how far the next reward is.
 */
export function ClubCard({ big }: { big?: boolean }) {
  const theme = useTheme();
  const { t, num } = useI18n();
  const { points, level } = useStudio();
  const [width, setWidth] = useState(0);
  const shown = useCountUp(points, { duration: 1200, delay: 200 });
  const sheen = useLoop(1600, 2600);
  const next = REWARDS.filter((r) => r.points > points).sort((a, b) => a.points - b.points)[0];
  const goal = level.next?.from ?? points;
  const progress = level.next ? Math.min(1, (points - level.tier.from) / (goal - level.tier.from)) : 1;
  const height = big ? 220 : 196;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height, borderRadius: 26, overflow: 'hidden', boxShadow: theme.shadow.lift, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' }}
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="holo" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFD9E6" />
            <Stop offset="0.35" stopColor="#E9DDFF" />
            <Stop offset="0.65" stopColor="#FFF1C7" />
            <Stop offset="1" stopColor="#D8F3E8" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#holo)" />
      </Svg>
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -40,
            bottom: -40,
            width: 70,
            backgroundColor: 'rgba(255,255,255,0.55)',
            transform: [{ translateX: sheen.interpolate({ inputRange: [0, 1], outputRange: [-120, width + 60] }) }, { rotate: '18deg' }],
          }}
        />
      ) : null}
      <View style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ gap: 2 }}>
            <Txt variant="tag" color={theme.c.inkSoft}>
              {t('club.card')}
            </Txt>
            <Txt variant="title" style={{ fontSize: 34, lineHeight: 36 }}>
              {level.tier.name}
            </Txt>
          </View>
          <Text style={{ fontFamily: 'PinyonScript_400Regular', fontSize: 30, lineHeight: 40, color: theme.c.ink, paddingHorizontal: 6 }}>Blanche</Text>
        </View>
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Txt variant="mega" style={{ fontSize: big ? 60 : 52, lineHeight: big ? 58 : 50 }}>
                {num(shown)}
              </Txt>
              <Txt variant="smallStrong">{t('club.points')}</Txt>
            </View>
            <Txt variant="caption" color={theme.c.inkSoft} style={{ marginBottom: 6 }}>{`${MEMBER.firstName} ${MEMBER.lastName}`}</Txt>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(20,17,20,0.12)', overflow: 'hidden' }}>
            <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 4, backgroundColor: theme.c.ink }} />
          </View>
          <Txt variant="small" color={theme.c.inkSoft} numberOfLines={1}>
            {level.next
              ? t('club.toNext', { n: num(level.next.from - points), tier: level.next.name })
              : next
                ? t('club.toReward', { n: num(next.points - points) })
                : t('club.top')}
          </Txt>
        </View>
      </View>
    </View>
  );
}
