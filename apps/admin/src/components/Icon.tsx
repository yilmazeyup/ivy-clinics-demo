const PATHS = {
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M8 6.5h12M8 12h12M8 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01',
  calendar: 'M4 6.5h16v13.5H4zM4 10.5h16M8.5 3.5v5M15.5 3.5v5',
  users: 'M3.5 19.5v-1a4.5 4.5 0 0 1 4.5-4.5h3a4.5 4.5 0 0 1 4.5 4.5v1M9.5 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM16.5 4.8a3.2 3.2 0 0 1 0 6.2M20.5 19.5v-1a4 4 0 0 0-3-3.9',
  card: 'M3.5 6.5h17v11h-17zM3.5 10h17M7 14.5h4',
  chat: 'M4 5.5h16v10.5H9l-5 4z',
  mail: 'M4 6h16v12H4zM4.5 7l7.5 6 7.5-6',
  sliders: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4.5v5M8 14.5v5',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20',
  bell: 'M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15zM10 20.5h4',
  sparkle:
    'M12 3.5 13.8 9a2 2 0 0 0 1.2 1.2l5.5 1.8-5.5 1.8a2 2 0 0 0-1.2 1.2L12 20.5 10.2 15a2 2 0 0 0-1.2-1.2L3.5 12 9 10.2A2 2 0 0 0 10.2 9L12 3.5Z',
  play: 'M7.5 5v14l11.5-7z',
  stop: 'M7 7h10v10H7z',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  scan: 'M4 8.5V4h4.5M15.5 4H20v4.5M20 15.5V20h-4.5M8.5 20H4v-4.5M7.5 12h9',
  trend: 'M3.5 16.5 9 11l4 4 7.5-7.5M15 7.5h5.5V13',
  up: 'M12 18V6M7 11l5-5 5 5',
  down: 'M12 6v12M7 13l5 5 5-5',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6 6 18',
  bag: 'M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8',
  undo: 'M9 6.5 4.5 11 9 15.5M5 11h10a4.5 4.5 0 0 1 0 9h-3',
  queue: 'M4 6h12M4 12h12M4 18h7M17 15v6M14 18h6',
  star: 'M12 3.8l2.5 5.3 5.7.7-4.2 3.9 1.1 5.7L12 16.6l-5.1 2.8 1.1-5.7-4.2-3.9 5.7-.7z',
  clipboard: 'M8 4.5h8v3H8zM6 6H4.5v14.5h15V6H18M8 12h8M8 16h5',
  pin: 'M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 1 1 13 0c0 4.8-6.5 11-6.5 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, stroke = 1.6 }: { name: IconName; size?: number; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
