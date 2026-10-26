import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useDemo } from '@/state/demo';
import { BrandContext, makeTheme } from '@/theme';

// Screens opened by a link still get the tabs underneath, so modals open as sheets and back works.
export const unstable_settings = { anchor: '(tabs)' };

export default function IvyLayout() {
  const { locale, setBrand } = useDemo();
  const theme = makeTheme('ivy', locale);
  // Keep the app-wide brand in step, e.g. when this part of the app is opened by a link.
  useEffect(() => setBrand('ivy'), [setBrand]);
  return (
    <BrandContext.Provider value="ivy">
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.c.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="afspraak/[treatmentId]" />
        <Stack.Screen name="bevestiging/[id]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="advies" options={{ presentation: 'modal' }} />
        <Stack.Screen name="les/[id]" />
        <Stack.Screen name="ticket/[id]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="assistent" options={{ presentation: 'modal' }} />
        <Stack.Screen name="journaal" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="winkelmand" />
        <Stack.Screen name="afrekenen" />
        <Stack.Screen name="bestelling/[id]" options={{ gestureEnabled: false }} />
      </Stack>
    </BrandContext.Provider>
  );
}
