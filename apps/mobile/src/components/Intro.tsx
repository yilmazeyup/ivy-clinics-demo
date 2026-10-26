import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';

import { useTheme } from '@/theme';

import { PureLogo } from './PureLogo';

/**
 * The opening moment of the app: the wordmark rises in on sand, a fine line draws out beneath it,
 * then the whole thing fades away to the first screen. About a second and a half; skipped with reduced motion.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const logo = useRef(new Animated.Value(0)).current;
  const line = useRef(new Animated.Value(0)).current;
  const cover = useRef(new Animated.Value(1)).current;
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          done.current();
          return;
        }
        Animated.sequence([
          Animated.parallel([
            Animated.timing(logo, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(line, { toValue: 1, duration: 700, delay: 250, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
          ]),
          Animated.delay(260),
          Animated.timing(cover, { toValue: 0, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]).start(() => {
          if (!cancelled) done.current();
        });
      });
    return () => {
      cancelled = true;
    };
  }, [logo, line, cover]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { zIndex: 100, backgroundColor: theme.c.bg, alignItems: 'center', justifyContent: 'center', opacity: cover }]}
    >
      <Animated.View style={{ opacity: logo, transform: [{ translateY: logo.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        <PureLogo width={210} />
      </Animated.View>
      {/* The line grows out from the middle. */}
      <Animated.View style={{ marginTop: 20, width: 120, height: 1, backgroundColor: theme.c.ink, transform: [{ scaleX: line }] }} />
    </Animated.View>
  );
}
