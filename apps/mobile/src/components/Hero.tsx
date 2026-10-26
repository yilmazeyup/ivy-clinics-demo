import type { PhotoKey } from '@pure-clinics/shared';
import { Image, type ImageContentPosition } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback, useEffect, useRef, type PropsWithChildren } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewInstance, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { PHOTOS } from '@/photos';
import { useTheme } from '@/theme';

import { useMorph } from './Morph';
import { nativeDriver, prefersReducedMotion } from './Motion';
import { useScrollY } from './Screen';

/** The light of the day, from early morning to night; the home screen takes its colour from it. */
export type SkyPhase = 'dawn' | 'day' | 'dusk' | 'night';

export function skyPhase(date: Date): SkyPhase {
  const h = date.getHours() + date.getMinutes() / 60;
  if (h >= 5 && h < 11) return 'dawn';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 21.5) return 'dusk';
  return 'night';
}

// Each phase tints the photo the way the sky outside would: golden at dawn, clear by day, rosy at dusk, deep blue at night.
const SKY: Record<SkyPhase, { top: string; topAlpha: number; bottom: string; bottomAlpha: number; light: string; lightAlpha: number }> = {
  dawn: { top: '#E9A86A', topAlpha: 0.42, bottom: '#2A1A0E', bottomAlpha: 0.72, light: '#FFD9A8', lightAlpha: 0.5 },
  day: { top: '#FFF6EA', topAlpha: 0.1, bottom: '#1E160F', bottomAlpha: 0.64, light: '#FFFFFF', lightAlpha: 0.28 },
  dusk: { top: '#7C4C68', topAlpha: 0.5, bottom: '#26121D', bottomAlpha: 0.76, light: '#F3A88E', lightAlpha: 0.38 },
  night: { top: '#101629', topAlpha: 0.66, bottom: '#07080F', bottomAlpha: 0.84, light: '#8FA3D6', lightAlpha: 0.22 },
};

/** The sky's tint over a photo, with a soft light that slowly breathes from the top corner. */
export function SkyShade({ phase }: { phase: SkyPhase }) {
  const theme = useTheme();
  const sky = SKY[phase];
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
        Animated.timing(breath, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);
  // The light falls from the start corner, so it moves to the other side in Arabic.
  const fromX = theme.rtl ? '0' : '1';
  const toX = theme.rtl ? '1' : '0';
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`sky-${phase}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky.top} stopOpacity={sky.topAlpha} />
            <Stop offset="0.42" stopColor={sky.top} stopOpacity={sky.topAlpha * 0.25} />
            <Stop offset="1" stopColor={sky.bottom} stopOpacity={sky.bottomAlpha} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill={`url(#sky-${phase})`} />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }]}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={`light-${phase}`} x1={fromX} y1="0" x2={toX} y2="0.7">
              <Stop offset="0" stopColor={sky.light} stopOpacity={sky.lightAlpha} />
              <Stop offset="0.55" stopColor={sky.light} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill={`url(#light-${phase})`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** White clock and battery icons while the photo at the top of the page is under them; dark again once it has scrolled away. */
export function useLightStatusBar(photoHeight: number) {
  const scrollY = useScrollY();
  useFocusEffect(
    useCallback(() => {
      let light = true;
      setStatusBarStyle('light');
      const id = scrollY.addListener(({ value }) => {
        const next = value < photoHeight - 70;
        if (next !== light) {
          light = next;
          setStatusBarStyle(next ? 'light' : 'dark');
        }
      });
      return () => {
        scrollY.removeListener(id);
        setStatusBarStyle('dark');
      };
    }, [scrollY, photoHeight]),
  );
}

type ParallaxProps = PropsWithChildren<{
  photo: PhotoKey;
  height: number;
  position?: ImageContentPosition;
  /** Catches a photo flying in from the card that opened this page. */
  morph?: boolean;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * A header photo that scrolls at half the speed of the page, so it seems to lie further away,
 * and stretches when the page is pulled down past the top.
 */
export function ParallaxPhoto({ photo, height, position = 'center', morph, radius = 0, style, children }: ParallaxProps) {
  const theme = useTheme();
  const scrollY = useScrollY();
  const { land, airborne } = useMorph();
  const ref = useRef<ViewInstance>(null);
  const hidden = morph && airborne === photo;
  return (
    <View
      ref={ref}
      collapsable={false}
      onLayout={
        morph
          ? () => ref.current?.measureInWindow((x, y, width, h) => land(photo, { x, y, width, height: h }, radius))
          : undefined
      }
      style={[{ height, overflow: 'hidden', borderRadius: radius, backgroundColor: theme.c.sand }, style]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: hidden ? 0 : 1,
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [-height, 0, height],
                  outputRange: [-height / 2, 0, height * 0.5],
                  extrapolateRight: 'clamp',
                }),
              },
              { scale: scrollY.interpolate({ inputRange: [-height, 0, 1], outputRange: [2, 1, 1], extrapolateRight: 'clamp' }) },
            ],
          },
        ]}
      >
        <Image source={PHOTOS[photo]} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={position} transition={0} />
      </Animated.View>
      {children}
    </View>
  );
}
