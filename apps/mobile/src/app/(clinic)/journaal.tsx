import { CLINIC_COLORS } from '@pure-clinics/shared';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cityName, roleKey, useClinic, type AppointmentView } from '@/clinic';
import { useTheme } from '@/theme';

/** A private timeline of treatments with the photos taken around them. */
export default function JournalScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const clinic = useClinic();
  const toast = useToast();

  return (
    <Screen gap={24}>
      <View style={{ flexDirection: 'row' }}>
        <IconButton icon="back" label={t('common.back')} tone="surface" onPress={() => router.back()} />
      </View>
      <View style={{ gap: 10 }}>
        <Txt variant="display">{t('clinic.journal.title')}</Txt>
        <Badge label={t('clinic.journal.private')} tone="outline" icon="lock" />
        <Txt variant="body" color={theme.c.muted}>
          {t('clinic.journal.body')}
        </Txt>
      </View>

      <Button kind="secondary" icon="camera" label={t('clinic.journal.add')} onPress={() => toast(t('common.demoNote'))} />

      {clinic.next ? <Entry appointment={clinic.next} upcoming /> : null}
      {clinic.past.map((a) => (
        <Entry key={a.id} appointment={a} />
      ))}
    </Screen>
  );
}

function Entry({ appointment, upcoming }: { appointment: AppointmentView; upcoming?: boolean }) {
  const theme = useTheme();
  const { t, text, dayShort } = useI18n();
  const toast = useToast();
  const { treatment, specialist, location } = appointment;
  return (
    <View style={{ gap: 10 }}>
      <Txt variant="eyebrow" color={theme.c.muted}>
        {upcoming ? `${t('clinic.appts.upcoming')} · ${dayShort(appointment.start)}` : `${dayShort(appointment.start)} · ${cityName(location)}`}
      </Txt>
      {upcoming ? (
        <View
          style={{
            height: 150,
            borderRadius: theme.r.card,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: CLINIC_COLORS.dashed,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Icon name="camera" size={24} color={theme.c.muted} />
          <Txt variant="small" color={theme.c.muted} onPress={() => toast(t('common.demoNote'))}>
            {t('clinic.journal.add')}
          </Txt>
        </View>
      ) : (
        <Photo photo={treatment.photo} style={{ height: 210, borderRadius: theme.r.card }} />
      )}
      <View style={{ gap: 2 }}>
        <Txt variant="heading">{text(treatment.name)}</Txt>
        <Txt variant="small" color={theme.c.muted}>{`${specialist.name} · ${t(roleKey(specialist.role))}`}</Txt>
      </View>
    </View>
  );
}
