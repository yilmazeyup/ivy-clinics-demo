import type { ReactNode } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme';

export type IconName =
  | 'home'
  | 'sparkle'
  | 'calendar'
  | 'bag'
  | 'user'
  | 'crown'
  | 'bell'
  | 'back'
  | 'arrow'
  | 'chevron'
  | 'chevronDown'
  | 'close'
  | 'check'
  | 'plus'
  | 'minus'
  | 'clock'
  | 'pin'
  | 'phone'
  | 'chat'
  | 'heart'
  | 'heartFill'
  | 'star'
  | 'gift'
  | 'ticket'
  | 'polish'
  | 'lash'
  | 'brow'
  | 'hand'
  | 'palette'
  | 'camera'
  | 'share'
  | 'globe'
  | 'instagram'
  | 'tiktok'
  | 'swap'
  | 'flame'
  | 'wand'
  | 'cards'
  | 'truck'
  | 'store'
  | 'card'
  | 'refresh'
  | 'settings'
  | 'help'
  | 'play'
  | 'qr';

// Arrows and chevrons point the other way in right-to-left layouts.
const DIRECTIONAL: IconName[] = ['back', 'arrow', 'chevron'];

/** Shapes drawn with round ends on a 24 grid; filled marks use `fill` from the colour. */
function shapes(color: string): Record<IconName, ReactNode> {
  return {
    home: <Path d="M4 11.2 12 4.5l8 6.7V19a1.5 1.5 0 0 1-1.5 1.5h-3.8v-5.2h-5.4v5.2H5.5A1.5 1.5 0 0 1 4 19z" />,
    sparkle: (
      <>
        <Path d="M12 3.5c.6 4.3 2.6 6.4 7 7-4.4.7-6.4 2.7-7 7-.6-4.3-2.6-6.3-7-7 4.4-.6 6.4-2.7 7-7Z" />
        <Path d="M19 3.5v3M17.5 5h3" />
      </>
    ),
    calendar: (
      <>
        <Rect x={3.75} y={5.25} width={16.5} height={15} rx={4} />
        <Path d="M8 3.5v3.5M16 3.5v3.5M3.75 10h16.5" />
        <Path d="m9.4 14.6 1.8 1.8 3.6-3.6" />
      </>
    ),
    bag: (
      <>
        <Path d="M5.2 8.5h13.6l-1 10.4a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
        <Path d="M8.8 8.5V7a3.2 3.2 0 0 1 6.4 0v1.5" />
      </>
    ),
    user: (
      <>
        <Path d="M12 12.2a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8Z" />
        <Path d="M4.8 20.2c1.1-3.6 3.8-5.2 7.2-5.2s6.1 1.6 7.2 5.2" />
      </>
    ),
    crown: (
      <>
        <Path d="m4 8.2 3.9 3.4L12 5.5l4.1 6.1L20 8.2l-1.6 9.3H5.6z" />
        <Path d="M6 20.5h12" />
      </>
    ),
    bell: (
      <>
        <Path d="M6.2 16.8V11a5.8 5.8 0 0 1 11.6 0v5.8l1.5 1.7H4.7z" />
        <Path d="M10 20.6a2.2 2.2 0 0 0 4 0" />
      </>
    ),
    back: <Path d="M14.5 5.5 8 12l6.5 6.5" />,
    arrow: <Path d="M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5" />,
    chevron: <Path d="m10 6 6 6-6 6" />,
    chevronDown: <Path d="m6 10 6 6 6-6" />,
    close: <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
    check: <Path d="m5 12.5 4.5 4.5L19 7.5" />,
    plus: <Path d="M12 5v14M5 12h14" />,
    minus: <Path d="M5 12h14" />,
    clock: (
      <>
        <Rect x={3.75} y={3.75} width={16.5} height={16.5} rx={8.25} />
        <Path d="M12 7.5V12l3 2" />
      </>
    ),
    pin: (
      <>
        <Path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
        <Path d="M12 12.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" />
      </>
    ),
    phone: <Path d="M7.6 3.8 9.9 4.4l1.2 3.9-1.8 1.4a10.5 10.5 0 0 0 5 5l1.4-1.8 3.9 1.2.6 2.3a2 2 0 0 1-2 2.4C10.9 18.6 5.4 13.1 5.2 5.8a2 2 0 0 1 2.4-2Z" />,
    chat: <Path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-7.2L7.5 20.6V17.5H5A1.5 1.5 0 0 1 3.5 16V7A1.5 1.5 0 0 1 5 5.5Z" />,
    heart: <Path d="M12 19.6s-7.5-4.4-7.5-10a4.2 4.2 0 0 1 7.5-2.6 4.2 4.2 0 0 1 7.5 2.6c0 5.6-7.5 10-7.5 10Z" />,
    heartFill: <Path d="M12 19.6s-7.5-4.4-7.5-10a4.2 4.2 0 0 1 7.5-2.6 4.2 4.2 0 0 1 7.5 2.6c0 5.6-7.5 10-7.5 10Z" fill={color} />,
    star: <Path d="m12 3.8 2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.6-4.8 2.6 1-5.4-4-3.7 5.4-.7z" fill={color} />,
    gift: (
      <>
        <Rect x={4} y={9} width={16} height={11.5} rx={2.5} />
        <Path d="M3.5 9h17M12 9v11.5M12 9c-1.6-3.7-6-4-6-1.4C6 9 9.8 9 12 9Zm0 0c1.6-3.7 6-4 6-1.4C18 9 14.2 9 12 9Z" />
      </>
    ),
    ticket: (
      <>
        <Path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v2.3a2.2 2.2 0 0 0 0 4.4v2.3a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-2.3a2.2 2.2 0 0 0 0-4.4z" />
        <Path d="M14.5 6.5v11" strokeDasharray="1.6 2" />
      </>
    ),
    polish: (
      <>
        <Rect x={6.5} y={10} width={11} height={10.5} rx={3} />
        <Path d="M9.5 10V6.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V10M10.2 5.8 9.5 2.8h5l-.7 3" />
        <Path d="M9.2 14.2c1.6.8 4 .8 5.6 0" />
      </>
    ),
    lash: (
      <>
        <Path d="M3.5 12.5c4.6 4.4 12.4 4.4 17 0" />
        <Path d="M6 14.4 4.4 17M9 15.6l-.8 2.9M12 16v3M15 15.6l.8 2.9M18 14.4l1.6 2.6" />
        <Path d="M3.5 12.5c4.6-4.6 12.4-4.6 17 0" opacity={0.45} />
      </>
    ),
    brow: (
      <>
        <Path d="M3.5 13.2c3.1-4.6 9.4-6 17-2.6-6.6-1.3-11.4.2-14.3 4.3z" fill={color} />
        <Path d="M6.5 17.6c3.2-1.6 7.3-1.8 11 0" opacity={0.45} />
      </>
    ),
    hand: (
      <>
        <Path d="M8.2 12.4V5.8a1.4 1.4 0 0 1 2.8 0v5.4M11 11V4.6a1.4 1.4 0 0 1 2.8 0V11M13.8 11.2V6a1.4 1.4 0 0 1 2.8 0v6.8M16.6 9.4a1.4 1.4 0 0 1 2.8 0V14a6.5 6.5 0 0 1-6.5 6.5h-.6a6.3 6.3 0 0 1-5-2.4l-2.9-3.8a1.5 1.5 0 0 1 2.3-1.9l1.5 1.8" />
      </>
    ),
    palette: (
      <>
        <Path d="M12 3.8a8.2 8.2 0 0 0 0 16.4c1.3 0 1.9-.8 1.9-1.7 0-1.4-1.3-1.8-1.3-3 0-1 .8-1.6 1.8-1.6h2.1a3.7 3.7 0 0 0 3.7-3.7C20.2 6.6 16.6 3.8 12 3.8Z" />
        <Rect x={7.2} y={9.4} width={2.2} height={2.2} rx={1.1} fill={color} />
        <Rect x={10.4} y={6.4} width={2.2} height={2.2} rx={1.1} fill={color} />
        <Rect x={14.2} y={7.4} width={2.2} height={2.2} rx={1.1} fill={color} />
      </>
    ),
    camera: (
      <>
        <Path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.5-2h5.6l1.5 2h2.2A1.5 1.5 0 0 1 20 8.5v9.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" />
        <Path d="M12 16.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" />
      </>
    ),
    share: (
      <>
        <Path d="M12 14.5V3.8M8 7.5l4-3.7 4 3.7" />
        <Path d="M7.5 10.5H6A1.5 1.5 0 0 0 4.5 12v7A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1.5" />
      </>
    ),
    globe: (
      <>
        <Rect x={3.75} y={3.75} width={16.5} height={16.5} rx={8.25} />
        <Path d="M3.9 12h16.2M12 3.9c2.2 2.3 3.2 5 3.2 8.1s-1 5.8-3.2 8.1M12 3.9C9.8 6.2 8.8 8.9 8.8 12s1 5.8 3.2 8.1" />
      </>
    ),
    instagram: (
      <>
        <Rect x={4} y={4} width={16} height={16} rx={5} />
        <Path d="M12 15.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z" />
        <Rect x={16.1} y={6.6} width={1.6} height={1.6} rx={0.8} fill={color} />
      </>
    ),
    tiktok: <Path d="M14.2 3.8v10.6a3.6 3.6 0 1 1-3.6-3.6M14.2 3.8c.4 2.4 2 4 4.6 4.2" />,
    swap: <Path d="M7 7.5h11.5L15 4M17 16.5H5.5L9 20" />,
    flame: <Path d="M12 20.5a6 6 0 0 0 6-6c0-3.6-2.6-5.6-3.7-9.2-1.8 1.3-2.6 3.3-2.6 5-1.2-.8-1.8-1.9-2-3.1-2 1.8-3.7 4.4-3.7 7.3a6 6 0 0 0 6 6Z" />,
    wand: (
      <>
        <Path d="m4.5 19.5 10.2-10.2M13 7.6l1.8-1.8 3.4 3.4-1.8 1.8" />
        <Path d="M18.5 3.5v2.4M17.3 4.7h2.4M20 13v1.8M19.1 13.9h1.8M10 3.8v1.8M9.1 4.7h1.8" />
      </>
    ),
    cards: (
      <>
        <Rect x={7.5} y={3.8} width={12} height={15} rx={3} />
        <Path d="M5.4 7.2 4.2 7.6a1.5 1.5 0 0 0-.9 1.9l3.4 9.6a1.5 1.5 0 0 0 1.9.9l1.2-.4" />
      </>
    ),
    truck: (
      <>
        <Path d="M3.5 6.5h10.5v10H3.5zM14 10h3.6l2.9 3.2v3.3H14" />
        <Path d="M7 19.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8ZM17 19.4a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z" />
      </>
    ),
    store: (
      <>
        <Path d="M4.5 9.5V20h15V9.5" />
        <Path d="M3.5 9.5 5 4.5h14l1.5 5c0 1.4-1.2 2.4-2.6 2.4s-2.6-1-2.6-2.4c0 1.4-1.2 2.4-2.8 2.4S9.7 10.9 9.7 9.5c0 1.4-1.2 2.4-2.6 2.4S3.5 10.9 3.5 9.5Z" />
        <Path d="M10 20v-4.5h4V20" />
      </>
    ),
    card: (
      <>
        <Rect x={3.5} y={5.5} width={17} height={13} rx={3} />
        <Path d="M3.5 10h17M7 15h4" />
      </>
    ),
    refresh: <Path d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5M19.5 4.5v4h-4" />,
    settings: (
      <>
        <Path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9" />
        <Rect x={13} y={5.2} width={4.2} height={4.6} rx={2.1} />
        <Rect x={6.8} y={14.2} width={4.2} height={4.6} rx={2.1} />
      </>
    ),
    help: (
      <>
        <Rect x={3.75} y={3.75} width={16.5} height={16.5} rx={8.25} />
        <Path d="M9.6 9.4a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2-2.4 3.6M12 17.2v.1" />
      </>
    ),
    play: <Path d="M8 5.5v13l10.5-6.5z" fill={color} />,
    qr: (
      <>
        <Rect x={4} y={4} width={6.5} height={6.5} rx={1.5} />
        <Rect x={13.5} y={4} width={6.5} height={6.5} rx={1.5} />
        <Rect x={4} y={13.5} width={6.5} height={6.5} rx={1.5} />
        <Path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 19.5h1.5M19.5 14v1.5" />
      </>
    ),
  };
}

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

/** Blanche's icons: rounded, a little heavier than a hairline, with filled marks where a shape reads better solid. */
export function Icon({ name, size = 22, color, strokeWidth = 1.8 }: Props) {
  const theme = useTheme();
  const stroke = color ?? theme.c.ink;
  const flip = theme.rtl && DIRECTIONAL.includes(name);
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={flip ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      {shapes(stroke)[name]}
    </Svg>
  );
}
