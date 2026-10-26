import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

// iOS 26 renders real Liquid Glass; the web blurs what lies behind; elsewhere a near-solid tint stands in.
const LIQUID = Platform.OS === 'ios' && isLiquidGlassAvailable();
const BLUR = Platform.OS === 'web';

type Props = PropsWithChildren<{
  /** Light glass sits on the ivory pages and on photos; dark glass carries white icons. */
  tone?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
  /** Native glass reacts to touch with a soft glow. */
  interactive?: boolean;
}>;

/** A frosted surface that lets the photo or page beneath show through. */
export function Glass({ tone = 'light', style, interactive, children }: Props) {
  if (LIQUID) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme={tone === 'dark' ? 'dark' : 'light'}
        tintColor={tone === 'dark' ? 'rgba(24, 23, 21, 0.55)' : 'rgba(250, 246, 240, 0.35)'}
        isInteractive={interactive}
        style={[{ overflow: 'hidden' }, style]}
      >
        {children}
      </GlassView>
    );
  }
  const dark = tone === 'dark';
  const backdrop = BLUR ? ({ backdropFilter: dark ? 'blur(24px) saturate(140%)' : 'blur(22px) saturate(180%)' } as ViewStyle) : null;
  return (
    <View
      style={[
        {
          overflow: 'hidden',
          backgroundColor: dark ? (BLUR ? 'rgba(28, 27, 25, 0.74)' : 'rgba(28, 27, 25, 0.94)') : BLUR ? 'rgba(252, 249, 244, 0.8)' : 'rgba(252, 249, 244, 0.95)',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.75)',
        },
        backdrop,
        style,
      ]}
    >
      {children}
    </View>
  );
}
