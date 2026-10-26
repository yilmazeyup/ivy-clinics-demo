import type { PhotoKey } from '@pure-clinics/shared';
import { Image, type ImageContentPosition } from 'expo-image';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, StyleSheet, type ViewInstance } from 'react-native';

import { PHOTOS } from '@/photos';

import { EASE_OUT, prefersReducedMotion } from './Motion';

export type Rect = { x: number; y: number; width: number; height: number };

type Flight = { photo: PhotoKey; from: Rect; radius: number; position?: ImageContentPosition; to?: Rect; toRadius?: number };

type Morph = {
  /** Lifts a photo off the page at the place it is shown; the page that opens next catches it. */
  launch: (photo: PhotoKey, from: Rect, radius: number, position?: ImageContentPosition) => void;
  /** The opening page says where its big photo sits, and the flying one glides there. */
  land: (photo: PhotoKey, to: Rect, radius: number) => void;
  /** The photo still in the air; the landing page keeps its own copy hidden until it arrives. */
  airborne: PhotoKey | null;
};

const MorphContext = createContext<Morph>({ launch: () => {}, land: () => {}, airborne: null });

export const useMorph = () => useContext(MorphContext);

/**
 * Shared-element transitions: a tapped card's photo grows into the header photo of the page it opens,
 * so the two pages read as one continuous space. Hosts the flying photo above everything else.
 */
export function MorphProvider({ children }: PropsWithChildren) {
  const [flight, setFlight] = useState<Flight | null>(null);
  const [airborne, setAirborne] = useState<PhotoKey | null>(null);
  const current = useRef<Flight | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const veil = useRef(new Animated.Value(1)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    // The page's own photo is in place underneath; the flying copy dissolves into it.
    setAirborne(null);
    Animated.timing(veil, { toValue: 0, duration: 180, useNativeDriver: false }).start(() => {
      current.current = null;
      setFlight(null);
    });
  }, [veil]);

  const launch = useCallback(
    (photo: PhotoKey, from: Rect, radius: number, position?: ImageContentPosition) => {
      if (prefersReducedMotion() || from.width === 0) return;
      if (timer.current) clearTimeout(timer.current);
      progress.setValue(0);
      veil.setValue(1);
      const next = { photo, from, radius, position };
      current.current = next;
      setFlight(next);
      setAirborne(photo);
      // If no page catches it in time, it just fades away.
      timer.current = setTimeout(() => {
        if (current.current && !current.current.to) finish();
      }, 900);
    },
    [progress, veil, finish],
  );

  const land = useCallback(
    (photo: PhotoKey, to: Rect, radius: number) => {
      const flying = current.current;
      if (!flying || flying.photo !== photo || flying.to) return;
      const next = { ...flying, to, toRadius: radius };
      current.current = next;
      setFlight(next);
      Animated.timing(progress, { toValue: 1, duration: 620, easing: EASE_OUT, useNativeDriver: false }).start(finish);
    },
    [progress, finish],
  );

  const value = useMemo(() => ({ launch, land, airborne }), [launch, land, airborne]);
  const between = (a: number, b: number) => progress.interpolate({ inputRange: [0, 1], outputRange: [a, b] });

  return (
    <MorphContext.Provider value={value}>
      {children}
      {flight ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            zIndex: 60,
            overflow: 'hidden',
            left: flight.to ? between(flight.from.x, flight.to.x) : flight.from.x,
            top: flight.to ? between(flight.from.y, flight.to.y) : flight.from.y,
            width: flight.to ? between(flight.from.width, flight.to.width) : flight.from.width,
            height: flight.to ? between(flight.from.height, flight.to.height) : flight.from.height,
            borderRadius: flight.to ? between(flight.radius, flight.toRadius ?? 0) : flight.radius,
            opacity: veil,
          }}
        >
          <Image source={PHOTOS[flight.photo]} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={flight.position ?? 'center'} />
        </Animated.View>
      ) : null}
    </MorphContext.Provider>
  );
}

/** Wraps a card's photo so a tap can lift it: call `lift()`, then open the page. */
export function useMorphSource(photo: PhotoKey, radius: number, position?: ImageContentPosition) {
  const ref = useRef<ViewInstance>(null);
  const { launch } = useMorph();
  const lift = useCallback(
    () =>
      new Promise<void>((resolve) => {
        const node = ref.current;
        if (!node) return resolve();
        node.measureInWindow((x, y, width, height) => {
          launch(photo, { x, y, width, height }, radius, position);
          resolve();
        });
      }),
    [launch, photo, radius, position],
  );
  return { ref, lift };
}
