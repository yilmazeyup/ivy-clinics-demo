import * as Haptics from 'expo-haptics';
import { Children, isValidElement, useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

/** The web has no native animation driver; asking for it there only logs a warning. */
export const nativeDriver = Platform.OS !== 'web';

/** Blanche moves like a fresh coat of gel: a quick swipe that settles with a little bounce. */
export const SWIPE = Easing.bezier(0.2, 0.9, 0.25, 1.15);
export const EASE = Easing.bezier(0.22, 1, 0.36, 1);

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((on) => {
    reduceMotion = on;
  })
  .catch(() => {});
export const prefersReducedMotion = () => reduceMotion;

type PopProps = PropsWithChildren<{ delay?: number; from?: number; rise?: number; tilt?: number; style?: StyleProp<ViewStyle> }>;

/** Pops its content in once: it grows from a little smaller, rises a few points and overshoots a touch. */
export function PopIn({ delay = 0, from = 0.92, rise = 16, tilt = 0, style, children }: PopProps) {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const animation = Animated.spring(progress, { toValue: 1, delay, stiffness: 170, damping: 15, mass: 0.9, useNativeDriver: nativeDriver });
    animation.start();
    return () => animation.stop();
  }, [progress, delay]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [rise, 0] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [from, 1] }) },
            { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: [`${tilt}deg`, '0deg'] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Lets each child pop in a beat after the one before it. */
export function Cascade({ children, step = 60, start = 0 }: { children: ReactNode; step?: number; start?: number }) {
  return (
    <>
      {Children.toArray(children).map((child, index) => (
        <PopIn key={isValidElement(child) && child.key != null ? child.key : index} delay={start + Math.min(index, 8) * step}>
          {child}
        </PopIn>
      ))}
    </>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SquishProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** How far it sinks while pressed. */
  scaleTo?: number;
  haptic?: boolean;
};

/** Anything tappable: it squishes under the finger like a gel cushion and bounces back. */
export function Squish({ style, children, scaleTo = 0.95, haptic = true, onPressIn, onPressOut, onPress, ...rest }: SquishProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: nativeDriver, stiffness: value === 1 ? 260 : 420, damping: value === 1 ? 9 : 26 }).start();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      onPressIn={(e) => {
        to(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** A sticker that sways gently on the page, as if it was just pressed on. */
export function Wobble({ children, angle = -4, style }: PropsWithChildren<{ angle?: number; style?: StyleProp<ViewStyle> }>) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
        Animated.timing(t, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <Animated.View style={[style, { transform: [{ rotate: t.interpolate({ inputRange: [0, 1], outputRange: [`${angle}deg`, `${angle + 3}deg`] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** A band of words that runs endlessly sideways, like the ribbon on a shop window. */
export function Marquee({ children, speed = 38, reverse = false }: PropsWithChildren<{ speed?: number; reverse?: boolean }>) {
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!width || reduceMotion) return;
    x.setValue(0);
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration: (width / speed) * 1000, easing: Easing.linear, useNativeDriver: nativeDriver }));
    loop.start();
    return () => loop.stop();
  }, [width, speed, x]);
  const shift = x.interpolate({ inputRange: [0, 1], outputRange: reverse ? [-width, 0] : [0, -width] });
  return (
    <View style={{ overflow: 'hidden', flexDirection: 'row', direction: 'ltr' }}>
      <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: shift }] }}>
        <View style={{ flexDirection: 'row' }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {children}
        </View>
        <View style={{ flexDirection: 'row' }}>{children}</View>
        <View style={{ flexDirection: 'row' }}>{children}</View>
      </Animated.View>
    </View>
  );
}

/** Counts from zero up to a number, easing out, e.g. points that fill in. */
export function useCountUp(target: number, { duration = 1300, delay = 0, run = true }: { duration?: number; delay?: number; run?: boolean } = {}) {
  const [value, setValue] = useState(reduceMotion ? target : 0);
  useEffect(() => {
    if (!run) return;
    if (reduceMotion) {
      setValue(target);
      return;
    }
    let frame = 0;
    let begin = 0;
    const tick = (now: number) => {
      if (!begin) begin = now;
      const p = Math.min(1, (now - begin) / duration);
      setValue(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, duration, delay, run]);
  return value;
}

/** A value that loops from 0 to 1 forever, e.g. for a shimmer sweeping over a card. */
export function useLoop(duration: number, pause = 0) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: nativeDriver }),
        Animated.delay(pause),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration, pause]);
  return t;
}
