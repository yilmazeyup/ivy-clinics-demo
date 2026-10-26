import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import { IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { Jost_300Light, Jost_400Regular, Jost_500Medium } from '@expo-google-fonts/jost';
import { useFonts } from 'expo-font';
import { LOCALES, type Locale } from '@pure-ivy/shared';
import * as Linking from 'expo-linking';
import { LocaleProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Intro } from '@/components/Intro';
import { SiteHeader } from '@/components/SiteHeader';
import { ToastProvider } from '@/components/Toast';
import { useLayout } from '@/layout';
import { DemoProvider, useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    Jost_300Light,
    Jost_400Regular,
    Jost_500Medium,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    Amiri_400Regular,
    Amiri_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <DemoProvider>
        <Shell />
      </DemoProvider>
    </SafeAreaProvider>
  );
}

/** Applies the clinic's background and the reading direction (Arabic flips the whole layout). */
function Shell() {
  const theme = useTheme();
  const direction = theme.rtl ? 'rtl' : 'ltr';
  const { setLocale } = useDemo();
  const { wide } = useLayout();
  // The opening animation plays once, each time the app starts.
  const [intro, setIntro] = useState(true);
  // A link such as pureclinics://?lang=ar opens the demo straight in that language. Read from the incoming
  // link itself, not from route params, which stay on a screen and would switch the language back later.
  const url = Linking.useURL();
  useEffect(() => {
    const lang = url ? Linking.parse(url).queryParams?.lang : undefined;
    if (typeof lang === 'string' && (LOCALES as readonly string[]).includes(lang)) setLocale(lang as Locale);
  }, [url, setLocale]);
  return (
    <LocaleProvider direction={direction}>
      <View style={{ flex: 1, direction, backgroundColor: theme.c.bg }}>
        <ToastProvider>
          <StatusBar style="dark" />
          {wide ? <SiteHeader /> : null}
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.c.bg } }}>
            <Stack.Screen name="(clinic)" />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          </Stack>
        </ToastProvider>
        {intro ? <Intro onDone={() => setIntro(false)} /> : null}
      </View>
    </LocaleProvider>
  );
}
