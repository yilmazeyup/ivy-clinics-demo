import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

import { SHADES } from '@/data';

import { nativeDriver, prefersReducedMotion } from './Motion';

const COLORS = [SHADES.cherry.ink, SHADES.lilac.ink, '#F2A93B', '#FF8DC0', '#141114', SHADES.cherry.soft];

/** Little strips of foil in the studio's colours burst up from the middle and flutter down: a booking made. */
export function Confetti({ count = 34, origin = 0.32 }: { count?: number; origin?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useRef(
    Array.from({ length: count }, (_, i) => ({
      t: new Animated.Value(0),
      dx: (Math.sin(i * 12.9898) * 0.5 + (i % 2 ? 0.25 : -0.25)) * width * 0.9,
      up: 120 + ((i * 37) % 160),
      fall: height * (0.35 + ((i * 53) % 40) / 100),
      spin: ((i * 71) % 720) - 360,
      color: COLORS[i % COLORS.length],
      w: 7 + (i % 3) * 3,
      h: 12 + ((i * 7) % 4) * 3,
      delay: (i % 6) * 40,
    })),
  ).current;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    Animated.parallel(
      pieces.map((p) => Animated.timing(p.t, { toValue: 1, duration: 1900, delay: p.delay, easing: Easing.out(Easing.quad), useNativeDriver: nativeDriver })),
    ).start();
  }, [pieces]);

  if (prefersReducedMotion()) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 30 }]}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: width / 2 - p.w / 2,
            top: height * origin,
            width: p.w,
            height: p.h,
            borderRadius: 3,
            backgroundColor: p.color,
            opacity: p.t.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: p.t.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
              { translateY: p.t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, -p.up, p.fall] }) },
              { rotate: p.t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
