import { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { Icon } from './Icon';
import { nativeDriver } from './Motion';
import { Txt } from './Txt';

const ToastContext = createContext<(message: string) => void>(() => {});

/** Short confirmations drop in from the top as an ink pill with a spark, and bounce away after a moment. */
export function ToastProvider({ children }: PropsWithChildren) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const drop = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      drop.setValue(0);
      Animated.spring(drop, { toValue: 1, stiffness: 260, damping: 16, useNativeDriver: nativeDriver }).start();
      timer.current = setTimeout(() => {
        Animated.timing(drop, { toValue: 0, duration: 220, useNativeDriver: nativeDriver }).start(({ finished }) => {
          if (finished) setMessage(null);
        });
      }, 2600);
    },
    [drop],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, top: insets.top + 8, alignItems: 'center' }}>
        <Animated.View
          style={{
            opacity: drop,
            transform: [
              { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) },
              { scale: drop.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
            ],
            maxWidth: 460,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: message ? theme.c.ink : 'transparent',
            borderRadius: theme.r.pill,
            paddingStart: 14,
            paddingEnd: 18,
            paddingVertical: message ? 12 : 0,
            boxShadow: message ? theme.shadow.lift : undefined,
          }}
        >
          {message ? (
            <>
              <Icon name="sparkle" size={17} color={theme.c.bubble} strokeWidth={2} />
              <Txt variant="smallStrong" color="#FFFFFF" style={{ flexShrink: 1 }}>
                {message}
              </Txt>
            </>
          ) : null}
        </Animated.View>
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
