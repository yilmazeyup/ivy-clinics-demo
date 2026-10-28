import { isRTL, type Locale } from '@pure-clinics/shared';
import { useMemo } from 'react';

import { SHADES, type CategoryId } from './data';
import { useDemo } from './state/demo';

/**
 * Blanche is a white canvas with colour on top, like a bare nail before the polish: black ink from the logo,
 * and the studio's three shades for its three crafts (cherry for nails, lilac for lashes, honey for brows).
 */
export type Palette = {
  paper: string;
  /** Cool off-white for sections and quiet surfaces. */
  chalk: string;
  ink: string;
  inkSoft: string;
  muted: string;
  line: string;
  lineStrong: string;
  /** Main call to action: cherry polish. */
  primary: string;
  onPrimary: string;
  /** Soft wash behind cherry details. */
  blush: string;
  lilac: string;
  lilacSoft: string;
  honey: string;
  honeySoft: string;
  /** Live and positive things: open now, saved, confirmed. */
  mint: string;
  mintSoft: string;
  bubble: string;
  onPhoto: string;
};

export type Fonts = {
  /** Instrument Serif: the tall, narrow serif of BEAUTY in the logo. */
  display: string;
  italic: string;
  /** Pinyon Script, the logo's hand: only for the wordmark and a signature now and then. */
  script: string;
  body: string;
  medium: string;
  strong: string;
  heavy: string;
};

export type Theme = {
  rtl: boolean;
  arabic: boolean;
  c: Palette;
  f: Fonts;
  r: { card: number; tile: number; control: number; small: number; pill: number };
  shadow: { card: string; lift: string; pop: string; sticker: string };
};

const PALETTE: Palette = {
  paper: '#FFFFFF',
  chalk: '#F6F4F8',
  ink: '#141114',
  inkSoft: '#3A333E',
  muted: '#776F7E',
  line: '#EEEAF2',
  lineStrong: '#DCD5E3',
  primary: SHADES.cherry.ink,
  onPrimary: '#FFFFFF',
  blush: SHADES.cherry.soft,
  lilac: SHADES.lilac.ink,
  lilacSoft: SHADES.lilac.soft,
  honey: SHADES.honey.ink,
  honeySoft: SHADES.honey.soft,
  mint: '#14876A',
  mintSoft: '#DDF4EA',
  bubble: '#FF8DC0',
  onPhoto: '#FFFFFF',
};

// Latin and Arabic need different families; the names match the keys loaded in the root layout.
const FONTS: { latin: Fonts; arabic: Fonts } = {
  latin: {
    display: 'InstrumentSerif_400Regular',
    italic: 'InstrumentSerif_400Regular_Italic',
    script: 'PinyonScript_400Regular',
    body: 'BricolageGrotesque_400Regular',
    medium: 'BricolageGrotesque_500Medium',
    strong: 'BricolageGrotesque_600SemiBold',
    heavy: 'BricolageGrotesque_700Bold',
  },
  arabic: {
    display: 'Amiri_400Regular',
    italic: 'Amiri_700Bold',
    script: 'PinyonScript_400Regular',
    body: 'IBMPlexSansArabic_400Regular',
    medium: 'IBMPlexSansArabic_500Medium',
    strong: 'IBMPlexSansArabic_600SemiBold',
    heavy: 'IBMPlexSansArabic_600SemiBold',
  },
};

const SHADOW = {
  card: '0px 1px 2px rgba(20, 17, 20, 0.04), 0px 12px 28px rgba(76, 52, 120, 0.09)',
  lift: '0px 6px 14px rgba(20, 17, 20, 0.08), 0px 26px 50px rgba(76, 52, 120, 0.16)',
  /** The cherry button glows a little in its own colour. */
  pop: '0px 8px 22px rgba(216, 30, 71, 0.32)',
  /** Stickers and tags sit on the page with a crisp offset, like a label on a bottle. */
  sticker: '2px 3px 0px #141114',
};

export function makeTheme(locale: Locale): Theme {
  const arabic = locale === 'ar';
  return {
    rtl: isRTL(locale),
    arabic,
    c: PALETTE,
    f: arabic ? FONTS.arabic : FONTS.latin,
    r: { card: 28, tile: 22, control: 18, small: 12, pill: 999 },
    shadow: SHADOW,
  };
}

export function useTheme(): Theme {
  const { locale } = useDemo();
  return useMemo(() => makeTheme(locale), [locale]);
}

/** The colour pair of a craft: a deep shade for text and buttons and a soft one for washes. */
export function categoryColors(category: CategoryId): { ink: string; soft: string; on: string } {
  const shade = SHADES[category === 'nails' ? 'cherry' : category === 'lashes' ? 'lilac' : 'honey'];
  return { ink: shade.ink, soft: shade.soft, on: shade.on };
}
