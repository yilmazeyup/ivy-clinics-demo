import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useI18n } from '@/i18n';
import { PHOTOS } from '@/photos';
import { useTheme } from '@/theme';

import { Glass } from './Glass';
import { EASE_OUT, prefersReducedMotion, useCountUp } from './Motion';
import { Txt } from './Txt';

// Landmarks on the sample face (pc-eyes), in percent of the square photo.
const P = {
  foreheadL: [33, 13],
  forehead: [50, 10],
  foreheadR: [67, 13],
  templeL: [13, 30],
  templeR: [88, 30],
  browLo: [17, 24],
  browLi: [36, 25],
  browRi: [63, 25],
  browRo: [84, 26],
  eyeLo: [19, 36],
  eyeLt: [29, 33],
  eyeLi: [37, 39],
  eyeLb: [29, 41],
  eyeRi: [61, 39],
  eyeRt: [70, 33],
  eyeRo: [82, 37],
  eyeRb: [70, 41],
  bridge: [50, 40],
  tip: [50, 62],
  nostrilL: [40, 64],
  nostrilR: [60, 64],
  cheekboneL: [18, 47],
  cheekboneR: [83, 47],
  cheekL: [26, 57],
  cheekR: [75, 57],
  jawL: [15, 68],
  jawR: [87, 68],
  mouthL: [32, 80],
  lipTop: [50, 76],
  mouthR: [66, 80],
  lipBottom: [50, 86],
  jawLowL: [27, 89],
  chin: [50, 96],
  jawLowR: [74, 89],
} as const;
type Point = keyof typeof P;

const MESH: [Point, Point][] = [
  ['foreheadL', 'forehead'], ['forehead', 'foreheadR'], ['templeL', 'foreheadL'], ['foreheadR', 'templeR'],
  ['foreheadL', 'browLi'], ['foreheadR', 'browRi'], ['forehead', 'bridge'],
  ['browLo', 'browLi'], ['browRi', 'browRo'], ['templeL', 'browLo'], ['browRo', 'templeR'],
  ['eyeLo', 'eyeLt'], ['eyeLt', 'eyeLi'], ['eyeLi', 'eyeLb'], ['eyeLb', 'eyeLo'],
  ['eyeRi', 'eyeRt'], ['eyeRt', 'eyeRo'], ['eyeRo', 'eyeRb'], ['eyeRb', 'eyeRi'],
  ['browLi', 'bridge'], ['bridge', 'browRi'], ['eyeLi', 'bridge'], ['bridge', 'eyeRi'],
  ['bridge', 'tip'], ['tip', 'nostrilL'], ['tip', 'nostrilR'], ['eyeLi', 'nostrilL'], ['eyeRi', 'nostrilR'],
  ['eyeLo', 'cheekboneL'], ['eyeRo', 'cheekboneR'], ['cheekboneL', 'cheekL'], ['cheekboneR', 'cheekR'],
  ['cheekL', 'nostrilL'], ['cheekR', 'nostrilR'], ['templeL', 'cheekboneL'], ['templeR', 'cheekboneR'],
  ['cheekboneL', 'jawL'], ['cheekboneR', 'jawR'], ['cheekL', 'mouthL'], ['cheekR', 'mouthR'],
  ['nostrilL', 'lipTop'], ['nostrilR', 'lipTop'], ['mouthL', 'lipTop'], ['lipTop', 'mouthR'], ['mouthL', 'lipBottom'], ['lipBottom', 'mouthR'],
  ['jawL', 'jawLowL'], ['jawLowL', 'chin'], ['chin', 'jawLowR'], ['jawLowR', 'jawR'], ['mouthL', 'jawLowL'], ['mouthR', 'jawLowR'], ['lipBottom', 'chin'],
];

/** What the scan "finds" on the sample photo, with the place on the face each note points to. */
const FINDINGS: { at: Point; metric: 'hydration' | 'tone' | 'calm' | 'pores' | 'texture'; note: 'pigment' | 'pores' | 'redness' | 'texture' | null; value?: number }[] = [
  { at: 'forehead', metric: 'pores', note: 'pores' },
  { at: 'cheekL', metric: 'hydration', note: null, value: 72 },
  { at: 'bridge', metric: 'tone', note: 'pigment' },
  { at: 'cheekR', metric: 'calm', note: 'redness' },
  { at: 'chin', metric: 'texture', note: 'texture' },
];

/** The scores the demo scan gives the sample photo, 0–100, higher is better. */
export const SCAN_SCORES = { hydration: 72, tone: 64, calm: 82, pores: 58, texture: 81 } as const;
export const SCAN_TOTAL = 71;

type Props = { width: number; height: number; /** Loops quietly, without notes, as a preview on the home screen. */ preview?: boolean; onDone?: () => void };

/**
 * An AI skin scan, shown on a sample photo: a band of gold light sweeps down the face, a fine mesh of the face's
 * landmarks is drawn in behind it, and notes about hydration, pores, pigment, redness and texture appear where they apply.
 */
export function SkinScan({ width, height, preview, onDone }: Props) {
  const theme = useTheme();
  const { t } = useI18n();
  const beam = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (prefersReducedMotion()) {
      beam.setValue(1);
      setShown(FINDINGS.length);
      done.current?.();
      return;
    }
    const sweep = Animated.timing(beam, { toValue: 1, duration: preview ? 2600 : 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: false });
    if (preview) {
      const loop = Animated.loop(Animated.sequence([sweep, Animated.delay(900), Animated.timing(beam, { toValue: 0, duration: 0, useNativeDriver: false })]));
      loop.start();
      return () => loop.stop();
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    sweep.start(() => {
      FINDINGS.forEach((_, i) => timers.push(setTimeout(() => setShown(i + 1), 260 * i)));
      timers.push(setTimeout(() => done.current?.(), 260 * FINDINGS.length + 700));
    });
    return () => {
      sweep.stop();
      timers.forEach(clearTimeout);
    };
  }, [beam, preview]);

  // The square photo fills the frame like `cover`: it is scaled to the larger side and centred.
  const side = Math.max(width, height);
  const dx = (width - side) / 2;
  const dy = (height - side) / 2;
  const at = (p: Point) => ({ x: dx + (P[p][0] / 100) * side, y: dy + (P[p][1] / 100) * side });
  const beamY = beam.interpolate({ inputRange: [0, 1], outputRange: [-60, height] });
  const revealed = beam.interpolate({ inputRange: [0, 1], outputRange: [0, height + 60], extrapolate: 'clamp' });

  return (
    <View style={{ width, height, borderRadius: theme.r.photo, overflow: 'hidden', backgroundColor: theme.c.sand }}>
      <Image source={PHOTOS['pc-eyes']} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20, 16, 12, 0.12)' }]} />

      {/* The mesh is drawn in as the light passes over it. */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: revealed, overflow: 'hidden' }}>
        <Svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <G stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={0.22}>
            {MESH.map(([a, b]) => (
              <Line key={`${a}-${b}`} x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]} />
            ))}
          </G>
          {/* Small crosses mark the landmarks. */}
          <G stroke={theme.c.gold} strokeWidth={0.35} strokeOpacity={0.95}>
            {(Object.keys(P) as Point[]).map((k) => (
              <Path key={k} d={`M ${P[k][0] - 0.9} ${P[k][1]} H ${P[k][0] + 0.9} M ${P[k][0]} ${P[k][1] - 0.9} V ${P[k][1] + 0.9}`} />
            ))}
          </G>
        </Svg>
      </Animated.View>

      {/* The band of light: a glow trailing a bright line. */}
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, height: 60, transform: [{ translateY: beamY }] }}>
        <Svg width={width} height={60} viewBox="0 0 100 60" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="scanGlow" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.c.gold} stopOpacity={0} />
              <Stop offset="1" stopColor={theme.c.gold} stopOpacity={0.42} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={58} fill="url(#scanGlow)" />
          <Rect x={0} y={58} width={100} height={2} fill="#FFE7B8" />
        </Svg>
      </Animated.View>

      {preview
        ? null
        : FINDINGS.slice(0, shown).map((f) => {
            const point = at(f.at);
            const chipWidth = 132;
            const left = Math.max(8, Math.min(width - chipWidth - 8, point.x - chipWidth / 2));
            const label = f.value != null ? `${t(`clinic.scan.m.${f.metric}`)} · ${f.value}%` : `${t(`clinic.scan.m.${f.metric}`)} · ${t(`clinic.scan.f.${f.note ?? 'texture'}`)}`;
            return <Finding key={f.at} left={left} top={Math.max(8, Math.min(height - 40, point.y - 16))} width={chipWidth} label={label} />;
          })}
    </View>
  );
}

function Finding({ left, top, width, label }: { left: number; top: number; width: number; label: string }) {
  const theme = useTheme();
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, speed: 14, bounciness: 9, useNativeDriver: false }).start();
  }, [pop]);
  return (
    <Animated.View style={{ position: 'absolute', left, top, width, opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
      <Glass style={{ borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, alignSelf: 'center' }}>
        <Txt variant="caption" numberOfLines={1} style={{ fontFamily: theme.f.medium, fontSize: 11 }}>
          {label}
        </Txt>
      </Glass>
    </Animated.View>
  );
}

/** The outcome of the scan as an overall score and five bars that fill up. */
export function ScanResult() {
  const theme = useTheme();
  const { t } = useI18n();
  const total = useCountUp(SCAN_TOTAL, { duration: 1500 });
  const metrics = Object.entries(SCAN_SCORES) as [keyof typeof SCAN_SCORES, number][];
  return (
    <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 18, gap: 16, boxShadow: theme.shadow.card }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ gap: 4 }}>
          <Txt variant="eyebrow" color={theme.c.muted}>
            {t('clinic.scan.score')}
          </Txt>
          <Txt variant="small" color={theme.c.muted}>
            {t('clinic.scan.sample')}
          </Txt>
        </View>
        <Txt variant="hero" style={{ fontSize: 56, lineHeight: 58 }}>
          {String(Math.round(total))}
        </Txt>
      </View>
      {metrics.map(([key, value], index) => (
        <Bar key={key} label={t(`clinic.scan.m.${key}`)} value={value} delay={200 + index * 120} />
      ))}
    </View>
  );
}

function Bar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const theme = useTheme();
  const fill = useRef(new Animated.Value(prefersReducedMotion() ? 1 : 0)).current;
  const shown = useCountUp(value, { duration: 1100, delay });
  useEffect(() => {
    Animated.timing(fill, { toValue: 1, duration: 1100, delay, easing: EASE_OUT, useNativeDriver: false }).start();
  }, [fill, delay]);
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt variant="smallStrong">{label}</Txt>
        <Txt variant="small" color={theme.c.muted}>
          {String(Math.round(shown))}
        </Txt>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.c.line, overflow: 'hidden' }}>
        <Animated.View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: value >= 75 ? theme.c.ink : value >= 60 ? theme.c.highlight : theme.c.gold,
            width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${value}%`] }),
          }}
        />
      </View>
    </View>
  );
}
