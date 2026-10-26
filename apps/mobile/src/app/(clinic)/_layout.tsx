import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

// Screens opened by a link still get the tabs underneath, so modals open as sheets and back works.
export const unstable_settings = { anchor: '(tabs)' };

export default function ClinicLayout() {
  const theme = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.c.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="behandeling/[id]" />
      <Stack.Screen name="afspraak/[treatmentId]" />
      <Stack.Screen name="bevestiging/[id]" options={{ gestureEnabled: false }} />
      <Stack.Screen name="advies" options={{ presentation: 'modal' }} />
      <Stack.Screen name="assistent" options={{ presentation: 'modal' }} />
      <Stack.Screen name="journaal" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="winkelmand" />
      <Stack.Screen name="afrekenen" />
      <Stack.Screen name="bestelling/[id]" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
