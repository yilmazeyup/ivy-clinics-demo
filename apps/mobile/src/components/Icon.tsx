import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme';

export type IconName =
  | 'home'
  | 'calendar'
  | 'calendarPlus'
  | 'list'
  | 'bag'
  | 'user'
  | 'bell'
  | 'search'
  | 'sliders'
  | 'sparkle'
  | 'mic'
  | 'back'
  | 'arrow'
  | 'chevron'
  | 'chevronDown'
  | 'check'
  | 'clock'
  | 'pin'
  | 'wallet'
  | 'share'
  | 'heart'
  | 'plus'
  | 'close'
  | 'users'
  | 'leaf'
  | 'camera'
  | 'globe'
  | 'gift'
  | 'video'
  | 'ticket'
  | 'lock'
  | 'activity'
  | 'minus'
  | 'truck';

// Arrows and chevrons point the other way in right-to-left layouts.
const DIRECTIONAL: IconName[] = ['back', 'arrow', 'chevron'];

const SHAPES: Record<IconName, ReactNode> = {
  home: (
    <>
      <Path d="M3 10.5 12 3l9 7.5" />
      <Path d="M5 9.5V20h14V9.5" />
    </>
  ),
  calendar: (
    <>
      <Rect x={3.5} y={5} width={17} height={15} rx={2.5} />
      <Path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </>
  ),
  calendarPlus: (
    <>
      <Rect x={3.5} y={5} width={17} height={15} rx={2.5} />
      <Path d="M3.5 9.5h17M8 3v4M16 3v4M12 12.5v5M9.5 15h5" />
    </>
  ),
  list: (
    <>
      <Rect x={4} y={3.5} width={16} height={17} rx={2.5} />
      <Path d="M8 9h8M8 13h8M8 17h5" />
    </>
  ),
  bag: (
    <>
      <Path d="M5 8h14l-1 12H6L5 8Z" />
      <Path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  user: (
    <>
      <Path d="M12 12.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
      <Path d="M4 21c1.2-4 4.4-6 8-6s6.8 2 8 6" />
    </>
  ),
  bell: (
    <>
      <Path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
      <Path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  search: (
    <>
      <Circle cx={11} cy={11} r={6.5} />
      <Path d="m20 20-4.2-4.2" />
    </>
  ),
  sliders: (
    <>
      <Path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <Circle cx={16} cy={7} r={2} />
      <Circle cx={10} cy={17} r={2} />
    </>
  ),
  sparkle: <Path d="M12 3.5 13.8 9a2 2 0 0 0 1.2 1.2l5.5 1.8-5.5 1.8a2 2 0 0 0-1.2 1.2L12 20.5 10.2 15a2 2 0 0 0-1.2-1.2L3.5 12 9 10.2A2 2 0 0 0 10.2 9L12 3.5Z" />,
  mic: (
    <>
      <Rect x={9} y={3} width={6} height={11} rx={3} />
      <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </>
  ),
  back: <Path d="M19 12H5M11 6l-6 6 6 6" />,
  arrow: <Path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <Path d="m9 6 6 6-6 6" />,
  chevronDown: <Path d="m6 9 6 6 6-6" />,
  check: <Path d="m5 12.5 4.5 4.5L19 7.5" />,
  clock: (
    <>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M12 7.5V12l3 2" />
    </>
  ),
  pin: (
    <>
      <Path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <Circle cx={12} cy={10} r={2.3} />
    </>
  ),
  wallet: (
    <>
      <Rect x={3} y={6} width={18} height={14} rx={2.5} />
      <Path d="M3 10.5h18M16 15h2" />
    </>
  ),
  share: (
    <>
      <Path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" />
      <Path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12" />
    </>
  ),
  heart: <Path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  close: <Path d="M6 6l12 12M18 6 6 18" />,
  users: (
    <>
      <Circle cx={9} cy={8.5} r={3.5} />
      <Path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <Path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.3a6.5 6.5 0 0 1 3.5 5.7" />
    </>
  ),
  leaf: (
    <>
      <Path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" />
      <Path d="M5 19 14 10" />
    </>
  ),
  camera: (
    <>
      <Path d="M4 8h3l1.5-2.5h7L17 8h3v11H4V8Z" />
      <Circle cx={12} cy={13.5} r={3.5} />
    </>
  ),
  globe: (
    <>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M3.5 12h17M12 3.5c2.5 2.6 3.8 5.4 3.8 8.5s-1.3 5.9-3.8 8.5c-2.5-2.6-3.8-5.4-3.8-8.5s1.3-5.9 3.8-8.5Z" />
    </>
  ),
  gift: (
    <>
      <Rect x={3.5} y={8} width={17} height={4} rx={1} />
      <Path d="M5 12v8h14v-8M12 8v12M12 8C10 4.5 7 5 7.2 6.8 7.4 8.2 12 8 12 8Zm0 0c2-3.5 5-3 4.8-1.2C16.6 8.2 12 8 12 8Z" />
    </>
  ),
  video: (
    <>
      <Rect x={3} y={6} width={13} height={12} rx={2} />
      <Path d="m16 10 5-3v10l-5-3" />
    </>
  ),
  ticket: <Path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7ZM14 7v10" />,
  activity: <Path d="M3 12h4l3-7 4 14 3-7h4" />,
  minus: <Path d="M5 12h14" />,
  truck: (
    <>
      <Path d="M3 6.5h11v9H3zM14 9.5h3.5l3 3v3H14z" />
      <Rect x={5.5} y={15.5} width={3} height={3} rx={1} />
      <Rect x={15.5} y={15.5} width={3} height={3} rx={1} />
    </>
  ),
  lock: (
    <>
      <Rect x={5} y={10.5} width={14} height={10} rx={2} />
      <Path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
};

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

export function Icon({ name, size = 22, color, strokeWidth }: Props) {
  const theme = useTheme();
  const flip = theme.rtl && DIRECTIONAL.includes(name);
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? theme.c.ink}
      strokeWidth={strokeWidth ?? theme.stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={flip ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      {SHAPES[name]}
    </Svg>
  );
}
