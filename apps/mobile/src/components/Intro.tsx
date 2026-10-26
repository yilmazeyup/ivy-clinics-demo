import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useI18n } from '@/i18n';
import { PHOTOS } from '@/photos';
import { useTheme } from '@/theme';

import { EASE_OUT, nativeDriver } from './Motion';
import { LOGO_LETTERS, LOGO_RATIO, LOGO_VIEWBOX } from './PureLogo';
import { Txt } from './Txt';

/**
 * The opening of the app, like the first seconds of a film: Pure's own photo drifts into focus, the wordmark
 * rises letter by letter, a fine gold line draws out beneath it and the tagline settles; then the whole scene
 * lifts away to the home screen. About three seconds; a tap skips it, and it is left out with reduced motion.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  const { width: screen } = useWindowDimensions();
  const photo = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const letters = useRef(LOGO_LETTERS.map(() => new Animated.Value(0))).current;
  const line = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;
  const done = useRef(onDone);
  done.current = onDone;
  const leaving = useRef(false);

  const leave = (delay = 0) => {
    if (leaving.current) return;
    leaving.current = true;
    Animated.timing(exit, { toValue: 1, duration: 650, delay, easing: Easing.inOut(Easing.cubic), useNativeDriver: nativeDriver }).start(() =>
      done.current(),
    );
  };

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
        const ease = { easing: EASE_OUT, useNativeDriver: nativeDriver };
        Animated.parallel([
          Animated.timing(photo, { toValue: 1, duration: 1100, ...ease }),
          Animated.timing(drift, { toValue: 1, duration: 4200, easing: Easing.out(Easing.quad), useNativeDriver: nativeDriver }),
          Animated.stagger(
            55,
            letters.map((v) => Animated.timing(v, { toValue: 1, duration: 900, delay: 350, ...ease })),
          ),
          Animated.timing(line, { toValue: 1, duration: 900, delay: 1050, easing: Easing.inOut(Easing.cubic), useNativeDriver: nativeDriver }),
          Animated.timing(tagline, { toValue: 1, duration: 800, delay: 1450, ...ease }),
        ]).start(() => {
          if (!cancelled) leave(650);
        });
      });
    return () => {
      cancelled = true;
    };
    // The sequence runs once, when the app opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoWidth = Math.min(screen * 0.74, 400);
  const logoHeight = logoWidth * LOGO_RATIO;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 100,
          backgroundColor: '#15130F',
          opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
        },
      ]}
    >
      <Pressable accessibilityRole="button" accessibilityLabel="Pure Clinics" onPress={() => leave()} style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: photo, transform: [{ scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1.16, 1.02] }) }] },
          ]}
        >
          <Image source={PHOTOS['pc-intro']} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={{ left: '54%', top: '50%' }} />
        </Animated.View>
        {/* Warm shade over the photo, deepest at the bottom, so the white wordmark stays crisp. */}
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" pointerEvents="none">
          <Defs>
            <LinearGradient id="introShade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#15130F" stopOpacity={0.45} />
              <Stop offset="0.45" stopColor="#15130F" stopOpacity={0.28} />
              <Stop offset="1" stopColor="#15130F" stopOpacity={0.78} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill="url(#introShade)" />
        </Svg>

        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
          {/* The letters rise out of an invisible slot, like type set into place. */}
          <View style={{ width: logoWidth, height: logoHeight, direction: 'ltr', overflow: 'hidden' }}>
            {LOGO_LETTERS.map((d, index) => (
              <Animated.View
                key={d}
                style={[
                  StyleSheet.absoluteFill,
                  {
                    opacity: letters[index],
                    transform: [{ translateY: letters[index].interpolate({ inputRange: [0, 1], outputRange: [logoHeight * 0.9, 0] }) }],
                  },
                ]}
              >
                <Svg width={logoWidth} height={logoHeight} viewBox={LOGO_VIEWBOX}>
                  <Path d={d} fill="#FFFFFF" />
                </Svg>
              </Animated.View>
            ))}
          </View>
          {/* The gold line grows out from the middle, as on the clinic's own photos. */}
          <Animated.View
            style={{
              marginTop: logoHeight * 0.9,
              width: logoWidth,
              height: 1.5,
              backgroundColor: theme.c.gold,
              transform: [{ scaleX: line }],
            }}
          />
          <Animated.View
            style={{
              marginTop: 22,
              opacity: tagline,
              transform: [{ translateY: tagline.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            }}
          >
            <Txt variant="eyebrow" color="rgba(255, 255, 255, 0.86)" align="center" style={{ letterSpacing: theme.arabic ? 0 : 3 }}>
              {t('clinic.intro.tagline')}
            </Txt>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
