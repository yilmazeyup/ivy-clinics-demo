import { splitAccents } from '@pure-ivy/shared';
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

type Spec = { font: keyof Fonts; size: number; line: number; tracking?: number; upper?: boolean };

const SPECS: Record<Variant, Spec> = {
  hero: { font: 'display', size: 40, line: 43 },
  display: { font: 'title', size: 33, line: 36 },
  title: { font: 'title', size: 26, line: 30 },
  heading: { font: 'title', size: 22, line: 26 },
  body: { font: 'body', size: 15, line: 22 },
  bodyStrong: { font: 'medium', size: 15, line: 22 },
  small: { font: 'body', size: 13, line: 18 },
  smallStrong: { font: 'medium', size: 13, line: 18 },
  caption: { font: 'body', size: 11, line: 14 },
  eyebrow: { font: 'medium', size: 11, line: 14, tracking: 2, upper: true },
  button: { font: 'body', size: 16, line: 20, tracking: 0.3 },
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
    fontSize: spec.size,
    lineHeight: Math.round(spec.line * (theme.arabic ? 1.3 : 1)),
    letterSpacing: theme.arabic ? 0 : (spec.tracking ?? 0),
    textTransform: spec.upper && !theme.arabic ? 'uppercase' : 'none',
    color: color ?? theme.c.ink,
    textAlign: align ?? 'auto',
    writingDirection: theme.rtl ? 'rtl' : 'ltr',
  };
  // Arabic script needs taller lines, also where a screen sets its own line height.
  const override = theme.arabic ? StyleSheet.flatten(style)?.lineHeight : undefined;
  const arabicLine: TextStyle | null = override ? { lineHeight: Math.round(override * 1.3) } : null;

  if (typeof children === 'string' && children.includes('*')) {
    const accent: TextStyle = {
      fontFamily: theme.f.accent,
      color: accentColor ?? (theme.arabic ? theme.c.primary : undefined),
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
