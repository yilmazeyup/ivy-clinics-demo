import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import type { PolishShade } from '@/data';

import { nativeDriver } from './Motion';
import { Photo } from './Photo';

// The nails on the hand photo ('nails-hand', 752 × 1200), traced in the coordinates of a 600 × 957 copy. Each nail has its
// outline, the middle of its free edge (tip) and of its cuticle (base), and how much of it shows (the thumb is out of focus).
type Nail = { outline: [number, number][]; tip: [number, number]; base: [number, number]; width: number; strength: number };

const NAILS: Nail[] = [
  {
    outline: [
      [94, 617],
      [99, 606],
      [110, 602],
      [121, 606],
      [125, 618],
      [136, 668],
      [137, 681],
      [131, 689],
      [117, 691],
      [104, 688],
      [99, 676],
    ],
    tip: [110, 604],
    base: [119, 689],
    width: 26,
    strength: 1,
  },
  {
    outline: [
      [138, 522],
      [144, 512],
      [158, 508],
      [173, 510],
      [182, 518],
      [212, 571],
      [219, 588],
      [214, 600],
      [200, 606],
      [186, 604],
      [175, 596],
      [146, 545],
    ],
    tip: [160, 509],
    base: [202, 603],
    width: 36,
    strength: 1,
  },
  {
    outline: [
      [218, 513],
      [226, 500],
      [240, 491],
      [255, 489],
      [265, 496],
      [305, 555],
      [312, 573],
      [306, 585],
      [290, 592],
      [274, 591],
      [262, 584],
    ],
    tip: [243, 491],
    base: [290, 590],
    width: 42,
    strength: 1,
  },
  {
    outline: [
      [390, 520],
      [398, 505],
      [413, 499],
      [428, 500],
      [441, 510],
      [462, 543],
      [470, 562],
      [466, 575],
      [452, 584],
      [433, 584],
      [418, 577],
      [400, 553],
    ],
    tip: [414, 500],
    base: [445, 583],
    width: 40,
    strength: 1,
  },
  {
    outline: [
      [456, 452],
      [463, 445],
      [472, 447],
      [482, 462],
      [497, 495],
      [500, 512],
      [494, 522],
      [484, 519],
      [474, 502],
      [462, 474],
    ],
    tip: [467, 446],
    base: [492, 520],
    width: 28,
    strength: 0.7,
  },
];

/** A closed outline through the points, smoothed with Catmull-Rom curves so the nail has soft, rounded corners. */
function smooth(points: [number, number][]): string {
  const n = points.length;
  const p = (i: number) => points[(i + n) % n];
  let d = `M${p(0)[0]},${p(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = p(i - 1);
    const [x1, y1] = p(i);
    const [x2, y2] = p(i + 1);
    const [x3, y3] = p(i + 2);
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6];
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${x2},${y2}`;
  }
  return `${d} Z`;
}

/** A thin streak of light along the nail, a little to one side, the way gel catches a window. */
function highlight(nail: Nail, offset: number, thickness: number, from = 0.16, to = 0.68): string {
  const [tx, ty] = nail.tip;
  const [bx, by] = nail.base;
  const len = Math.hypot(bx - tx, by - ty);
  const u = [(bx - tx) / len, (by - ty) / len];
  const nrm = [-u[1], u[0]];
  const at = (s: number, side: number) => [tx + u[0] * len * s + nrm[0] * nail.width * side, ty + u[1] * len * s + nrm[1] * nail.width * side];
  const a = at(from, offset - thickness);
  const b = at(from, offset + thickness);
  const c = at(to, offset + thickness * 0.6);
  const e = at(to, offset - thickness * 0.6);
  return smooth([a, b, c, e].map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as [number, number]));
}

const PATHS = NAILS.map((nail) => ({ nail, d: smooth(nail.outline), gloss: highlight(nail, -0.22, 0.07), soft: highlight(nail, 0.2, 0.05, 0.3, 0.6) }));

/** Darker by a share, for the edge of a nail. */
function shadeOf(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  return `rgb(${ch(n >> 16)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
}

function Layer({ shade, style }: { shade: PolishShade; style?: StyleProp<ViewStyle> }) {
  const milky = shade.finish === 'milky';
  const chrome = shade.finish === 'chrome';
  const body = milky ? 0.72 : chrome ? 0.8 : 0.9;
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {/* The colour itself, multiplied into the photo so the nail keeps its own light and shade. */}
      <View style={[StyleSheet.absoluteFill, { mixBlendMode: 'multiply' }]}>
        <Svg width="100%" height="100%" viewBox="0 0 600 957" preserveAspectRatio="xMidYMid slice">
          {PATHS.map(({ nail, d }, i) => (
            <Path key={i} d={d} fill={shade.hex} opacity={0.55 * nail.strength} />
          ))}
        </Svg>
      </View>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 600 957" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="chrome" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
            <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.05} />
            <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.1} />
          </LinearGradient>
        </Defs>
        {PATHS.map(({ nail, d, gloss, soft }, i) => (
          <Path key={`c${i}`} d={d} fill={shade.hex} opacity={body * nail.strength} stroke={shadeOf(shade.hex, 0.35)} strokeOpacity={0.35} strokeWidth={1} />
        ))}
        {chrome ? PATHS.map(({ d }, i) => <Path key={`m${i}`} d={d} fill="url(#chrome)" opacity={0.75} />) : null}
        {PATHS.map(({ nail, gloss, soft }, i) => (
          <Path key={`g${i}`} d={gloss} fill="#FFFFFF" opacity={(chrome ? 0.7 : 0.5) * nail.strength} />
        ))}
        {PATHS.map(({ nail, soft }, i) => (
          <Path key={`s${i}`} d={soft} fill="#FFFFFF" opacity={0.18 * nail.strength} />
        ))}
      </Svg>
    </View>
  );
}

/**
 * The shade studio's hand: a real photo with each nail painted in the chosen gel colour. A new colour is brushed on
 * over the old one with a quick fade, so you see the change happen.
 */
export function TryOnHand({ shade, previous, style }: { shade: PolishShade | null; previous: PolishShade | null; style?: StyleProp<ViewStyle> }) {
  const fade = useRef(new Animated.Value(1)).current;
  // The colour goes on once the hand is there, never floating on an empty frame.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 340, useNativeDriver: nativeDriver }).start();
  }, [shade, fade, loaded]);
  return (
    <Photo photo="nails-hand" style={style} onLoad={() => setLoaded(true)}>
      {previous && loaded ? <Layer shade={previous} /> : null}
      {shade && loaded ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} pointerEvents="none">
          <Layer shade={shade} />
        </Animated.View>
      ) : null}
    </Photo>
  );
}
