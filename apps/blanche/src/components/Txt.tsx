import { splitAccents } from '@pure-clinics/shared';
import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme, type Fonts } from '@/theme';

export type Variant = 'mega' | 'display' | 'title' | 'price' | 'heading' | 'body' | 'bodyStrong' | 'small' | 'smallStrong' | 'caption' | 'tag' | 'button';

type Spec = { font: keyof Fonts; size: number; line: number; tracking?: number; upper?: boolean; arabicSize?: number };

// Big lines are set in Instrument Serif, the narrow serif of BEAUTY in the logo; everything you read or tap in Bricolage Grotesque.
const SPECS: Record<Variant, Spec> = {
  mega: { font: 'display', size: 60, line: 58, tracking: -1.2, arabicSize: 44 },
  display: { font: 'display', size: 44, line: 44, tracking: -0.8, arabicSize: 34 },
  title: { font: 'display', size: 30, line: 32, tracking: -0.4, arabicSize: 26 },
  price: { font: 'display', size: 26, line: 28, tracking: -0.2 },
  heading: { font: 'strong', size: 17, line: 22, tracking: -0.2 },
  body: { font: 'body', size: 15, line: 22 },
  bodyStrong: { font: 'strong', size: 15, line: 22 },
  small: { font: 'body', size: 13, line: 18 },
  smallStrong: { font: 'strong', size: 13, line: 18 },
  caption: { font: 'medium', size: 11, line: 14 },
  tag: { font: 'heavy', size: 10.5, line: 13, tracking: 0.9, upper: true },
  button: { font: 'heavy', size: 15, line: 20, tracking: 0.1 },
};

type Props = Omit<TextProps, 'children'> & {
  variant?: Variant;
  color?: string;
  align?: 'auto' | 'center' | 'left' | 'right';
  /** Colour for *accented* words; by default they keep the text colour. */
  accentColor?: string;
  children?: ReactNode;
};

/**
 * Text in Blanche's type. Strings may mark accents with *asterisks*, set in Instrument Serif italic
 * (bold Amiri in Arabic). Arabic never gets letter-spacing or capitals, which would break joining.
 */
export function Txt({ variant = 'body', color, align, accentColor, style, children, ...rest }: Props) {
  const theme = useTheme();
  const spec = SPECS[variant];
  const base: TextStyle = {
    fontFamily: theme.f[spec.font],
    fontSize: theme.arabic && spec.arabicSize ? spec.arabicSize : spec.size,
    lineHeight: Math.round((theme.arabic && spec.arabicSize ? spec.arabicSize * (spec.line / spec.size) : spec.line) * (theme.arabic ? 1.3 : 1)),
    letterSpacing: theme.arabic ? 0 : (spec.tracking ?? 0),
    textTransform: spec.upper && !theme.arabic ? 'uppercase' : 'none',
    color: color ?? theme.c.ink,
    textAlign: align ?? 'auto',
    writingDirection: theme.rtl ? 'rtl' : 'ltr',
    fontVariant: ['lining-nums'],
  };
  const override = theme.arabic ? StyleSheet.flatten(style)?.lineHeight : undefined;
  const arabicLine: TextStyle | null = override ? { lineHeight: Math.round(override * 1.3) } : null;

  if (typeof children === 'string' && children.includes('*')) {
    // Italic serif inside a sans line runs small, so there it is set a little larger.
    const sans = spec.font !== 'display' && spec.font !== 'italic';
    const size = StyleSheet.flatten(style)?.fontSize ?? base.fontSize ?? spec.size;
    const accent: TextStyle = {
      fontFamily: theme.f.italic,
      color: accentColor ?? (theme.arabic ? theme.c.primary : undefined),
      ...(sans && !theme.arabic ? { fontSize: Math.round(size * 1.25), letterSpacing: 0 } : null),
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
