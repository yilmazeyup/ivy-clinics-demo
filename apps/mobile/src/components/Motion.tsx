import * as Haptics from 'expo-haptics';
import { Children, isValidElement, useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

/** The web has no native animation driver; asking for it there only logs a warning. */
export const nativeDriver = Platform.OS !== 'web';

/** The house curve: a quick start that settles slowly, like a sheet of silk landing. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

// Read once at start-up; animations check it before they run, and skip straight to the end if it is on.
let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((on) => {
    reduceMotion = on;
  })
  .catch(() => {});
export const prefersReducedMotion = () => reduceMotion;

type FadeProps = PropsWithChildren<{ delay?: number; distance?: number; duration?: number; style?: StyleProp<ViewStyle> }>;

/** Fades its content in while it rises a few points, once, when it first appears. */
export function FadeIn({ delay = 0, distance = 18, duration = 700, style, children }: FadeProps) {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const animation = Animated.timing(progress, { toValue: 1, duration, delay, easing: EASE_OUT, useNativeDriver: nativeDriver });
    animation.start();
    return () => animation.stop();
  }, [progress, delay, duration]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Lets each child arrive a moment after the one before it. */
export function Stagger({ children, step = 70, start = 0 }: { children: ReactNode; step?: number; start?: number }) {
  return (
    <>
      {Children.toArray(children).map((child, index) => (
        <FadeIn key={isValidElement(child) && child.key != null ? child.key : index} delay={start + Math.min(index, 8) * step}>
          {child}
        </FadeIn>
      ))}
    </>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** How far it sinks while pressed. */
  scaleTo?: number;
  haptic?: boolean;
};

/** Anything tappable: it gives way a little under the finger and springs back, with a light tick on a phone. */
export function PressableScale({ style, children, scaleTo = 0.97, haptic = true, onPressIn, onPressOut, onPress, ...rest }: ScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, useNativeDriver: nativeDriver, speed: 28, bounciness: value === 1 ? 7 : 0 }).start();
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

/** Counts from zero up to a number, easing out, e.g. for a score that fills in. */
export function useCountUp(target: number, { duration = 1400, delay = 0, run = true }: { duration?: number; delay?: number; run?: boolean } = {}) {
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
