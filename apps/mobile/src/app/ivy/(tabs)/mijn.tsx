import { CLASS_TYPES } from '@pure-ivy/shared';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button, IconButton } from '@/components/Button';
import { CreditsBar } from '@/components/CreditsBar';
import { Icon, type IconName } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cityName, roleKey, useIvy, type AppointmentView } from '@/ivy';
import { seatNote, useCancelNote, usePilates, type SessionView } from '@/pilates';
import { useDemo, type Order } from '@/state/demo';
import { useTheme } from '@/theme';

type Upcoming = { kind: 'appointment'; start: Date; appointment: AppointmentView } | { kind: 'class'; start: Date; session: SessionView };

/** Everything the member has planned or bought: treatments, classes, waitlist spots and orders. */
export default function MyIvy() {
  const theme = useTheme();
  const { t } = useI18n();
  const ivy = useIvy();
  const pilates = usePilates();
  const { orders } = useDemo();
  const upcoming: Upcoming[] = [
    ...ivy.upcoming.map((appointment) => ({ kind: 'appointment' as const, start: appointment.start, appointment })),
    ...pilates.myClasses.map((session) => ({ kind: 'class' as const, start: session.start, session })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <Screen gap={26}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="display">{t('ivy.mine.title')}</Txt>
        <IconButton icon="globe" label={t('common.settings')} tone="surface" onPress={() => router.push('/settings')} />
      </View>

      <CreditsBar />

      <Section title={t('ivy.appts.upcoming')}>
        {upcoming.length === 0 ? (
          <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 20, gap: 14 }}>
            <Txt variant="body" color={theme.c.muted}>
              {t('ivy.appts.empty')}
            </Txt>
            <Button size="sm" label={t('ivy.home.consultCta')} onPress={() => router.push('/ivy/afspraak/consult')} style={{ alignSelf: 'flex-start' }} />
          </View>
        ) : (
          upcoming.map((item) =>
            item.kind === 'appointment' ? (
              <AppointmentCard key={item.appointment.id} appointment={item.appointment} />
            ) : (
              <ClassCard key={item.session.id} session={item.session} />
            ),
          )
        )}
      </Section>

      {pilates.waitlisted.length > 0 ? (
        <Section title={t('pilates.my.waitlist')}>
          {pilates.waitlisted.map((s) => (
            <WaitlistRow key={s.id} session={s} />
          ))}
        </Section>
      ) : null}

      {orders.length > 0 ? (
        <Section title={t('ivy.mine.orders')}>
          <List>
            {orders.map((order, index) => (
              <OrderRow key={order.id} order={order} first={index === 0} />
            ))}
          </List>
        </Section>
      ) : null}

      {ivy.past.length > 0 ? (
        <Section title={t('ivy.appts.past')}>
          <List>
            {ivy.past.map((a, index) => (
              <PastRow key={a.id} appointment={a} first={index === 0} />
            ))}
          </List>
        </Section>
      ) : null}

      <Section title={t('ivy.mine.more')}>
        <List>
          <LinkRow icon="camera" label={t('ivy.journal.title')} onPress={() => router.push('/ivy/journaal')} first />
          <LinkRow icon="globe" label={t('settings.language')} onPress={() => router.push('/settings')} />
        </List>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Txt variant="eyebrow" color={theme.c.muted}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

function List({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, paddingHorizontal: 14 }}>{children}</View>;
}

function AppointmentCard({ appointment }: { appointment: AppointmentView }) {
  const theme = useTheme();
  const { t, text, relativeDay, time } = useI18n();
  const ivy = useIvy();
  const toast = useToast();
  const { treatment, specialist, location } = appointment;

  return (
    <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, overflow: 'hidden' }}>
      <Photo photo={treatment.photo} style={{ height: 150 }} />
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ gap: 3 }}>
          <Txt variant="smallStrong" color={theme.c.muted}>{`${relativeDay(appointment.start)} · ${time(appointment.start)}`}</Txt>
          <Txt variant="title">{text(treatment.name)}</Txt>
          <Txt variant="small" color={theme.c.muted}>{`${t('ivy.home.with', { name: specialist.name })} · ${t(roleKey(specialist.role))}`}</Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="pin" size={16} color={theme.c.muted} />
          <Txt variant="small" style={{ flex: 1 }}>{`${cityName(location)} · ${location.address}`}</Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            kind="secondary"
            size="sm"
            label={t('common.reschedule')}
            style={{ flex: 1 }}
            onPress={() =>
              router.push({
                pathname: '/ivy/afspraak/[treatmentId]',
                params: { treatmentId: treatment.id, location: location.id, specialist: specialist.id, replace: appointment.id },
              })
            }
          />
          <Button
            kind="quiet"
            size="sm"
            label={t('common.cancel')}
            style={{ flex: 1 }}
            onPress={() => {
              ivy.cancelAppointment(appointment.id);
              toast(t('ivy.appts.cancelled'));
            }}
          />
        </View>
      </View>
    </View>
  );
}

function ClassCard({ session }: { session: SessionView }) {
  const theme = useTheme();
  const { t, relativeDay, time } = useI18n();
  const pilates = usePilates();
  const toast = useToast();
  const reformer = session.booking?.reformer ?? 0;
  const cancelNote = useCancelNote();

  return (
    <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 12, gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(`/ivy/les/${session.id}`)}
        style={({ pressed }) => ({ flexDirection: 'row', gap: 14, opacity: pressed ? 0.85 : 1 })}
      >
        <Photo photo={CLASS_TYPES[session.typeId].photo} style={{ width: 78, height: 94, borderRadius: theme.r.photo }} />
        <View style={{ flex: 1, justifyContent: 'center', gap: 3 }}>
          <Txt variant="smallStrong" color={theme.c.muted}>{`${relativeDay(session.start)} · ${time(session.start)}`}</Txt>
          <Txt variant="heading">{session.name}</Txt>
          <Txt variant="small" color={theme.c.muted}>{`${t('pilates.class.reformer', { n: reformer })} · ${t(seatNote(reformer))}`}</Txt>
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button size="sm" icon="wallet" label={t('pilates.home.wallet')} onPress={() => router.push(`/ivy/ticket/${session.id}`)} style={{ flex: 1 }} />
        <Button
          size="sm"
          kind="secondary"
          label={t('common.cancel')}
          onPress={() => {
            pilates.cancelClass(session.id);
            toast(t('pilates.my.cancelled'));
          }}
          style={{ flex: 1 }}
        />
      </View>
      <Txt variant="caption" color={theme.c.muted} style={{ paddingHorizontal: 2 }}>
        {cancelNote(session)}
      </Txt>
    </View>
  );
}

function WaitlistRow({ session }: { session: SessionView }) {
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
        padding: 12,
        borderRadius: theme.r.card,
        backgroundColor: theme.c.surface,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Photo photo={CLASS_TYPES[session.typeId].photo} style={{ width: 56, height: 64, borderRadius: theme.r.small }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">{session.name}</Txt>
        <Txt variant="small" color={theme.c.muted}>{`${relativeDay(session.start)} · ${time(session.start)}`}</Txt>
      </View>
      <Badge label={t('pilates.chance', { pct: session.chance })} tone="highlight" />
    </Pressable>
  );
}

function OrderRow({ order, first }: { order: Order; first: boolean }) {
  const theme = useTheme();
  const { t, tp, dayShort, euro } = useI18n();
  const count = order.lines.reduce((n, l) => n + l.qty, 0);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/ivy/bestelling/${order.id}`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: theme.c.line,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ width: 44, height: 44, borderRadius: theme.r.small, backgroundColor: theme.c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="bag" size={20} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">{t('shop.orderNumber', { number: order.number })}</Txt>
        <Txt variant="small" color={theme.c.muted}>{`${dayShort(order.createdAt)} · ${tp('shop.items', count)} · ${euro(order.total)}`}</Txt>
      </View>
      <Badge label={order.delivery === 'ship' ? t('shop.statusShip') : t('shop.statusPickup')} tone="outline" />
    </Pressable>
  );
}

function PastRow({ appointment, first }: { appointment: AppointmentView; first: boolean }) {
  const theme = useTheme();
  const { t, text, dayShort } = useI18n();
  const { treatment, specialist, location } = appointment;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: theme.c.line,
      }}
    >
      <Photo photo={treatment.photo} style={{ width: 54, height: 64, borderRadius: theme.r.small }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">{text(treatment.name)}</Txt>
        <Txt variant="small" color={theme.c.muted}>{`${dayShort(appointment.start)} · ${specialist.name} · ${cityName(location)}`}</Txt>
      </View>
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() =>
          router.push({
            pathname: '/ivy/afspraak/[treatmentId]',
            params: { treatmentId: treatment.id, location: location.id, specialist: specialist.id },
          })
        }
      >
        <Txt variant="smallStrong" color={theme.c.primary}>
          {t('ivy.appts.bookAgain')}
        </Txt>
      </Pressable>
    </View>
  );
}

function LinkRow({ icon, label, onPress, first }: { icon: IconName; label: string; onPress: () => void; first?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 56,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: theme.c.line,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon name={icon} size={20} color={theme.c.muted} />
      <Txt variant="body" style={{ flex: 1 }}>
        {label}
      </Txt>
      <Icon name="chevron" size={18} color={theme.c.muted} />
    </Pressable>
  );
}
