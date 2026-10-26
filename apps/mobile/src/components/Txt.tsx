import { splitAccents } from '@pure-clinics/shared';
import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme, type Fonts } from '@/theme';

export type Variant =
  | 'hero'
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodyStrong'
  | 'small'
  | 'smallStrong'
  | 'caption'
  | 'eyebrow'
  | 'button';

type Spec = { font: keyof Fonts; size: number; line: number; tracking?: number; upper?: boolean; arabicSize?: number };

// Big editorial lines are set in the light serif; titles and small capitals in Pure's own Tenor Sans.
const SPECS: Record<Variant, Spec> = {
  hero: { font: 'display', size: 46, line: 48, tracking: -0.4 },
  display: { font: 'serif', size: 36, line: 40, tracking: -0.2 },
  title: { font: 'title', size: 21, line: 27, tracking: 0.2, arabicSize: 24 },
  heading: { font: 'title', size: 17, line: 23, tracking: 0.2, arabicSize: 19 },
  body: { font: 'body', size: 15, line: 22 },
  bodyStrong: { font: 'medium', size: 15, line: 22 },
  small: { font: 'body', size: 13, line: 18 },
  smallStrong: { font: 'medium', size: 13, line: 18 },
  caption: { font: 'body', size: 11, line: 14 },
  eyebrow: { font: 'brand', size: 11, line: 14, tracking: 2.2, upper: true },
  button: { font: 'medium', size: 15, line: 20, tracking: 0.3 },
};

type Props = Omit<TextProps, 'children'> & {
  variant?: Variant;
  color?: string;
  align?: 'auto' | 'center' | 'left' | 'right';
  /** Colour for *accented* words; by default they keep the text colour (Arabic uses the primary colour). */
  accentColor?: string;
  children?: ReactNode;
};

/**
 * Text in the clinic's type. Strings may mark accents with *asterisks*, set in italic serif
 * (Amiri bold in Arabic). Arabic never gets letter-spacing or upper-casing, which would break joining.
 */
export function Txt({ variant = 'body', color, align, accentColor, style, children, ...rest }: Props) {
  const theme = useTheme();
  const spec = SPECS[variant];
  const base: TextStyle = {
    fontFamily: theme.f[spec.font],
    fontSize: theme.arabic && spec.arabicSize ? spec.arabicSize : spec.size,
    lineHeight: Math.round(spec.line * (theme.arabic ? 1.3 : 1)),
    letterSpacing: theme.arabic ? 0 : (spec.tracking ?? 0),
    textTransform: spec.upper && !theme.arabic ? 'uppercase' : 'none',
    color: color ?? theme.c.ink,
    textAlign: align ?? 'auto',
    writingDirection: theme.rtl ? 'rtl' : 'ltr',
    // Cormorant's figures are old-style by default (a 1 looks like an I); prices and counts need lining figures.
    fontVariant: ['lining-nums'],
  };
  // Arabic script needs taller lines, also where a screen sets its own line height.
  const override = theme.arabic ? StyleSheet.flatten(style)?.lineHeight : undefined;
  const arabicLine: TextStyle | null = override ? { lineHeight: Math.round(override * 1.3) } : null;

  if (typeof children === 'string' && children.includes('*')) {
    // The italic serif runs smaller than Tenor Sans, so inside a title it is set a little larger.
    const sans = spec.font === 'title' || spec.font === 'brand';
    const accent: TextStyle = {
      fontFamily: theme.f.accent,
      color: accentColor ?? (theme.arabic ? theme.c.primary : undefined),
      ...(sans && !theme.arabic ? { fontSize: Math.round((StyleSheet.flatten(style)?.fontSize ?? base.fontSize ?? spec.size) * 1.22) } : null),
    };
    return (
      <Text style={[base, style, arabicLine]} {...rest}>
        {splitAccents(children).map((segment, index) =>
          segment.accent ? (
            <Text key={index} style={accent}>
              {segment.text}
            </Text>
          ) : (
            segment.text
          ),
        )}
      </Text>
    );
  }

  return (
    <Text style={[base, style, arabicLine]} {...rest}>
      {children}
    </Text>
  );
}
