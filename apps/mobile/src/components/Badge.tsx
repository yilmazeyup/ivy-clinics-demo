import { View } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

type Tone = 'ink' | 'accent' | 'highlight' | 'muted' | 'outline' | 'surface';

/** A small rectangular label for states such as "geboekt", "vol" or "−20%". */
export function Badge({ label, tone = 'muted', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const theme = useTheme();
  const colors: Record<Tone, { bg: string; fg: string; border?: string }> = {
    ink: { bg: theme.c.ink, fg: theme.c.onPrimary },
    accent: { bg: theme.c.accent, fg: theme.c.onAccent },
    highlight: { bg: theme.c.highlight, fg: theme.c.onHighlight },
    muted: { bg: theme.c.bg, fg: theme.c.muted },
    outline: { bg: 'transparent', fg: theme.c.ink, border: theme.c.lineStrong },
    surface: { bg: theme.c.surface, fg: theme.c.ink },
  };
  const { bg, fg, border } = colors[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        height: 24,
        borderRadius: theme.r.small,
        backgroundColor: bg,
        borderWidth: border ? 1 : 0,
        borderColor: border,
      }}
    >
      {icon ? <Icon name={icon} size={13} color={fg} strokeWidth={2} /> : null}
      <Txt variant="smallStrong" color={fg} numberOfLines={1} style={{ fontSize: 12, lineHeight: 15 }}>
        {label}
      </Txt>
    </View>
  );
}
