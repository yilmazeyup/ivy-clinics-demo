import { router } from 'expo-router';
import { View } from 'react-native';

import { useI18n } from '@/i18n';
import { usePilates } from '@/pilates';
import { useTheme } from '@/theme';

import { Button } from './Button';
import { Icon } from './Icon';
import { Txt } from './Txt';

/** The member's pilates credits, with a way to buy more in the shop. */
export function CreditsBar() {
  const theme = useTheme();
  const { t, tp } = useI18n();
  const pilates = usePilates();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        paddingStart: 16,
        borderRadius: theme.r.card,
        backgroundColor: theme.c.surface,
      }}
    >
      <Icon name="ticket" size={20} color={theme.c.primary} />
      <View style={{ flex: 1 }}>
        <Txt variant="caption" color={theme.c.muted}>
          {t('pilates.studio.balance')}
        </Txt>
        <Txt variant="bodyStrong">{pilates.unlimited ? t('pilates.pkg.unlimited') : tp('common.credit', pilates.credits)}</Txt>
      </View>
      <Button
        kind="secondary"
        size="sm"
        label={t('pilates.studio.buyCredits')}
        onPress={() => router.navigate({ pathname: '/ivy/shop', params: { category: 'pilates', at: String(Date.now()) } })}
      />
    </View>
  );
}
