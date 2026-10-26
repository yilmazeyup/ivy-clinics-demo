import type { PhotoKey, Texture } from '@pure-clinics/shared';
import { Image, type ImageContentPosition } from 'expo-image';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { PHOTOS } from '@/photos';
import { useTheme } from '@/theme';

type Props = PropsWithChildren<{
  photo: PhotoKey;
  style?: StyleProp<ViewStyle>;
  /** Darkens the lower part so white text on top stays readable. */
  scrim?: boolean;
  /** Focal point, e.g. "top" or { top: '30%', left: '50%' }. */
  position?: ImageContentPosition;
  /** A close-up instead of the whole photo, e.g. one swatch of a texture shot. */
  zoom?: number;
  focus?: { x: number; y: number };
}>;

export function Photo({ photo, style, scrim, position = 'center', zoom = 1, focus = { x: 0.5, y: 0.5 }, children }: Props) {
  const theme = useTheme();
  // Zooming renders the image larger than the frame and shifts it so the focus point stays in view.
  const crop =
    zoom > 1
      ? {
          position: 'absolute' as const,
          width: `${zoom * 100}%` as const,
          height: `${zoom * 100}%` as const,
          left: `${-(zoom - 1) * focus.x * 100}%` as const,
          top: `${-(zoom - 1) * focus.y * 100}%` as const,
        }
      : StyleSheet.absoluteFill;
  return (
    <View style={[styles.frame, { backgroundColor: theme.c.sand }, style]}>
      <Image source={PHOTOS[photo]} style={crop} contentFit="cover" contentPosition={position} transition={200} />
      {scrim ? (
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none" pointerEvents="none">
          <Defs>
            <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.32" stopColor="#141414" stopOpacity={0} />
              <Stop offset="1" stopColor="#141414" stopOpacity={0.66} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill="url(#scrim)" />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

/** A product shown as a close-up of its texture. */
export function TexturePhoto({ texture, style, children }: PropsWithChildren<{ texture: Texture; style?: StyleProp<ViewStyle> }>) {
  return (
    <Photo photo={texture.photo} zoom={texture.zoom} focus={texture} style={style}>
      {children}
    </Photo>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
});
