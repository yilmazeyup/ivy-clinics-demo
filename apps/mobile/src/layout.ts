import { Platform, useWindowDimensions } from 'react-native';

/** From this width on, the web app is laid out as a website: a menu at the top and content in a centred column. */
const WIDE = 960;

/** How wide content gets on a big screen: the main pages use the whole column, detail pages stay narrower. */
export const PAGE_WIDTH = 1160;
export const DETAIL_WIDTH = 760;

export type Layout = {
  wide: boolean;
  /** Space between the content and the edge of the window. */
  gutter: number;
  /** The width content really gets in a column of at most `max`, for grids that size their own tiles. */
  inner: (max: number) => number;
};

/** Phones keep the app layout; a computer screen in the browser gets the website layout. */
export function useLayout(): Layout {
  const { width } = useWindowDimensions();
  const wide = Platform.OS === 'web' && width >= WIDE;
  const gutter = wide ? 40 : 20;
  return { wide, gutter, inner: (max) => (wide ? Math.min(width, max + gutter * 2) : width) - gutter * 2 };
}

/**
 * Offsets from the start or the end edge for absolutely placed things. The web build turns `start` and `end`
 * into left and right whatever the reading direction, so these give the physical side for the language.
 */
export const startEdge = (rtl: boolean, value: number) => (rtl ? { right: value } : { left: value });
export const endEdge = (rtl: boolean, value: number) => (rtl ? { left: value } : { right: value });
