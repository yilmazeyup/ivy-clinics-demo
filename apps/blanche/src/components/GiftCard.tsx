import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { SHADES } from '@/data';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';

import { Txt } from './Txt';

const FACES = [SHADES.cherry.ink, '#141114', SHADES.lilac.ink, '#F2C9C8'];

/** A gift card drawn as a card: the script logo on a block of colour and the amount in the serif. */
export function GiftCard({ amount, style, small }: { amount: number; style?: StyleProp<ViewStyle>; small?: boolean }) {
  const theme = useTheme();
  const { euro } = useI18n();
  const index = [25, 50, 75, 100].indexOf(amount);
  const bg = FACES[Math.max(0, index) % FACES.length];
  const light = bg === '#F2C9C8';
  const ink = light ? theme.c.ink : '#FFFFFF';
  return (
    <View
      style={[
        {
          aspectRatio: 1.58,
          borderRadius: small ? 14 : 22,
          backgroundColor: bg,
          padding: small ? 10 : 18,
          justifyContent: 'space-between',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View style={{ position: 'absolute', right: -18, bottom: -30, opacity: 0.16 }}>
        <Text style={{ fontFamily: 'PinyonScript_400Regular', fontSize: small ? 90 : 150, lineHeight: small ? 120 : 200, color: ink }}>B</Text>
      </View>
      <Text
        style={{
          fontFamily: 'PinyonScript_400Regular',
          fontSize: small ? 18 : 30,
          lineHeight: small ? 26 : 42,
          color: ink,
          paddingHorizontal: 4,
          direction: 'ltr',
        }}
      >
        Blanche
      </Text>
      <Txt variant="display" color={ink} style={{ fontSize: small ? 26 : 44, lineHeight: small ? 26 : 44 }}>
        {euro(amount)}
      </Txt>
    </View>
  );
}
