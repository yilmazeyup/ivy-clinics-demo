import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { startEdge } from '@/layout';
import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { nativeDriver } from './Motion';
import { Txt } from './Txt';

type Option<T extends string> = { value: T; label: string; icon?: IconName };

/** A choice between a few options, with a dark pill that glides to the chosen one. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: Option<T>[]; value: T; onChange: (value: T) => void; label: string }) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const position = useRef(new Animated.Value(index)).current;
  useEffect(() => {
    Animated.spring(position, { toValue: index, stiffness: 300, damping: 28, useNativeDriver: nativeDriver }).start();
  }, [index, position]);
  const pad = 4;
  const segment = width > 0 ? (width - pad * 2) / options.length : 0;
  const direction = theme.rtl ? -1 : 1;
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', padding: pad, borderRadius: 16, backgroundColor: theme.c.surface, boxShadow: theme.shadow.card }}
    >
      {segment > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: pad,
            bottom: pad,
            ...startEdge(theme.rtl, pad),
            width: segment,
            borderRadius: 12,
            backgroundColor: theme.c.ink,
            transform: [
              {
                translateX:
                  options.length > 1
                    ? position.interpolate({ inputRange: [0, options.length - 1], outputRange: [0, (options.length - 1) * segment * direction] })
                    : 0,
              },
            ],
          }}
        />
      ) : null}
      {options.map((o, i) => {
        const on = i === index;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => {
              if (!on) Haptics.selectionAsync().catch(() => {});
              onChange(o.value);
            }}
            style={{ flex: 1, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            {o.icon ? <Icon name={o.icon} size={16} color={on ? '#FFFFFF' : theme.c.muted} /> : null}
            <Txt variant="smallStrong" color={on ? '#FFFFFF' : theme.c.ink}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
