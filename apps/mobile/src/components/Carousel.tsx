import { useRef, type ReactNode } from 'react';
import { Animated, Platform, useWindowDimensions, type ViewStyle } from 'react-native';

import { useLayout } from '@/layout';
import { useTheme } from '@/theme';

import { nativeDriver } from './Motion';

type Props<T> = {
  items: T[];
  itemWidth: number;
  gap?: number;
  keyOf: (item: T) => string;
  render: (item: T, index: number) => ReactNode;
};

/**
 * A row of cards that snaps each one to the centre. The card in the middle is shown full size and bright;
 * its neighbours sit a little smaller and softer, as if further away, and come forward as they slide in.
 */
export function DepthCarousel<T>({ items, itemWidth, gap = 14, keyOf, render }: Props<T>) {
  const theme = useTheme();
  const { width: screen } = useWindowDimensions();
  const { wide } = useLayout();
  const x = useRef(new Animated.Value(0)).current;
  const step = itemWidth + gap;
  const side = Math.max(20, (screen - itemWidth) / 2);
  // A right-to-left row on the web counts its scroll position below zero; native rows keep their cards flat.
  const depth = !theme.rtl || Platform.OS === 'web';
  const offset = Animated.multiply(x, theme.rtl ? -1 : 1);
  const web = Platform.OS === 'web';

  if (wide) {
    // A computer screen shows the whole row at once, without depth.
    return (
      <Animated.View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
        {items.map((item, index) => (
          <Animated.View key={keyOf(item)} style={{ flexBasis: '22%', flexGrow: 1 }}>
            {render(item, index)}
          </Animated.View>
        ))}
      </Animated.View>
    );
  }

  return (
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={step}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: nativeDriver })}
      style={[{ marginHorizontal: -20 }, web ? ({ scrollSnapType: 'x mandatory' } as ViewStyle) : null]}
      contentContainerStyle={{ paddingHorizontal: side, gap, paddingVertical: 8 }}
    >
      {items.map((item, index) => {
        const input = [(index - 1) * step, index * step, (index + 1) * step];
        const scale = depth ? offset.interpolate({ inputRange: input, outputRange: [0.86, 1, 0.86], extrapolate: 'clamp' }) : 1;
        const opacity = depth ? offset.interpolate({ inputRange: input, outputRange: [0.55, 1, 0.55], extrapolate: 'clamp' }) : 1;
        return (
          <Animated.View
            key={keyOf(item)}
            style={[{ width: itemWidth, opacity, transform: [{ scale }] }, web ? ({ scrollSnapAlign: 'center' } as ViewStyle) : null]}
          >
            {render(item, index)}
          </Animated.View>
        );
      })}
    </Animated.ScrollView>
  );
}
