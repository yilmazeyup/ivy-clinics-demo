import { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { Txt } from './Txt';

const ToastContext = createContext<(message: string) => void>(() => {});

/**
 * Short confirmation messages, e.g. after a test payment. The toast sits on top of the screens but under
 * modal sheets, so sheets give their feedback inside themselves.
 */
export function ToastProvider({ children }: PropsWithChildren) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
          if (finished) setMessage(null);
        });
      }, 2600);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* Always mounted, so the native-driven fade has a view to animate from the first call. */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 20, right: 20, top: insets.top + 8 }}>
        <Animated.View
          style={{
            opacity,
            backgroundColor: message ? theme.c.ink : 'transparent',
            borderRadius: theme.r.control,
            paddingHorizontal: 16,
            paddingVertical: message ? 12 : 0,
          }}
        >
          {message ? (
            <Txt variant="small" color={theme.c.onPrimary}>
              {message}
            </Txt>
          ) : null}
        </Animated.View>
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
