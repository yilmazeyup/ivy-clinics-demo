import { useNavigation, useRoute } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { Animated, Platform, ScrollView, View, type ScrollViewInstance, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DETAIL_WIDTH, PAGE_WIDTH, useLayout } from '@/layout';
import { useTheme } from '@/theme';

import { Glass } from './Glass';
import { Stagger } from './Motion';
import { useTabBarSpace } from './TabBar';

const ScrollYContext = createContext<Animated.Value | null>(null);

/** How far the page around a component has scrolled, for headers that move at their own pace. */
export function useScrollY(): Animated.Value {
  const fallback = useRef(new Animated.Value(0)).current;
  return useContext(ScrollYContext) ?? fallback;
}

type Props = PropsWithChildren<{
  /** Fixed area pinned to the bottom, e.g. a booking bar. */
  footer?: ReactNode;
  /** Extra space at the bottom of the scroll content, e.g. for the tab bar. */
  bottomSpace?: number;
  gap?: number;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  background?: string;
  /** Shown as a sheet below the status bar, so no status bar backdrop is needed. */
  sheet?: boolean;
  /** On a computer screen: main pages use the full column, detail pages a narrower one. */
  width?: 'page' | 'detail';
  /** A page under the floating tab bar, which needs room at the bottom. */
  tabs?: boolean;
  /** Let the blocks of the page arrive one after another when it opens. */
  enter?: boolean;
  /** A page that opens on a photo: the bar behind the clock only appears once the photo has scrolled away. */
  photoTop?: number;
  /** Fixed on top of the page, e.g. a back button and a bar that appears while scrolling. */
  overlay?: ReactNode;
}>;

export function Screen({
  children,
  footer,
  bottomSpace: space = 32,
  gap = 20,
  padded = true,
  contentStyle,
  background,
  sheet,
  width = 'detail',
  tabs,
  enter = true,
  photoTop,
  overlay,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { wide, gutter } = useLayout();
  const scrollY = useRef(new Animated.Value(0)).current;
  const bg = background ?? theme.c.bg;
  const tabSpace = useTabBarSpace();
  // The footer floats over the end of the page, so the page gets its height as extra room.
  const [footerHeight, setFooterHeight] = useState(0);
  const bottomSpace = (tabs ? tabSpace : space) + (footer ? footerHeight : 0);
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        contentContainerStyle={[
          {
            paddingTop: insets.top + 8,
            paddingHorizontal: padded ? 20 : 0,
            paddingBottom: bottomSpace + (footer || tabs ? 0 : insets.bottom),
            gap,
          },
          contentStyle,
          // A computer screen: content in a centred column with room around it, like a website.
          wide && {
            width: '100%',
            maxWidth: (width === 'page' ? PAGE_WIDTH : DETAIL_WIDTH) + gutter * 2,
            alignSelf: 'center',
            paddingTop: 40,
            paddingHorizontal: padded ? gutter : 0,
            paddingBottom: bottomSpace + 32,
          },
        ]}
      >
        <ScrollYContext.Provider value={scrollY}>{enter ? <Stagger>{children}</Stagger> : children}</ScrollYContext.Provider>
      </Animated.ScrollView>
      {/* Once content scrolls, a backdrop keeps it from running behind the clock and the notch. */}
      {sheet ? null : (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: insets.top,
            backgroundColor: bg,
            opacity: scrollY.interpolate({
              inputRange: photoTop ? [photoTop - insets.top - 40, photoTop - insets.top] : [0, 24],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          }}
        />
      )}
      {overlay ? <ScrollYContext.Provider value={scrollY}>{overlay}</ScrollYContext.Provider> : null}
      {footer ? (
        <View style={{ position: 'absolute', start: 0, end: 0, bottom: 0 }} onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Top padding for a screen presented as a modal. On iOS it opens as a sheet below the status bar,
 * unless it is the first screen in its stack (e.g. opened by a link); then it fills the screen.
 */
export function useModalTop(): number {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  // While a push is still settling the route may be missing from the state; that also means "not first".
  const first = navigation.getState()?.routes.findIndex((r) => r.key === route.key) === 0;
  return Platform.OS === 'ios' && !first ? 18 : insets.top + 10;
}

/** Horizontal scroller that bleeds to the screen edge, for card rows. On a computer screen the row wraps instead. */
export function Rail({ children, gap = 12 }: PropsWithChildren<{ gap?: number }>) {
  const theme = useTheme();
  const { wide } = useLayout();
  const ref = useRef<ScrollViewInstance>(null);
  // iOS reuses native scroll views, and after the reading direction flips one can keep its old position.
  // Going back to the start whenever the language or the content changes keeps every row beginning at its start.
  // In a right-to-left row the start is the far right, which is the end of the scroll range.
  const toStart = () => (theme.rtl ? ref.current?.scrollToEnd({ animated: false }) : ref.current?.scrollTo({ x: 0, animated: false }));
  useEffect(toStart, [theme.rtl]);
  if (wide) return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>{children}</View>;
  return (
    <ScrollView
      ref={ref}
      onContentSizeChange={toStart}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ paddingHorizontal: 20, gap }}
    >
      {children}
    </ScrollView>
  );
}

/** Bottom action bar: a pane of glass above the home indicator, with the page scrolling on beneath it. */
export function Footer({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets();
  const { wide, gutter } = useLayout();
  return (
    <Glass style={{ borderWidth: 0, borderTopWidth: 1, borderTopColor: 'rgba(30, 30, 28, 0.06)', boxShadow: '0px -10px 30px rgba(40, 32, 24, 0.06)' }}>
      <View
        style={{
          paddingHorizontal: wide ? gutter : 20,
          paddingTop: 14,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        {/* On a computer screen the bar's content lines up with the centred page above it. */}
        <View style={{ gap: 10, width: '100%', maxWidth: wide ? DETAIL_WIDTH : undefined, alignSelf: 'center' }}>{children}</View>
      </View>
    </Glass>
  );
}
