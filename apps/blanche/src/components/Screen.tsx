import { useNavigation, useRoute } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { Animated, Platform, ScrollView, View, type ScrollViewInstance, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DETAIL_WIDTH, PAGE_WIDTH, useLayout } from '@/layout';
import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { Cascade, Squish } from './Motion';
import { useTabBarSpace } from './TabBar';
import { Txt } from './Txt';

const ScrollYContext = createContext<Animated.Value | null>(null);

/** How far the page around a component has scrolled, for headers that move at their own pace. */
export function useScrollY(): Animated.Value {
  const fallback = useRef(new Animated.Value(0)).current;
  return useContext(ScrollYContext) ?? fallback;
}

type Props = PropsWithChildren<{
  /** Fixed area pinned to the bottom, e.g. a booking bar. */
  footer?: ReactNode;
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
  /** Let the blocks of the page pop in one after another when it opens. */
  enter?: boolean;
  /** A page that opens on a photo: the bar behind the clock only appears once the photo has scrolled away. */
  photoTop?: number;
  /** Fixed on top of the page, e.g. a back button. */
  overlay?: ReactNode;
}>;

export function Screen({
  children,
  footer,
  gap = 24,
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
  const bg = background ?? theme.c.paper;
  const tabSpace = useTabBarSpace();
  const [footerHeight, setFooterHeight] = useState(0);
  const bottomSpace = (tabs ? tabSpace : 36) + (footer ? footerHeight : 0);
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        contentContainerStyle={[
          {
            paddingTop: insets.top + 10,
            paddingHorizontal: padded ? 20 : 0,
            paddingBottom: bottomSpace + (footer || tabs ? 0 : insets.bottom),
            gap,
          },
          contentStyle,
          wide && {
            width: '100%',
            maxWidth: (width === 'page' ? PAGE_WIDTH : DETAIL_WIDTH) + gutter * 2,
            alignSelf: 'center',
            paddingTop: 36,
            paddingHorizontal: padded ? gutter : 0,
            paddingBottom: bottomSpace + 40,
          },
        ]}
      >
        <ScrollYContext.Provider value={scrollY}>{enter ? <Cascade>{children}</Cascade> : children}</ScrollYContext.Provider>
      </Animated.ScrollView>
      {sheet || wide ? null : (
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

/** Top padding for a screen presented as a modal: a sheet on iOS, unless it opened first (e.g. from a link). */
export function useModalTop(): number {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const first = navigation.getState()?.routes.findIndex((r) => r.key === route.key) === 0;
  return Platform.OS === 'ios' && !first ? 18 : insets.top + 10;
}

/** Horizontal scroller that bleeds to the screen edge, for card rows. On a computer screen the row wraps instead. */
export function Rail({ children, gap = 12, wrap = true }: PropsWithChildren<{ gap?: number; wrap?: boolean }>) {
  const theme = useTheme();
  const { wide } = useLayout();
  const ref = useRef<ScrollViewInstance>(null);
  // In a right-to-left row the start is the far right, which is the end of the scroll range.
  const toStart = () => (theme.rtl ? ref.current?.scrollToEnd({ animated: false }) : ref.current?.scrollTo({ x: 0, animated: false }));
  useEffect(toStart, [theme.rtl]);
  if (wide && wrap) return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>{children}</View>;
  return (
    <ScrollView
      ref={ref}
      onContentSizeChange={toStart}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: wide ? 0 : -20 }}
      contentContainerStyle={{ paddingHorizontal: wide ? 0 : 20, gap, paddingVertical: 6 }}
    >
      {children}
    </ScrollView>
  );
}

/** Bottom action bar: white, rounded on top, above the home indicator. */
export function Footer({ children }: PropsWithChildren) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { wide, gutter } = useLayout();
  return (
    <View
      style={{
        backgroundColor: theme.c.paper,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        boxShadow: '0px -8px 30px rgba(76, 52, 120, 0.12)',
        paddingHorizontal: wide ? gutter : 20,
        paddingTop: 14,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      <View style={{ gap: 10, width: '100%', maxWidth: wide ? DETAIL_WIDTH : undefined, alignSelf: 'center' }}>{children}</View>
    </View>
  );
}

/** A section heading: a big serif title, an optional line under it and a link on the side. */
export function Section({
  title,
  sub,
  action,
  onAction,
  children,
  style,
}: PropsWithChildren<{ title: string; sub?: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  return (
    <View style={[{ gap: 14 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="title">{title}</Txt>
          {sub ? (
            <Txt variant="small" color={theme.c.muted}>
              {sub}
            </Txt>
          ) : null}
        </View>
        {action ? <SectionLink label={action} onPress={onAction} /> : null}
      </View>
      {children}
    </View>
  );
}

function SectionLink({ label, onPress }: { label: string; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Squish onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 6, paddingStart: 8 }}>
      <Txt variant="smallStrong" color={theme.c.ink} style={{ textDecorationLine: 'underline' }}>
        {label}
      </Txt>
      <Icon name="chevron" size={14} strokeWidth={2.2} />
    </Squish>
  );
}

/** Keeps a page's blocks together at full width on a computer screen. */
export function PageWidth({ children }: PropsWithChildren) {
  return <View style={{ width: '100%', maxWidth: PAGE_WIDTH, alignSelf: 'center' }}>{children}</View>;
}
