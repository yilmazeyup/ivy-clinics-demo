import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme';

import { nativeDriver, prefersReducedMotion, useCountUp } from './Motion';
import { Txt } from './Txt';

/** A slice of the ring from one angle to another, clockwise, with 0 at the top. */
function arc(c: number, r: number, from: number, to: number) {
  const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const x0 = c + r * Math.cos(rad(from));
  const y0 = c + r * Math.sin(rad(from));
  const x1 = c + r * Math.cos(rad(to));
  const y1 = c + r * Math.sin(rad(to));
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/**
 * A treatment series as a ring of sessions: the ones behind you fill in one after another, and the next one
 * glows gold. The number in the middle is the session you are about to plan, or how many are done.
 */
export function SessionRing({
  done,
  total,
  size = 112,
  caption,
  show = 'next',
}: {
  done: number;
  total: number;
  size?: number;
  caption: string;
  /** The number in the middle: the session to plan next, or the ones already done. */
  show?: 'next' | 'done';
}) {
  const theme = useTheme();
  const filled = useCountUp(done, { duration: 1300, delay: 350 });
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
        Animated.timing(glow, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const stroke = 6;
  const c = size / 2;
  const r = c - stroke;
  const gap = total > 1 ? 9 : 0;
  const span = 360 / total;
  const slice = (i: number) => [i * span + gap / 2, (i + 1) * span - gap / 2] as const;

  return (
    <View style={{ width: size, height: size }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: done }}>
      <Svg width={size} height={size}>
        {Array.from({ length: total }, (_, i) => {
          const [a, b] = slice(i);
          return (
            <Path key={`base-${i}`} d={arc(c, r, a, b)} stroke={theme.c.line} strokeWidth={stroke} strokeLinecap="round" fill="none" />
          );
        })}
        {Array.from({ length: total }, (_, i) => {
          const [a, b] = slice(i);
          const part = Math.max(0, Math.min(1, filled - i));
          if (part <= 0.01) return null;
          return <Path key={`done-${i}`} d={arc(c, r, a, a + (b - a) * part)} stroke={theme.c.ink} strokeWidth={stroke} strokeLinecap="round" fill="none" />;
        })}
      </Svg>
      {done < total ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }]}>
          <Svg width={size} height={size}>
            <Path d={arc(c, r, slice(done)[0], slice(done)[1])} stroke={theme.c.gold} strokeWidth={stroke} strokeLinecap="round" fill="none" />
          </Svg>
        </Animated.View>
      ) : null}
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Txt variant="display" style={{ fontSize: size * 0.34, lineHeight: size * 0.36 }}>
          {String(show === 'done' ? done : Math.min(done + 1, total))}
        </Txt>
        <Txt variant="caption" color={theme.c.muted}>
          {caption}
        </Txt>
      </View>
    </View>
  );
}
