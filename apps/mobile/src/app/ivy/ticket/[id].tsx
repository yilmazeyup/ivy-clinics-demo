import { CLASS_TYPES, IVY_MEMBER } from '@pure-ivy/shared';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { IvyLogo } from '@/components/IvyLogo';
import { Photo } from '@/components/Photo';
import { QrCode } from '@/components/QrCode';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { seatNote, usePilates, type SessionView } from '@/pilates';
import { useTheme } from '@/theme';

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/ivy/pilates');
}

export default function PilatesTicket() {
  const { id, waitlist } = useLocalSearchParams<{ id: string; waitlist?: string }>();
  const pilates = usePilates();
  const session = pilates.byId(id);
  if (!session) return <Redirect href="/ivy/pilates" />;
  if (waitlist && !session.booking) return <Waitlisted session={session} />;
  return <Ticket session={session} />;
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <IconButton icon="close" label={t('common.close')} tone="surface" onPress={close} />
      </View>
      <View style={{ gap: 6 }}>
        <Txt variant="hero">{title}</Txt>
        <Txt variant="body" color={theme.c.muted}>
          {subtitle}
        </Txt>
      </View>
    </View>
  );
}

function Ticket({ session }: { session: SessionView }) {
  const theme = useTheme();
  const { t, dayShort, time } = useI18n();
  const pilates = usePilates();
  const toast = useToast();
  const reformer = session.booking?.reformer ?? 0;
  const neighbour = [reformer - 1, reformer + 1].find(
    (n) => n >= 1 && n <= 8 && Math.ceil(n / 4) === Math.ceil(reformer / 4) && !session.taken.includes(n),
  );

  return (
    <Screen gap={22}>
      <Header
        title={t('pilates.confirm.title')}
        subtitle={pilates.unlimited ? t('pilates.pkg.unlimited') : t('pilates.confirm.creditsLeft', { n: pilates.credits })}
      />

      <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, overflow: 'hidden' }}>
        <Photo photo={CLASS_TYPES[session.typeId].photo} scrim style={{ height: 120 }}>
          <View style={{ position: 'absolute', start: 18, end: 18, bottom: 14 }}>
            <Txt variant="title" color="#FFFFFF">
              {session.name}
            </Txt>
            <Txt variant="small" color={theme.c.onPhotoMuted}>
              {t('pilates.home.withInstructor', { name: session.instructor, n: reformer })}
            </Txt>
          </View>
        </Photo>
        <View style={{ padding: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Detail label={t('pilates.confirm.date')} value={dayShort(session.start)} />
            <Detail label={t('pilates.confirm.time')} value={`${time(session.start)}–${time(session.end)}`} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Detail label={t('pilates.class.reformer', { n: reformer })} value={t(seatNote(reformer))} />
            <Detail label={t('pilates.confirm.member')} value={`${IVY_MEMBER.firstName} ${IVY_MEMBER.lastName}`} />
          </View>
        </View>
        {/* Tear line between the details and the check-in code. */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18 }}>
          {Array.from({ length: 24 }, (_, i) => (
            <View key={i} style={{ width: 6, height: 1.5, backgroundColor: theme.c.lineStrong }} />
          ))}
        </View>
        <View style={{ padding: 22, alignItems: 'center', gap: 14 }}>
          <QrCode seed={3 + (session.start.getDate() % 7)} cell={6} />
          <Txt variant="small" color={theme.c.muted} align="center">
            {t('pilates.confirm.scan')}
          </Txt>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="eyebrow" color={theme.c.muted}>
          {t('pilates.confirm.lockScreen')}
        </Txt>
        <LockScreenPreview session={session} />
      </View>

      {neighbour ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <IconTile>
              <Icon name="users" size={20} />
            </IconTile>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="bodyStrong">{t('pilates.confirm.together')}</Txt>
              <Txt variant="small" color={theme.c.muted}>
                {t('pilates.confirm.neighbour', { n: neighbour })}
              </Txt>
            </View>
          </View>
          <Button kind="secondary" size="sm" label={t('pilates.confirm.invite')} onPress={() => toast(t('common.demoNote'))} />
        </Card>
      ) : null}

      <View style={{ gap: 10 }}>
        <Button icon="wallet" label={t('pilates.confirm.addWallet')} onPress={() => toast(t('common.demoNote'))} />
        <Button kind="secondary" icon="calendar" label={t('pilates.confirm.calendar')} onPress={() => toast(t('common.demoNote'))} />
      </View>
    </Screen>
  );
}

function Waitlisted({ session }: { session: SessionView }) {
  const theme = useTheme();
  const { t, relativeDay, time } = useI18n();
  return (
    <Screen gap={22}>
      <Header title={t('pilates.confirm.waitlistTitle')} subtitle={t('pilates.class.waitlistNote', { pct: session.chance })} />
      <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, overflow: 'hidden' }}>
        <Photo photo={CLASS_TYPES[session.typeId].photo} style={{ height: 180 }} />
        <View style={{ padding: 18, gap: 4 }}>
          <Txt variant="title">{session.name}</Txt>
          <Txt variant="body" color={theme.c.muted}>{`${relativeDay(session.start)} · ${time(session.start)} · ${session.instructor}`}</Txt>
        </View>
        <View style={{ marginHorizontal: 18, marginBottom: 18, height: 8, borderRadius: 4, backgroundColor: theme.c.bg, overflow: 'hidden' }}>
          <View style={{ width: `${session.chance}%`, height: 8, backgroundColor: theme.c.highlight }} />
        </View>
      </View>
      <Button label={t('common.done')} onPress={close} />
    </Screen>
  );
}

const LOCK_SOFT = '#3A3935';

/** How the booking shows up as a Live Activity shortly before class. */
function LockScreenPreview({ session }: { session: SessionView }) {
  const theme = useTheme();
  const { t, time } = useI18n();
  return (
    <View style={{ backgroundColor: theme.c.ink, borderRadius: 20, padding: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ marginBottom: 4 }}>
            <IvyLogo width={64} color={theme.c.onPhoto} />
          </View>
          <Txt variant="bodyStrong" color="#FFFFFF" numberOfLines={1}>{`${session.name} · ${time(session.start)}`}</Txt>
          <Txt variant="small" color={theme.c.onPhotoMuted}>
            {t('pilates.confirm.startsInMin', { n: 25 })}
          </Txt>
        </View>
        <View
          style={{
            height: 36,
            paddingHorizontal: 12,
            borderRadius: theme.r.control,
            backgroundColor: LOCK_SOFT,
            justifyContent: 'center',
          }}
        >
          <Txt variant="smallStrong" color="#FFFFFF">
            {t('pilates.confirm.late')}
          </Txt>
        </View>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: LOCK_SOFT, overflow: 'hidden' }}>
        <View style={{ width: '62%', height: 6, borderRadius: 3, backgroundColor: theme.c.sand }} />
      </View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Txt variant="caption" color={theme.c.muted}>
        {label}
      </Txt>
      <Txt variant="bodyStrong">{value}</Txt>
    </View>
  );
}

function Card({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 16, gap: 14 }}>{children}</View>;
}

function IconTile({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.c.bg, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}
