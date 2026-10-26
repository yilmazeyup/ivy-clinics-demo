import { CLINIC_COLORS, MEMBER } from '@pure-clinics/shared';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button, IconButton } from '@/components/Button';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { EASE_OUT, nativeDriver, PressableScale, prefersReducedMotion, useCountUp } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { QrCode } from '@/components/QrCode';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { cityName, roleKey, useClinic, type AppointmentView } from '@/clinic';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';

// Back to the tabs underneath, then to the Home tab.
function home() {
  if (router.canDismiss()) router.dismissAll();
  router.navigate('/');
}

export default function ConfirmationScreen() {
  const theme = useTheme();
  const { id, moved } = useLocalSearchParams<{ id: string; moved?: string }>();
  const { t, euro } = useI18n();
  const clinic = useClinic();
  const toast = useToast();
  const appointment = clinic.byId(id);
  if (!appointment) return <Redirect href="/" />;
  const status = moved
    ? t('clinic.confirm.moved')
    : appointment.treatment.deposit
      ? t('clinic.confirm.paid', { amount: euro(appointment.treatment.deposit) })
      : appointment.treatment.priceFrom
        ? t('clinic.confirm.booked')
        : t('clinic.confirm.free');

  return (
    <Screen gap={24} enter={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <IconButton icon="close" label={t('common.close')} tone="surface" onPress={home} />
      </View>

      <View style={{ gap: 14 }}>
        <Seal />
        <Rise delay={500}>
          <Txt variant="hero">{t('clinic.confirm.title', { name: MEMBER.firstName })}</Txt>
        </Rise>
        <Rise delay={620}>
          <Txt variant="body" color={CLINIC_COLORS.body}>
            {status}
          </Txt>
        </Rise>
      </View>

      <Pass appointment={appointment} />

      <Rise delay={1100}>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button kind="light" size="sm" icon="calendar" label={t('clinic.confirm.calendar')} onPress={() => toast(t('common.demoNote'))} style={{ flex: 1 }} />
            <Button kind="light" size="sm" icon="pin" label={t('clinic.confirm.route')} onPress={() => toast(t('common.demoNote'))} style={{ flex: 1 }} />
          </View>
          <PressableScale
            onPress={() => toast(t('common.demoNote'))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: theme.r.card, backgroundColor: theme.c.surface, boxShadow: theme.shadow.card }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: theme.c.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="list" size={20} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="bodyStrong">{t('clinic.confirm.intake')}</Txt>
              <Txt variant="small" color={CLINIC_COLORS.body}>
                {t('clinic.confirm.intakeBody', { name: appointment.specialist.name })}
              </Txt>
            </View>
            <Icon name="chevron" size={18} color={theme.c.muted} />
          </PressableScale>
          <Button label={t('clinic.confirm.home')} onPress={home} />
        </View>
      </Rise>
    </Screen>
  );
}

/** Rises into place after a moment, so the page builds up in order. */
function Rise({ delay, children }: { delay: number; children: ReactNode }) {
  const v = useRef(new Animated.Value(prefersReducedMotion() ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 650, delay, easing: EASE_OUT, useNativeDriver: nativeDriver }).start();
  }, [v, delay]);
  return <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>{children}</Animated.View>;
}

/** A dark tile that springs in, and a check mark that draws itself inside it. */
function Seal() {
  const theme = useTheme();
  const pop = useRef(new Animated.Value(prefersReducedMotion() ? 1 : 0)).current;
  const drawn = useCountUp(1, { duration: 520, delay: 280 });
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, speed: 10, bounciness: 12, useNativeDriver: nativeDriver }).start();
  }, [pop]);
  // The check is a path about 22 units long; the dash offset uncovers it from the start.
  const length = 22;
  return (
    <Animated.View
      style={{
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: theme.c.ink,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: theme.shadow.lift,
        opacity: pop,
        transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }, { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] }) }],
      }}
    >
      <Svg width={30} height={30} viewBox="0 0 24 24">
        <Path
          d="m5 12.5 4.5 4.5L19 7.5"
          stroke={theme.c.gold}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={`${length} ${length}`}
          strokeDashoffset={length * (1 - drawn)}
        />
      </Svg>
    </Animated.View>
  );
}

/**
 * The appointment as a pass, like a ticket in a wallet: the treatment photo with the date on glass, a torn-off line,
 * then the details and a check-in code. It lifts up from below and tips upright as it arrives.
 */
function Pass({ appointment }: { appointment: AppointmentView }) {
  const theme = useTheme();
  const { t, text, dayLong, time } = useI18n();
  const arrive = useRef(new Animated.Value(prefersReducedMotion() ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(arrive, { toValue: 1, duration: 1000, delay: 700, easing: EASE_OUT, useNativeDriver: nativeDriver }).start();
  }, [arrive]);
  const { treatment, specialist, location } = appointment;
  const end = new Date(appointment.start.getTime() + treatment.minutes * 60000);
  return (
    <Animated.View
      style={{
        opacity: arrive.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
        transform: [
          { perspective: 900 },
          { translateY: arrive.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) },
          { rotateX: arrive.interpolate({ inputRange: [0, 1], outputRange: ['28deg', '0deg'] }) },
          { scale: arrive.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
        ],
      }}
    >
      <View style={{ borderRadius: 28, backgroundColor: theme.c.surface, overflow: 'hidden', boxShadow: theme.shadow.lift }}>
        <Photo photo={treatment.photo} style={{ height: 190 }}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20, 16, 12, 0.18)' }]} />
          <View style={{ position: 'absolute', top: 14, start: 14, end: 14, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Glass style={{ borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Txt variant="eyebrow" style={{ fontSize: 10 }}>
                {dayLong(appointment.start)}
              </Txt>
              <Txt variant="title" style={{ fontSize: 22, lineHeight: 26 }}>
                {`‎${time(appointment.start)}–${time(end)}`}
              </Txt>
            </Glass>
          </View>
        </Photo>
        <View style={{ padding: 20, gap: 14 }}>
          <Txt variant="title">{text(treatment.name)}</Txt>
          <Row icon="user" value={`${specialist.name} · ${t(roleKey(specialist.role))}`} />
          <Row icon="pin" value={`${cityName(location)} · ${location.address}`} />
        </View>
        {/* The tear-off line. */}
        <View style={{ marginHorizontal: 20, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: theme.c.lineStrong }} />
        <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <View style={{ padding: 8, borderRadius: 12, backgroundColor: theme.c.bg }}>
            <QrCode seed={appointment.start.getDate() + 3} cell={3.4} color={theme.c.ink} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="eyebrow" color={theme.c.muted}>
              {t('clinic.pass.checkin')}
            </Txt>
            <Txt variant="small" color={CLINIC_COLORS.body}>
              {t('clinic.pass.checkinBody')}
            </Txt>
          </View>
        </View>
      </View>
    </Animated.View>
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
