import { CLINIC_COLORS, isRTL, type Locale } from '@pure-clinics/shared';
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
  /** The fine gold line under the Pure Clinics wordmark. */
  gold: string;
};

export type Fonts = {
  display: string;
  /** The regular serif, for page titles. */
  serif: string;
  title: string;
  accent: string;
  /** Pure Clinics' own heading face (Tenor Sans on pureclinics.nl), for titles and small capitals. */
  brand: string;
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
  /** Soft, layered shadows (CSS syntax, which React Native and the web both read). */
  shadow: { card: string; float: string; lift: string };
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
  gold: '#B99A62',
};

// Latin and Arabic need different families; the names match the keys loaded in the root layout.
const FONTS: { latin: Fonts; arabic: Fonts } = {
  latin: {
    display: 'CormorantGaramond_300Light',
    serif: 'CormorantGaramond_400Regular',
    title: 'TenorSans_400Regular',
    accent: 'CormorantGaramond_400Regular_Italic',
    brand: 'TenorSans_400Regular',
    body: 'Jost_400Regular',
    light: 'Jost_300Light',
    medium: 'Jost_500Medium',
    strong: 'Jost_500Medium',
  },
  arabic: {
    display: 'Amiri_400Regular',
    serif: 'Amiri_400Regular',
    title: 'Amiri_400Regular',
    accent: 'Amiri_700Bold',
    brand: 'IBMPlexSansArabic_500Medium',
    body: 'IBMPlexSansArabic_400Regular',
    light: 'IBMPlexSansArabic_400Regular',
    medium: 'IBMPlexSansArabic_500Medium',
    strong: 'IBMPlexSansArabic_500Medium',
  },
};

const SHADOW = {
  card: '0px 1px 2px rgba(40, 32, 24, 0.05), 0px 8px 24px rgba(40, 32, 24, 0.07)',
  float: '0px 2px 6px rgba(20, 16, 12, 0.10), 0px 18px 40px rgba(20, 16, 12, 0.22)',
  lift: '0px 4px 10px rgba(40, 32, 24, 0.08), 0px 24px 48px rgba(40, 32, 24, 0.16)',
};

export function makeTheme(locale: Locale): Theme {
  const arabic = locale === 'ar';
  return {
    rtl: isRTL(locale),
    arabic,
    c: PALETTE,
    f: arabic ? FONTS.arabic : FONTS.latin,
    r: { card: 24, control: 14, chip: 12, photo: 20, small: 12 },
    shadow: SHADOW,
    stroke: 1.3,
  };
}

export function useTheme(): Theme {
  const { locale } = useDemo();
  return useMemo(() => makeTheme(locale), [locale]);
}
