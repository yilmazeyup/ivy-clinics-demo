import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { SHADES } from '@/data';
import { useI18n } from '@/i18n';

import { EASE, nativeDriver, prefersReducedMotion } from './Motion';
import { Txt } from './Txt';

const SCRIPT = 76;

/**
 * The opening: on a white page "Blanche" is written out from left to right as if with a brush, BEAUTY rises letter by
 * letter beneath it, and then three bands of polish (cherry, lilac, honey) sweep up over the page and lift away to
 * show the app. About two and a half seconds; a tap skips it.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
  const write = useRef(new Animated.Value(0)).current;
  const letters = useRef('BEAUTY'.split('').map(() => new Animated.Value(0))).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const bands = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const out = useRef(new Animated.Value(0)).current;
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    if (prefersReducedMotion()) {
      const id = setTimeout(finish, 600);
      return () => clearTimeout(id);
    }
    const sequence = Animated.sequence([
      Animated.delay(150),
      Animated.timing(write, { toValue: 1, duration: 1050, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.stagger(
        55,
        letters.map((v) => Animated.spring(v, { toValue: 1, stiffness: 260, damping: 14, useNativeDriver: nativeDriver })),
      ),
      Animated.timing(tagline, { toValue: 1, duration: 320, easing: EASE, useNativeDriver: nativeDriver }),
      Animated.delay(380),
      Animated.stagger(
        90,
        bands.map((v) => Animated.timing(v, { toValue: 1, duration: 520, easing: Easing.bezier(0.7, 0, 0.2, 1), useNativeDriver: nativeDriver })),
      ),
      Animated.timing(out, { toValue: 1, duration: 520, easing: Easing.bezier(0.7, 0, 0.2, 1), useNativeDriver: nativeDriver }),
    ]);
    sequence.start(({ finished }) => finished && finish());
    return () => sequence.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colors = [SHADES.cherry.ink, SHADES.lilac.ink, SHADES.honey.ink];
  // The written word is revealed by a window that widens; the script itself never moves.
  const scriptWidth = Math.min(width - 40, SCRIPT * 4.6);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { zIndex: 100, overflow: 'hidden', transform: [{ translateY: out.interpolate({ inputRange: [0, 1], outputRange: [0, -height] }) }] },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Blanche Beauty"
        onPress={finish}
        style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }]}
      >
        <View style={{ alignItems: 'center', direction: 'ltr' }}>
          <View style={{ width: scriptWidth, height: SCRIPT * 1.35 }}>
            <Animated.View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                overflow: 'hidden',
                width: write.interpolate({ inputRange: [0, 1], outputRange: [0, scriptWidth] }),
              }}
            >
              <Text
                style={{
                  width: scriptWidth,
                  textAlign: 'center',
                  fontFamily: 'PinyonScript_400Regular',
                  fontSize: SCRIPT,
                  lineHeight: SCRIPT * 1.35,
                  color: '#141114',
                }}
              >
                Blanche
              </Text>
            </Animated.View>
          </View>
          <View style={{ flexDirection: 'row', marginTop: -SCRIPT * 0.26, gap: 1 }}>
            {letters.map((v, i) => (
              <Animated.Text
                key={i}
                style={{
                  fontFamily: 'InstrumentSerif_400Regular',
                  fontSize: SCRIPT * 0.38,
                  lineHeight: SCRIPT * 0.44,
                  letterSpacing: 1.5,
                  color: '#141114',
                  opacity: v,
                  transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
                }}
              >
                {'BEAUTY'[i]}
              </Animated.Text>
            ))}
          </View>
          <Animated.View
            style={{ marginTop: 26, opacity: tagline, transform: [{ translateY: tagline.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}
          >
            <Txt variant="tag" color="#776F7E" align="center">
              {t('intro.tagline')}
            </Txt>
          </Animated.View>
        </View>
      </Pressable>
      {bands.map((v, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: (width / 3) * i - 1,
            width: width / 3 + 2,
            top: 0,
            height,
            backgroundColor: colors[i],
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }],
          }}
        />
      ))}
    </Animated.View>
  );
}
