import { IVY_COLORS, isRTL, PURE_COLORS, type BrandId, type Locale } from '@pure-ivy/shared';
import { createContext, useContext, useMemo } from 'react';

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
  /** A picked option, e.g. the reformer or package you are about to book. */
  highlight: string;
  onHighlight: string;
  /** Reformer map: taken spots and the window wall. */
  taken: string;
  takenText: string;
  window: string;
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
  brand: BrandId;
  rtl: boolean;
  arabic: boolean;
  c: Palette;
  f: Fonts;
  r: { card: number; control: number; chip: number; photo: number; small: number };
  stroke: number;
};

const PALETTES: Record<BrandId, Palette> = {
  pure: {
    bg: PURE_COLORS.bg,
    surface: PURE_COLORS.surface,
    ink: PURE_COLORS.ink,
    muted: PURE_COLORS.muted,
    line: PURE_COLORS.line,
    lineStrong: PURE_COLORS.lineStrong,
    primary: PURE_COLORS.ink,
    onPrimary: '#FFFFFF',
    accent: PURE_COLORS.accent,
    onAccent: PURE_COLORS.ink,
    sand: PURE_COLORS.sand,
    onPhoto: '#FFFFFF',
    onPhotoMuted: PURE_COLORS.onInk,
    highlight: PURE_COLORS.accent,
    onHighlight: PURE_COLORS.ink,
    taken: PURE_COLORS.taken,
    takenText: PURE_COLORS.takenText,
    window: PURE_COLORS.window,
  },
  ivy: {
    bg: IVY_COLORS.bg,
    surface: IVY_COLORS.surface,
    ink: IVY_COLORS.ink,
    muted: IVY_COLORS.muted,
    line: IVY_COLORS.line,
    lineStrong: IVY_COLORS.lineStrong,
    primary: IVY_COLORS.ivy,
    onPrimary: '#FFFFFF',
    accent: IVY_COLORS.ink,
    onAccent: '#FFFFFF',
    sand: IVY_COLORS.sand,
    onPhoto: '#FFFFFF',
    onPhotoMuted: IVY_COLORS.onPhoto,
    highlight: IVY_COLORS.ivy,
    onHighlight: '#FFFFFF',
    taken: '#ECE5DC',
    takenText: '#A89D92',
    window: '#C9D3D3',
  },
};

// Latin and Arabic need different families; the names match the keys loaded in the root layout.
const FONTS: Record<BrandId, { latin: Fonts; arabic: Fonts }> = {
  pure: {
    latin: {
      display: 'ArchivoRoman-ExpandedSemiBold',
      title: 'ArchivoRoman-SemiExpandedSemiBold',
      accent: 'ArchivoRoman-SemiExpandedSemiBold',
      body: 'Archivo_400Regular',
      light: 'Archivo_400Regular',
      medium: 'Archivo_500Medium',
      strong: 'Archivo_600SemiBold',
    },
    arabic: {
      display: 'IBMPlexSansArabic_600SemiBold',
      title: 'IBMPlexSansArabic_600SemiBold',
      accent: 'IBMPlexSansArabic_600SemiBold',
      body: 'IBMPlexSansArabic_400Regular',
      light: 'IBMPlexSansArabic_400Regular',
      medium: 'IBMPlexSansArabic_500Medium',
      strong: 'IBMPlexSansArabic_600SemiBold',
    },
  },
  ivy: {
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
  },
};

export function makeTheme(brand: BrandId, locale: Locale): Theme {
  const arabic = locale === 'ar';
  return {
    brand,
    rtl: isRTL(locale),
    arabic,
    c: PALETTES[brand],
    f: arabic ? FONTS[brand].arabic : FONTS[brand].latin,
    r:
      brand === 'pure'
        ? { card: 22, control: 14, chip: 10, photo: 18, small: 8 }
        : { card: 16, control: 8, chip: 6, photo: 12, small: 6 },
    stroke: brand === 'pure' ? 1.7 : 1.3,
  };
}

/** Set by the /pure and /ivy layouts, so a screen always wears its own brand, even when opened by a link. */
export const BrandContext = createContext<BrandId | null>(null);

export function useTheme(): Theme {
  const demo = useDemo();
  const brand = useContext(BrandContext) ?? demo.brand;
  return useMemo(() => makeTheme(brand, demo.locale), [brand, demo.locale]);
}
