import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import { Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold } from '@expo-google-fonts/archivo';
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
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/Toast';
import { DemoProvider, useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    'ArchivoRoman-ExpandedSemiBold': require('../../assets/fonts/ArchivoRoman-ExpandedSemiBold.ttf'),
    'ArchivoRoman-SemiExpandedSemiBold': require('../../assets/fonts/ArchivoRoman-SemiExpandedSemiBold.ttf'),
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

/** Applies the brand background and the reading direction (Arabic flips the whole layout). */
function Shell() {
  const theme = useTheme();
  const direction = theme.rtl ? 'rtl' : 'ltr';
  const { setLocale } = useDemo();
  // A link such as pureivy://ivy?lang=ar opens the demo straight in that language. Read from the incoming
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
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.c.bg } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="ivy" />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          </Stack>
        </ToastProvider>
      </View>
    </LocaleProvider>
  );
}
