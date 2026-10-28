import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import { IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { PinyonScript_400Regular } from '@expo-google-fonts/pinyon-script';
import { LOCALES, type Locale } from '@pure-clinics/shared';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { LocaleProvider, router, Stack, useGlobalSearchParams } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
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
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    PinyonScript_400Regular,
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
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

/** Applies the page colour and the reading direction (Arabic flips the whole layout). */
function Shell() {
  const theme = useTheme();
  const direction = theme.rtl ? 'rtl' : 'ltr';
  const { setLocale } = useDemo();
  const { wide } = useLayout();
  // The opening animation plays once, each time the app starts; on the web ?intro=0 skips it (for screenshots and links).
  const [intro, setIntro] = useState(() => !(Platform.OS === 'web' && new URLSearchParams(globalThis.location?.search ?? '').get('intro') === '0'));
  // A link such as blanchebeauty://?lang=ar opens the demo straight in that language.
  const url = Linking.useURL();
  useEffect(() => {
    const lang = url ? Linking.parse(url).queryParams?.lang : undefined;
    if (typeof lang === 'string' && (LOCALES as readonly string[]).includes(lang)) setLocale(lang as Locale);
  }, [url, setLocale]);
  useDeepLinkFromFallback();
  return (
    <LocaleProvider direction={direction}>
      <View style={{ flex: 1, direction, backgroundColor: theme.c.paper }}>
        <ToastProvider>
          <StatusBar style="dark" />
          {wide ? <SiteHeader /> : null}
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.c.paper } }}>
            <Stack.Screen name="(studio)" />
            <Stack.Screen name="instellingen" options={{ presentation: 'modal' }} />
          </Stack>
        </ToastProvider>
        {intro ? <Intro onDone={() => setIntro(false)} /> : null}
      </View>
    </LocaleProvider>
  );
}

/**
 * On the demo site an unknown address (a page link opened directly) first lands on the start page with the path in
 * `?pad=`; this sends it on to that page once, behind the opening animation.
 */
function useDeepLinkFromFallback() {
  const { pad } = useGlobalSearchParams<{ pad?: string }>();
  useEffect(() => {
    if (typeof pad === 'string' && pad.startsWith('/') && pad.length > 1) {
      const id = setTimeout(() => router.replace(pad as never), 50);
      return () => clearTimeout(id);
    }
  }, [pad]);
}
