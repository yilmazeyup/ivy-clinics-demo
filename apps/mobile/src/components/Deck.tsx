import type { PhotoKey } from '@pure-clinics/shared';
import * as Haptics from 'expo-haptics';
import { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, View } from 'react-native';

import { startEdge } from '@/layout';
import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { Photo } from './Photo';
import { Txt } from './Txt';

type Props = {
  photos: PhotoKey[];
  width: number;
  /** Width ÷ height of the photos; the clinic's before-and-after pictures are 800 × 434. */
  ratio?: number;
  label?: (photo: PhotoKey) => string | undefined;
  nextLabel: string;
};

/**
 * Before-and-after photos as a deck of prints: flick the top one aside and it slips under the pile,
 * while the next one rises to the top. The arrow does the same for those who would rather tap.
 */
export function Deck({ photos, width, ratio = 800 / 434, label, nextLabel }: Props) {
  const theme = useTheme();
  const [order, setOrder] = useState(() => photos.map((_, i) => i));
  const pan = useRef(new Animated.ValueXY()).current;
  const height = Math.round(width / ratio);
  const behind = Math.min(2, photos.length - 1);

  const send = (direction: number) => {
    Haptics.selectionAsync().catch(() => {});
    Animated.timing(pan, { toValue: { x: direction * width * 1.25, y: 30 }, duration: 260, useNativeDriver: false }).start(() => {
      setOrder((o) => [...o.slice(1), o[0]]);
      pan.setValue({ x: 0, y: 0 });
    });
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => pan.setValue({ x: g.dx, y: g.dy * 0.25 }),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > width * 0.25 || Math.abs(g.vx) > 0.7) send(Math.sign(g.dx) || 1);
          else Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, tension: 80, useNativeDriver: false }).start();
        },
      }),
    // `send` only reads refs and the width.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pan, width],
  );

  if (!photos.length) return null;
  // How far the top print has travelled, 0 to 1; the prints underneath move up as it leaves.
  const away = pan.x.interpolate({ inputRange: [-width, 0, width], outputRange: [1, 0, 1], extrapolate: 'clamp' });
  const top = order[0];

  return (
    <View style={{ gap: 14 }}>
      <View style={{ width, height: height + behind * 12, alignSelf: 'center' }}>
        {order
          .slice(0, behind + 1)
          .map((photoIndex, depth) => ({ photoIndex, depth }))
          .reverse()
          .map(({ photoIndex, depth }) => {
            const photo = photos[photoIndex];
            const isTop = depth === 0;
            const lift = (d: number) => d * 12;
            const style = isTop
              ? {
                  transform: [
                    { translateX: pan.x },
                    { translateY: pan.y },
                    { rotate: pan.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-9deg', '0deg', '9deg'] }) },
                  ],
                }
              : {
                  transform: [
                    { translateY: away.interpolate({ inputRange: [0, 1], outputRange: [lift(depth), lift(depth - 1)] }) },
                    { scale: away.interpolate({ inputRange: [0, 1], outputRange: [1 - depth * 0.05, 1 - (depth - 1) * 0.05] }) },
                  ],
                  opacity: away.interpolate({ inputRange: [0, 1], outputRange: [1 - depth * 0.25, 1 - (depth - 1) * 0.25] }),
                };
            const caption = label?.(photo);
            return (
              <Animated.View
                key={photo}
                {...(isTop ? responder.panHandlers : {})}
                style={[
                  {
                    position: 'absolute',
                    top: 0,
                    width,
                    height,
                    borderRadius: theme.r.photo,
                    backgroundColor: theme.c.surface,
                    boxShadow: isTop ? theme.shadow.lift : theme.shadow.card,
                  },
                  style,
                ]}
              >
                <Photo photo={photo} style={{ flex: 1, borderRadius: theme.r.photo }} />
                {caption && isTop ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 12,
                      ...startEdge(theme.rtl, 12),
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: 'rgba(30, 30, 28, 0.72)',
                    }}
                  >
                    <Txt variant="caption" color="#FFFFFF" style={{ fontFamily: theme.f.medium }}>
                      {caption}
                    </Txt>
                  </View>
                ) : null}
              </Animated.View>
            );
          })}
      </View>
      {photos.length > 1 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt variant="small" color={theme.c.muted}>
            {`${top + 1} / ${photos.length}`}
          </Txt>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={nextLabel}
            onPress={() => send(theme.rtl ? -1 : 1)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              height: 38,
              paddingHorizontal: 14,
              borderRadius: theme.r.control,
              backgroundColor: theme.c.surface,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Txt variant="smallStrong">{nextLabel}</Txt>
            <Icon name="arrow" size={16} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
