import { Image, type ImageContentPosition } from 'expo-image';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { BlanchePhoto } from '@/data';
import { PHOTOS } from '@/photos';
import { useTheme } from '@/theme';

type Props = PropsWithChildren<{
  photo: BlanchePhoto;
  style?: StyleProp<ViewStyle>;
  /** Darkens the lower part so white text on top stays readable. */
  scrim?: boolean | 'top';
  /** Focal point, e.g. "top" or { top: '30%', left: '50%' }. */
  position?: ImageContentPosition;
  /** Lays a wash of colour over the photo, e.g. a craft's shade. */
  tint?: string;
  onLoad?: () => void;
}>;

export function Photo({ photo, style, scrim, position = 'center', tint, onLoad, children }: Props) {
  const theme = useTheme();
  const top = scrim === 'top';
  return (
    <View style={[styles.frame, { backgroundColor: theme.c.chalk }, style]}>
      <Image source={PHOTOS[photo]} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={position} transition={220} onLoad={onLoad} />
      {tint ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} /> : null}
      {scrim ? (
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" pointerEvents="none">
          <Defs>
            <LinearGradient id={top ? 'scrimTop' : 'scrim'} x1="0" y1={top ? '1' : '0'} x2="0" y2={top ? '0' : '1'}>
              <Stop offset="0.4" stopColor="#120E14" stopOpacity={0} />
              <Stop offset="1" stopColor="#120E14" stopOpacity={0.62} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill={`url(#${top ? 'scrimTop' : 'scrim'})`} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
});
