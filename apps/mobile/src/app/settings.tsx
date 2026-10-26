import { LOCALE_NAMES, LOCALES } from '@pure-ivy/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Screen, useModalTop } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

export default function Settings() {
  const theme = useTheme();
  const { t } = useI18n();
  const { locale, setLocale, reset } = useDemo();
  // Sheets sit above the app-wide toast, so the reset confirms itself on the button.
  const [resetDone, setResetDone] = useState(false);
  const top = useModalTop();

  return (
    <Screen gap={26} sheet contentStyle={{ paddingTop: top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="display">{t('settings.title')}</Txt>
        <IconButton icon="close" label={t('common.close')} tone="surface" onPress={() => router.back()} />
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="eyebrow" color={theme.c.muted}>
          {t('settings.language')}
        </Txt>
        <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, overflow: 'hidden' }}>
          {LOCALES.map((code, index) => {
            const active = code === locale;
            return (
              <Pressable
                key={code}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => setLocale(code)}
                style={({ pressed }) => ({
                  minHeight: 54,
                  paddingHorizontal: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: theme.c.line,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Txt variant="body" style={{ fontFamily: code === 'ar' ? 'IBMPlexSansArabic_500Medium' : active ? theme.f.strong : theme.f.body }}>
                  {LOCALE_NAMES[code]}
                </Txt>
                {active ? <Icon name="check" size={20} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Button
          kind="secondary"
          label={resetDone ? t('settings.resetDone') : t('settings.reset')}
          icon={resetDone ? 'check' : undefined}
          onPress={() => {
            reset();
            setResetDone(true);
            setTimeout(() => setResetDone(false), 2600);
          }}
        />
        <Txt variant="small" color={theme.c.muted}>
          {t('settings.about')}
        </Txt>
      </View>
    </Screen>
  );
}
