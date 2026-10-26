import { CLINIC_COLORS, isRTL, type Locale } from '@pure-ivy/shared';
import { useMemo } from 'react';

import { useDemo } from './state/demo';

export type Palette = {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  lineStrong: string;
  /** Main call to action. */
  primary: string;
  onPrimary: string;
  /** Highlights such as quick-book buttons and badges. */
  accent: string;
  onAccent: string;
  sand: string;
  onPhoto: string;
  onPhotoMuted: string;
  /** A picked option, e.g. the zone or slot you are about to book, and the cart count. */
  highlight: string;
  onHighlight: string;
};

export type Fonts = {
  display: string;
  title: string;
  accent: string;
  body: string;
  light: string;
  medium: string;
  strong: string;
};

export type Theme = {
  rtl: boolean;
  arabic: boolean;
  c: Palette;
  f: Fonts;
  r: { card: number; control: number; chip: number; photo: number; small: number };
  stroke: number;
};

const PALETTE: Palette = {
  bg: CLINIC_COLORS.bg,
  surface: CLINIC_COLORS.surface,
  ink: CLINIC_COLORS.ink,
  muted: CLINIC_COLORS.muted,
  line: CLINIC_COLORS.line,
  lineStrong: CLINIC_COLORS.lineStrong,
  primary: CLINIC_COLORS.ink,
  onPrimary: '#FFFFFF',
  accent: CLINIC_COLORS.ink,
  onAccent: '#FFFFFF',
  sand: CLINIC_COLORS.sand,
  onPhoto: '#FFFFFF',
  onPhotoMuted: CLINIC_COLORS.onPhoto,
  highlight: CLINIC_COLORS.taupeDark,
  onHighlight: '#FFFFFF',
};

// Latin and Arabic need different families; the names match the keys loaded in the root layout.
const FONTS: { latin: Fonts; arabic: Fonts } = {
  latin: {
    display: 'CormorantGaramond_300Light',
    title: 'CormorantGaramond_400Regular',
    accent: 'CormorantGaramond_400Regular_Italic',
    body: 'Jost_400Regular',
    light: 'Jost_300Light',
    medium: 'Jost_500Medium',
    strong: 'Jost_500Medium',
  },
  arabic: {
    display: 'Amiri_400Regular',
    title: 'Amiri_400Regular',
    accent: 'Amiri_700Bold',
    body: 'IBMPlexSansArabic_400Regular',
    light: 'IBMPlexSansArabic_400Regular',
    medium: 'IBMPlexSansArabic_500Medium',
    strong: 'IBMPlexSansArabic_500Medium',
  },
};

export function makeTheme(locale: Locale): Theme {
  const arabic = locale === 'ar';
  return {
    rtl: isRTL(locale),
    arabic,
    c: PALETTE,
    f: arabic ? FONTS.arabic : FONTS.latin,
    r: { card: 16, control: 8, chip: 6, photo: 12, small: 6 },
    stroke: 1.3,
  };
}

export function useTheme(): Theme {
  const { locale } = useDemo();
  return useMemo(() => makeTheme(locale), [locale]);
}
