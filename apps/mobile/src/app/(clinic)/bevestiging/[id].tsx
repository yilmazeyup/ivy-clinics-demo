import { CLINIC_COLORS, MEMBER } from '@pure-clinics/shared';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cityName, roleKey, useClinic } from '@/clinic';
import { useTheme } from '@/theme';

// Back to the tabs underneath, then to the Home tab.
function home() {
  if (router.canDismiss()) router.dismissAll();
  router.navigate('/');
}

export default function ConfirmationScreen() {
  const theme = useTheme();
  const { id, moved } = useLocalSearchParams<{ id: string; moved?: string }>();
  const { t, text, euro, dayLong, time } = useI18n();
  const clinic = useClinic();
  const toast = useToast();
  const appointment = clinic.byId(id);
  if (!appointment) return <Redirect href="/" />;
  const { treatment, specialist, location } = appointment;
  const end = new Date(appointment.start.getTime() + treatment.minutes * 60000);
  const status = moved
    ? t('clinic.confirm.moved')
    : treatment.deposit
      ? t('clinic.confirm.paid', { amount: euro(treatment.deposit) })
      : treatment.priceFrom
        ? t('clinic.confirm.booked')
        : t('clinic.confirm.free');

  return (
    <Screen gap={24}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <IconButton icon="close" label={t('common.close')} tone="surface" onPress={home} />
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="hero">{t('clinic.confirm.title', { name: MEMBER.firstName })}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="check" size={18} color={theme.c.primary} strokeWidth={2} />
          <Txt variant="body" color={CLINIC_COLORS.body} style={{ flex: 1 }}>
            {status}
          </Txt>
        </View>
      </View>

      <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, overflow: 'hidden' }}>
        <Photo photo={treatment.photo} style={{ height: 170 }} />
        <View style={{ padding: 18, gap: 14 }}>
          <Txt variant="title">{text(treatment.name)}</Txt>
          <Row icon="calendar" value={dayLong(appointment.start)} />
          {/* The left-to-right mark keeps "10:30–11:15" in order inside Arabic text. */}
          <Row icon="clock" value={`\u200E${time(appointment.start)}–${time(end)}`} />
          <Row icon="user" value={`${specialist.name} · ${t(roleKey(specialist.role))}`} />
          <Row icon="pin" value={`${cityName(location)} · ${location.address}`} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button kind="secondary" size="sm" icon="calendar" label={t('clinic.confirm.calendar')} onPress={() => toast(t('common.demoNote'))} style={{ flex: 1 }} />
        <Button kind="secondary" size="sm" icon="pin" label={t('clinic.confirm.route')} onPress={() => toast(t('common.demoNote'))} style={{ flex: 1 }} />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => toast(t('common.demoNote'))}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 16,
          borderRadius: theme.r.card,
          backgroundColor: theme.c.sand,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: theme.c.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="list" size={20} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong">{t('clinic.confirm.intake')}</Txt>
          <Txt variant="small" color={CLINIC_COLORS.body}>
            {t('clinic.confirm.intakeBody', { name: specialist.name })}
          </Txt>
        </View>
        <Icon name="chevron" size={18} color={theme.c.muted} />
      </Pressable>

      <Button label={t('clinic.confirm.home')} onPress={home} />
    </Screen>
  );
}

function Row({ icon, value }: { icon: IconName; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Icon name={icon} size={18} color={theme.c.muted} />
      <Txt variant="body" style={{ flex: 1 }}>
        {value}
      </Txt>
    </View>
  );
}
