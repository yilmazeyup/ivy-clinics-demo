import { CONCERNS, DEALS, CLINIC_COLORS, IVY_MEMBER, LASER_SERIES, locationById, PURE_CLINICS, specialistById, timeOfDay, type Deal } from '@pure-ivy/shared';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { PureLogo } from '@/components/PureLogo';
import { Rail, Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cityName, useIvy, type AppointmentView } from '@/ivy';
import { useLayout } from '@/layout';
import { useTheme } from '@/theme';

export default function IvyHome() {
  const theme = useTheme();
  const { t, relativeDayInline, time } = useI18n();
  const ivy = useIvy();
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
            <FollowUp />
            <Consult compact />
          </View>
        </View>
        <Concerns />
        <View style={{ flexDirection: 'row', gap: 24 }}>
          <View style={{ flex: 1 }}>
            <Deals />
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
        <PureLogo width={138} />
        <View style={{ flexDirection: 'row', gap: 2 }}>
          <IconButton icon="bell" label={t('common.notifications')} />
          <IconButton icon="user" label={t('common.settings')} onPress={() => router.push('/settings')} />
        </View>
      </View>

      {greeting}

      <AskIvy />
      {ivy.next ? <NextAppointment appointment={ivy.next} /> : null}
      <FollowUp />
      <Deals />
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

/** The assistant books and moves appointments; the demo answers a few example questions. */
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
        {t('ivy.home.ask')}
      </Txt>
      <View style={{ width: 42, height: 42, borderRadius: theme.r.control, backgroundColor: '#3A3935', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="mic" size={19} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

/** Six weeks after a laser session: the next one in the series, with the same skin therapist (a vervolgafspraak). */
function FollowUp() {
  const theme = useTheme();
  const { t, time, relativeDayInline } = useI18n();
  const { followUp } = useIvy();
  if (!followUp) return null;
  const specialist = specialistById(followUp.slot.specialistId);
  const location = locationById(followUp.locationId);
  return (
    <View style={{ flexDirection: 'row', backgroundColor: theme.c.surface, borderRadius: theme.r.card, overflow: 'hidden' }}>
      <Photo photo={followUp.treatment.photo} style={{ width: 116 }} position="top" />
      <View style={{ flex: 1, padding: 16, gap: 8 }}>
        <Txt variant="small" color={theme.c.muted}>
          {t('ivy.home.followUpEyebrow', { n: followUp.weeksAgo })}
        </Txt>
        <Txt variant="heading">{t('ivy.home.followUpTitle')}</Txt>
        <Txt variant="small" color={CLINIC_COLORS.body}>
          {t('ivy.home.followUpBody', {
            session: followUp.session,
            total: LASER_SERIES,
            name: specialist.name,
            when: `${relativeDayInline(followUp.slot.start)} ${time(followUp.slot.start)}`,
            city: cityName(location),
          })}
        </Txt>
        <Button
          size="sm"
          label={t('ivy.home.followUpCta')}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
          onPress={() =>
            router.push({
              pathname: '/ivy/afspraak/[treatmentId]',
              params: {
                treatmentId: followUp.treatment.id,
                specialist: specialist.id,
                location: location.id,
                slot: String(followUp.slot.start.getTime()),
              },
            })
          }
        />
      </View>
    </View>
  );
}

/** The laser deals from pureclinics.nl/deals: one for women, one for men and one for students. */
function Deals() {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  const shown = (['women', 'men', 'students'] as const).map((group) => DEALS.find((d) => d.group === group)).filter((d): d is Deal => Boolean(d));
  return (
    <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 18, gap: 12, flex: 1 }}>
      <Txt variant="eyebrow" color={theme.c.muted}>
        {t('ivy.deals.eyebrow')}
      </Txt>
      <Txt variant="title">{t('ivy.deals.title')}</Txt>
      <View>
        {shown.map((deal, index) => (
          <Pressable
            key={deal.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/ivy/afspraak/[treatmentId]', params: { treatmentId: 'laser', deal: deal.id } })}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: theme.c.line,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="caption" color={theme.c.muted}>
                {t(`ivy.deals.${deal.group}`)}
              </Txt>
              <Txt variant="bodyStrong">{text(deal.zones)}</Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt variant="heading">{euro(deal.price)}</Txt>
              {deal.was ? (
                <Txt variant="caption" color={theme.c.muted} style={{ textDecorationLine: 'line-through' }}>
                  {t('ivy.deals.was', { price: euro(deal.was) })}
                </Txt>
              ) : null}
            </View>
            <Icon name="chevron" size={16} color={theme.c.muted} />
          </Pressable>
        ))}
      </View>
      <Txt variant="caption" color={theme.c.muted}>
        {t('ivy.deals.note')}
      </Txt>
      <Button size="sm" label={t('ivy.deals.cta')} onPress={() => router.push('/ivy/afspraak/laser')} style={{ alignSelf: 'flex-start', marginTop: 2 }} />
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
      style={({ pressed }) => ({ width: wide ? undefined : 136, flexBasis: wide ? '22%' : undefined, flexGrow: wide ? 1 : undefined, gap: wide ? 12 : 8, opacity: pressed ? 0.85 : 1 })}
    >
      <Photo photo={concern.photo} style={{ height: wide ? 230 : 172, borderRadius: theme.r.photo }} />
      <Txt variant="bodyStrong" numberOfLines={2}>
        {t(`ivy.concern.${concern.id}`)}
      </Txt>
    </Pressable>
  ));
  return (
    <View style={{ gap: wide ? 18 : 14 }}>
      <Txt variant="title">{t('ivy.home.concerns')}</Txt>
      {/* Two rows of four photos on a computer screen; a row to swipe through on a phone. */}
      {wide ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 26 }}>{cards}</View> : <Rail gap={12}>{cards}</Rail>}
    </View>
  );
}

function Consult({ compact }: { compact?: boolean }) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ backgroundColor: theme.c.sand, borderRadius: theme.r.card, overflow: 'hidden', flex: compact ? 1 : undefined }}>
      {compact ? null : <Photo photo="pc-room" style={{ height: 156 }} />}
      <View style={{ padding: 18, gap: 8 }}>
        <Txt variant="eyebrow" color={theme.c.muted}>
          {t('ivy.home.consultEyebrow')}
        </Txt>
        <Txt variant="title">{t('ivy.home.consultTitle')}</Txt>
        <Txt variant="body" color={CLINIC_COLORS.body}>
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
      <Photo photo="pc-prx" scrim position="top" style={fill ? { flex: 1, minHeight: 212, borderRadius: theme.r.card } : { height: 212, borderRadius: theme.r.card }}>
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

/** The clinic's own numbers from pureclinics.nl, plus opening hours. */
function Facts() {
  const theme = useTheme();
  const { t, num } = useI18n();
  const facts = [
    { value: `${num(PURE_CLINICS.clients)}+`, label: t('ivy.home.clients') },
    { value: String(PURE_CLINICS.years), label: t('ivy.home.years') },
    { value: '2', label: t('ivy.home.locations') },
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
