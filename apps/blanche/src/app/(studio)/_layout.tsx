import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

// Screens opened by a link still get the tabs underneath, so modals open as sheets and back works.
export const unstable_settings = { anchor: '(tabs)' };

export default function StudioLayout() {
  const theme = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.c.paper } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="behandeling/[id]" />
      <Stack.Screen name="afspraak/[serviceId]" />
      <Stack.Screen name="bevestiging/[id]" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="stories" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      <Stack.Screen name="kleurstudio" options={{ presentation: 'modal' }} />
      <Stack.Screen name="inspiratie" options={{ presentation: 'modal' }} />
      <Stack.Screen name="contact" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="winkelmand" />
      <Stack.Screen name="afrekenen" />
      <Stack.Screen name="bestelling/[id]" options={{ gestureEnabled: false, animation: 'fade' }} />
    </Stack>
  );
}
