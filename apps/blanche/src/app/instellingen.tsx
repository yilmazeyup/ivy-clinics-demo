import { LOCALE_NAMES, LOCALES } from '@pure-clinics/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Squish } from '@/components/Motion';
import { Screen, useModalTop } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { Wordmark } from '@/components/Wordmark';
import { useI18n } from '@/i18n';
import { useDemo } from '@/state/demo';
import { useTheme } from '@/theme';

export default function Settings() {
  const theme = useTheme();
  const { t } = useI18n();
  const { locale, setLocale, reset } = useDemo();
  const [resetDone, setResetDone] = useState(false);
  const top = useModalTop();

  return (
    <Screen gap={26} sheet contentStyle={{ paddingTop: top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="display">{t('settings.title')}</Txt>
        <IconButton icon="close" label={t('common.close')} tone="chalk" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="tag" color={theme.c.muted}>
          {t('settings.language')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LOCALES.map((code) => {
            const on = code === locale;
            return (
              <Squish
                key={code}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setLocale(code)}
                scaleTo={0.92}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  height: 48,
                  paddingHorizontal: 18,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: on ? theme.c.ink : theme.c.lineStrong,
                  backgroundColor: on ? theme.c.ink : '#FFFFFF',
                }}
              >
                {on ? <Icon name="check" size={16} color="#FFFFFF" strokeWidth={2.6} /> : null}
                <Txt
                  variant="bodyStrong"
                  color={on ? '#FFFFFF' : theme.c.ink}
                  style={code === 'ar' ? { fontFamily: 'IBMPlexSansArabic_500Medium' } : undefined}
                >
                  {LOCALE_NAMES[code]}
                </Txt>
              </Squish>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Button
          kind="outline"
          label={resetDone ? t('settings.resetDone') : t('settings.reset')}
          icon={resetDone ? 'check' : 'refresh'}
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

      <View style={{ alignItems: 'center', paddingTop: 20, gap: 6 }}>
        <Wordmark size={40} />
        <Txt variant="caption" color={theme.c.muted}>
          {t('settings.by')}
        </Txt>
      </View>
    </Screen>
  );
}
