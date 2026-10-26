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

const PURE: Record<Variant, Spec> = {
  hero: { font: 'display', size: 30, line: 33, tracking: -1 },
  display: { font: 'display', size: 26, line: 30, tracking: -0.8 },
  title: { font: 'title', size: 22, line: 26, tracking: -0.4 },
  heading: { font: 'title', size: 18, line: 22, tracking: -0.2 },
  body: { font: 'body', size: 15, line: 21 },
  bodyStrong: { font: 'strong', size: 15, line: 21 },
  small: { font: 'body', size: 13, line: 18 },
  smallStrong: { font: 'strong', size: 13, line: 18 },
  caption: { font: 'medium', size: 11, line: 14 },
  eyebrow: { font: 'strong', size: 12, line: 16, tracking: 1.4, upper: true },
  button: { font: 'strong', size: 16, line: 20 },
};

const IVY: Record<Variant, Spec> = {
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
  /** Colour for *accented* words; defaults to the brand's own accent treatment. */
  accentColor?: string;
  children?: ReactNode;
};

/**
 * Brand-aware text. Strings may mark accents with *asterisks*: Ivy renders them in italic serif
 * (Amiri bold in Arabic). Arabic never gets letter-spacing or upper-casing, which would break joining.
 */
export function Txt({ variant = 'body', color, align, accentColor, style, children, ...rest }: Props) {
  const theme = useTheme();
  const spec = (theme.brand === 'pure' ? PURE : IVY)[variant];
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
      color: accentColor ?? (theme.arabic && theme.brand === 'ivy' ? theme.c.primary : undefined),
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
