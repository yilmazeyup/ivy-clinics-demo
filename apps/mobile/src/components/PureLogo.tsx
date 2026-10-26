import { Text, View } from 'react-native';

import { useTheme } from '@/theme';

/**
 * The "PURE CLINICS" wordmark as on pureclinics.nl: PURE in bold capitals, CLINICS light, both widely spaced.
 * It stays in Latin script and left-to-right in every language.
 */
export function PureLogo({ width = 150, color }: { width?: number; color?: string }) {
  const theme = useTheme();
  // Eleven spaced capitals take about eleven times the font size.
  const size = width / 11;
  const letter = { fontSize: size, lineHeight: size * 1.2, letterSpacing: size * 0.38, color: color ?? theme.c.ink };
  return (
    <View accessibilityRole="image" accessibilityLabel="Pure Clinics" style={{ flexDirection: 'row', direction: 'ltr', alignItems: 'baseline' }}>
      <Text style={[letter, { fontFamily: 'Jost_500Medium' }]}>PURE</Text>
      <Text style={[letter, { fontFamily: 'Jost_300Light' }]}>CLINICS</Text>
    </View>
  );
}
