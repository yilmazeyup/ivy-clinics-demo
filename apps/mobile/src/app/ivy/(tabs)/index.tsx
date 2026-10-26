import { CLASS_TYPES, CONCERNS, IVY_COLORS, IVY_MEMBER, locationById, specialistById, timeOfDay } from '@pure-ivy/shared';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { IvyLogo } from '@/components/IvyLogo';
import { Photo } from '@/components/Photo';
import { Rail, Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cityName, useIvy, type AppointmentView } from '@/ivy';
import { useLayout } from '@/layout';
import { spotLines, usePilates, type SessionView } from '@/pilates';
import { useTheme } from '@/theme';

export default function IvyHome() {
  const theme = useTheme();
  const { t, relativeDayInline, time } = useI18n();
  const ivy = useIvy();
  const pilates = usePilates();
  const { wide } = useLayout();
  const greetingKey = `ivy.greeting.${timeOfDay(ivy.now)}` as const;

  const greeting = (
    <View style={{ gap: 8, flex: wide ? 1 : undefined }}>
      <Txt variant="hero" style={wide ? { fontSize: 54, lineHeight: 58 } : undefined}>
        {t(greetingKey, { name: IVY_MEMBER.firstName })}
      </Txt>
      <Txt variant="body" color={theme.c.muted}>
        {ivy.next ? t('ivy.home.nextLine', { when: `${relativeDayInline(ivy.next.start)} · ${time(ivy.next.start)}` }) : t('ivy.home.noNext')}
      </Txt>
    </View>
  );

  // A computer screen: the same parts as on the phone, laid out side by side like a website.
  if (wide) {
    return (
      <Screen gap={44} width="page">
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 40 }}>
          {greeting}
          <View style={{ width: 440 }}>
            <AskIvy />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 24 }}>
          {ivy.next ? (
            <View style={{ flex: 3 }}>
              <NextAppointment appointment={ivy.next} fill />
            </View>
          ) : null}
          <View style={{ flex: 2, gap: 24 }}>
            {pilates.next ? <NextClass session={pilates.next} /> : null}
            <Checkup />
          </View>
        </View>
        <Concerns />
        <View style={{ flexDirection: 'row', gap: 24 }}>
          <View style={{ flex: 1 }}>
            <Consult fill />
          </View>
          <View style={{ flex: 1 }}>
            <SkinAdvice fill />
          </View>
        </View>
        <Facts />
      </Screen>
    );
  }

  return (
    <Screen gap={28}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IvyLogo width={112} />
        <View style={{ flexDirection: 'row', gap: 2 }}>
          <IconButton icon="bell" label={t('common.notifications')} />
          <IconButton icon="user" label={t('common.settings')} onPress={() => router.push('/settings')} />
        </View>
      </View>

      {greeting}

      <AskIvy />
      {ivy.next ? <NextAppointment appointment={ivy.next} /> : null}
      {pilates.next ? <NextClass session={pilates.next} /> : null}
      <Checkup />
      <Concerns />
      <Consult />
      <SkinAdvice />
      <Facts />
    </Screen>
  );
}

/** `fill` stretches the photo to the height of its row, for the website layout. */
function NextAppointment({ appointment, fill }: { appointment: AppointmentView; fill?: boolean }) {
  const theme = useTheme();
  const { t, relativeDay, time, text } = useI18n();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.navigate('/ivy/mijn')} style={fill ? { flex: 1 } : undefined}>
      <Photo photo={appointment.treatment.photo} scrim style={fill ? { flex: 1, minHeight: 360, borderRadius: theme.r.card } : { height: 236, borderRadius: theme.r.card }}>
        <View style={{ position: 'absolute', start: 18, end: 18, bottom: 16, gap: 4 }}>
          <Txt variant="eyebrow" color={theme.c.onPhotoMuted}>
            {t('ivy.home.next')}
          </Txt>
          <Txt variant="title" color="#FFFFFF" accentColor="#FFFFFF">
            {text(appointment.treatment.name)}
          </Txt>
          <Txt variant="small" color={theme.c.onPhotoMuted}>
            {`${relativeDay(appointment.start)} · ${time(appointment.start)} · ${t('ivy.home.with', { name: appointment.specialist.name })} · ${cityName(appointment.location)}`}
          </Txt>
        </View>
      </Photo>
    </Pressable>
  );
}

/** The assistant books and moves treatments and classes; the demo answers a few example questions. */
function AskIvy() {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/ivy/assistent')}
      style={({ pressed }) => ({
        minHeight: 56,
        borderRadius: theme.r.card,
        backgroundColor: theme.c.ink,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingStart: 16,
        paddingEnd: 7,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Icon name="sparkle" size={20} color={theme.c.sand} />
      <Txt variant="body" color={theme.c.onPhotoMuted} style={{ flex: 1 }} numberOfLines={2}>
        {t('pilates.home.ask')}
      </Txt>
      <View style={{ width: 42, height: 42, borderRadius: theme.r.control, backgroundColor: '#3A3935', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="mic" size={19} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

function NextClass({ session }: { session: SessionView }) {
  const theme = useTheme();
  const { t, relativeDay, time } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/ivy/les/${session.id}`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 10,
        borderRadius: theme.r.card,
        backgroundColor: theme.c.surface,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Photo photo={CLASS_TYPES[session.typeId].photo} style={{ width: 64, height: 78, borderRadius: theme.r.photo }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="caption" color={theme.c.muted}>
          {t('pilates.home.nextClass')}
        </Txt>
        <Txt variant="heading" numberOfLines={1}>
          {session.name}
        </Txt>
        <Txt variant="small" color={theme.c.muted} numberOfLines={1}>
          {`${relativeDay(session.start)} · ${time(session.start)}`}
        </Txt>
        <Txt variant="small" color={theme.c.muted} numberOfLines={1}>
          {t(spotLines(session, session.booking?.spot ?? 0).withInstructor, { name: session.instructor, n: session.booking?.spot ?? '' })}
        </Txt>
      </View>
      <Button kind="secondary" size="sm" icon="wallet" label={t('pilates.home.wallet')} onPress={() => router.push(`/ivy/ticket/${session.id}`)} />
    </Pressable>
  );
}

/** A few months after an injectable treatment: a free check-up with the same doctor. It names no product. */
function Checkup() {
  const theme = useTheme();
  const { t, time, relativeDayInline } = useI18n();
  const { checkup } = useIvy();
  if (!checkup) return null;
  const specialist = specialistById(checkup.slot.specialistId);
  const location = locationById(checkup.locationId);
  return (
    <View style={{ flexDirection: 'row', backgroundColor: theme.c.surface, borderRadius: theme.r.card, overflow: 'hidden' }}>
      <Photo photo={checkup.treatment.photo} style={{ width: 116 }} position="top" />
      <View style={{ flex: 1, padding: 16, gap: 8 }}>
        <Txt variant="small" color={theme.c.muted}>
          {t('ivy.home.checkupEyebrow', { n: checkup.monthsAgo })}
        </Txt>
        <Txt variant="heading">{t('ivy.home.checkupTitle')}</Txt>
        <Txt variant="small" color={IVY_COLORS.body}>
          {t('ivy.home.checkupBody', {
            name: specialist.name,
            when: `${relativeDayInline(checkup.slot.start)} ${time(checkup.slot.start)}`,
            city: cityName(location),
          })}
        </Txt>
        <Button
          size="sm"
          label={t('ivy.home.checkupCta')}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
          onPress={() =>
            router.push({
              pathname: '/ivy/afspraak/[treatmentId]',
              params: {
                treatmentId: checkup.treatment.id,
                specialist: specialist.id,
                location: location.id,
                slot: String(checkup.slot.start.getTime()),
              },
            })
          }
        />
      </View>
    </View>
  );
}

function Concerns() {
  const theme = useTheme();
  const { t } = useI18n();
  const { wide } = useLayout();
  const cards = CONCERNS.map((concern) => (
    <Pressable
      key={concern.id}
      accessibilityRole="button"
      onPress={() => router.navigate({ pathname: '/ivy/boeken', params: { concern: concern.id, at: String(Date.now()) } })}
      style={({ pressed }) => ({ width: wide ? undefined : 136, flex: wide ? 1 : undefined, gap: wide ? 12 : 8, opacity: pressed ? 0.85 : 1 })}
    >
      <Photo photo={concern.photo} style={{ height: wide ? 300 : 172, borderRadius: theme.r.photo }} />
      <Txt variant="bodyStrong" numberOfLines={2}>
        {t(`ivy.concern.${concern.id}`)}
      </Txt>
    </Pressable>
  ));
  return (
    <View style={{ gap: wide ? 18 : 14 }}>
      <Txt variant="title">{t('ivy.home.concerns')}</Txt>
      {/* Five photos in one row on a computer screen; a row to swipe through on a phone. */}
      {wide ? <View style={{ flexDirection: 'row', gap: 18 }}>{cards}</View> : <Rail gap={12}>{cards}</Rail>}
    </View>
  );
}

function Consult({ fill }: { fill?: boolean }) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ backgroundColor: theme.c.sand, borderRadius: theme.r.card, overflow: 'hidden', flex: fill ? 1 : undefined }}>
      <Photo photo="ivy-room" style={{ height: fill ? 240 : 156 }} />
      <View style={{ padding: 18, gap: 8 }}>
        <Txt variant="eyebrow" color={theme.c.muted}>
          {t('ivy.home.consultEyebrow')}
        </Txt>
        <Txt variant="title">{t('ivy.home.consultTitle')}</Txt>
        <Txt variant="body" color={IVY_COLORS.body}>
          {t('ivy.home.consultBody')}
        </Txt>
        <Button label={t('ivy.home.consultCta')} onPress={() => router.push('/ivy/afspraak/consult')} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

function SkinAdvice({ fill }: { fill?: boolean }) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push('/ivy/advies')} style={fill ? { flex: 1 } : undefined}>
      <Photo photo="ivy-serum" scrim style={fill ? { flex: 1, minHeight: 212, borderRadius: theme.r.card } : { height: 212, borderRadius: theme.r.card }}>
        <View
          style={{
            position: 'absolute',
            top: 14,
            end: 14,
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: theme.c.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="arrow" size={18} />
        </View>
        <View style={{ position: 'absolute', start: 18, end: 18, bottom: 16, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="sparkle" size={14} color={theme.c.onPhoto} />
            <Txt variant="eyebrow" color={theme.c.onPhotoMuted}>
              {t('ivy.home.aiEyebrow')}
            </Txt>
          </View>
          <Txt variant="title" color="#FFFFFF" accentColor="#FFFFFF">
            {t('ivy.home.aiTitle')}
          </Txt>
          <Txt variant="small" color={theme.c.onPhotoMuted}>
            {t('ivy.home.aiBody')}
          </Txt>
        </View>
      </Photo>
    </Pressable>
  );
}

/** The clinic's own numbers from ivyclinics.nl, plus opening hours. */
function Facts() {
  const theme = useTheme();
  const { t, locale } = useI18n();
  const facts = [
    { value: locale === 'en' || locale === 'ar' ? '9.4' : '9,4', label: t('ivy.home.rating') },
    { value: '4', label: t('ivy.home.locations') },
    { value: locale === 'fr' || locale === 'de' ? '100 %' : '100%', label: t('ivy.home.natural') },
  ];
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.c.line, paddingVertical: 18 }}>
        {facts.map((fact, index) => (
          <View
            key={fact.label}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 2,
              paddingHorizontal: 6,
              borderStartWidth: index === 0 ? 0 : 1,
              borderColor: theme.c.line,
            }}
          >
            <Txt variant="display">{fact.value}</Txt>
            <Txt variant="caption" color={theme.c.muted} align="center">
              {fact.label}
            </Txt>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon name="clock" size={15} color={theme.c.muted} />
        <Txt variant="small" color={theme.c.muted}>
          {t('ivy.hours')}
        </Txt>
      </View>
    </View>
  );
}
