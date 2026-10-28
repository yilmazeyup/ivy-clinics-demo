import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

type Props = { size?: number; color?: string; style?: StyleProp<ViewStyle>; beauty?: boolean };

/**
 * The Blanche Beauty logo, set from type: "Blanche" in a copperplate script over BEAUTY in a tall, narrow serif,
 * black on white. `size` is the height of the script line; BEAUTY follows it.
 */
export function Wordmark({ size = 44, color, style, beauty = true }: Props) {
  const theme = useTheme();
  const ink = color ?? theme.c.ink;
  return (
    <View accessibilityRole="image" accessibilityLabel="Blanche Beauty" style={[{ alignItems: 'center', direction: 'ltr' }, style]}>
      <Text
        style={{
          fontFamily: 'PinyonScript_400Regular',
          fontSize: size,
          lineHeight: size * 1.32,
          color: ink,
          // The script's swash B reaches out to the left; a little room keeps it from being clipped.
          paddingHorizontal: size * 0.18,
          includeFontPadding: false,
        }}
      >
        Blanche
      </Text>
      {beauty ? (
        <Text
          style={{
            fontFamily: 'InstrumentSerif_400Regular',
            fontSize: size * 0.36,
            lineHeight: size * 0.4,
            letterSpacing: size * 0.02,
            color: ink,
            marginTop: -size * 0.3,
            marginStart: size * 0.06,
          }}
        >
          BEAUTY
        </Text>
      ) : null}
    </View>
  );
}
