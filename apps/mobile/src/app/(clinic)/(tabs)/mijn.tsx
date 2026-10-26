import { LASER_SERIES, LOCATIONS, MEMBER, PURE_CLINICS, openingHours } from '@pure-clinics/shared';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button, IconButton } from '@/components/Button';
import { Glass } from '@/components/Glass';
import { Icon, type IconName } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { PureLogo } from '@/components/PureLogo';
import { SessionRing } from '@/components/SessionRing';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cityName, roleKey, useClinic, type AppointmentView } from '@/clinic';
import { startEdge } from '@/layout';
import { useDemo, type Order } from '@/state/demo';
import { useTheme } from '@/theme';

/** The help page with the explainer video and common questions, on the demo site. */
const HELP_URL = 'https://yilmazeyup.github.io/pure-clinics-demo/hulp/';

/** Everything the member has planned or bought, the membership, and how to reach both clinics. */
export default function MyPure() {
  const theme = useTheme();
  const { t, locale } = useI18n();
  const clinic = useClinic();
  const { orders } = useDemo();
  const upcoming = clinic.upcoming;

  return (
    <Screen gap={26} tabs>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="display">{t('clinic.mine.title')}</Txt>
        <IconButton icon="globe" label={t('common.settings')} tone="surface" onPress={() => router.push('/settings')} />
      </View>

      <Section title={t('clinic.appts.upcoming')}>
        {upcoming.length === 0 ? (
          <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 20, gap: 14 }}>
            <Txt variant="body" color={theme.c.muted}>
              {t('clinic.appts.empty')}
            </Txt>
            <Button size="sm" label={t('clinic.home.consultCta')} onPress={() => router.push('/afspraak/consult')} style={{ alignSelf: 'flex-start' }} />
          </View>
        ) : (
          upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />)
        )}
      </Section>

      <Series />

      <Membership />

      {orders.length > 0 ? (
        <Section title={t('clinic.mine.orders')}>
          <List>
            {orders.map((order, index) => (
              <OrderRow key={order.id} order={order} first={index === 0} />
            ))}
          </List>
        </Section>
      ) : null}

      {clinic.past.length > 0 ? (
        <Section title={t('clinic.appts.past')}>
          <List>
            {clinic.past.map((a, index) => (
              <PastRow key={a.id} appointment={a} first={index === 0} />
            ))}
          </List>
        </Section>
      ) : null}

      <Contact />

      <Section title={t('clinic.mine.more')}>
        <List>
          <LinkRow icon="camera" label={t('clinic.journal.title')} onPress={() => router.push('/journaal')} first />
          <LinkRow icon="globe" label={t('settings.language')} onPress={() => router.push('/settings')} />
          <LinkRow icon="video" label={t('clinic.mine.help')} onPress={() => Linking.openURL(`${HELP_URL}?lang=${locale}`)} />
        </List>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 14 }}>
      <Txt variant="title">{title}</Txt>
      {children}
    </View>
  );
}

function List({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, paddingHorizontal: 16, boxShadow: theme.shadow.card }}>{children}</View>;
}

/** The laser series so far, as the ring of sessions: done ones in ink, the next one in gold. */
function Series() {
  const theme = useTheme();
  const { t, text } = useI18n();
  const clinic = useClinic();
  const done = clinic.past.filter((a) => a.treatmentId === 'laser');
  if (!done.length) return null;
  const treatment = done[0].treatment;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, padding: 18, borderRadius: theme.r.card, backgroundColor: theme.c.surface, boxShadow: theme.shadow.card }}>
      <SessionRing done={done.length} total={LASER_SERIES} size={96} show="done" caption={t('clinic.journey.of', { total: LASER_SERIES })} />
      <View style={{ flex: 1, gap: 6 }}>
        <Txt variant="eyebrow" color={theme.c.muted}>
          {t('clinic.journey.eyebrow', { treatment: text(treatment.name) })}
        </Txt>
        <Txt variant="heading">{t('clinic.journey.done', { done: done.length, total: LASER_SERIES })}</Txt>
        <Txt variant="small" color={theme.c.muted}>
          {t('clinic.journey.with', { name: done[0].specialist.name })}
        </Txt>
      </View>
    </View>
  );
}

function AppointmentCard({ appointment }: { appointment: AppointmentView }) {
  const theme = useTheme();
  const { t, text, relativeDay, time } = useI18n();
  const clinic = useClinic();
  const toast = useToast();
  const { treatment, specialist, location } = appointment;

  return (
    <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, overflow: 'hidden', boxShadow: theme.shadow.card }}>
      <Photo photo={treatment.photo} style={{ height: 180 }}>
        <Glass style={{ position: 'absolute', top: 14, ...startEdge(theme.rtl, 14), borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Txt variant="eyebrow" style={{ fontSize: 10 }}>
            {relativeDay(appointment.start)}
          </Txt>
          <Txt variant="title" style={{ fontSize: 22, lineHeight: 26 }}>
            {time(appointment.start)}
          </Txt>
        </Glass>
      </Photo>
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ gap: 3 }}>
          <Txt variant="title">{text(treatment.name)}</Txt>
          <Txt variant="small" color={theme.c.muted}>{`${t('clinic.home.with', { name: specialist.name })} · ${t(roleKey(specialist.role))}`}</Txt>
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
                pathname: '/afspraak/[treatmentId]',
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
              clinic.cancelAppointment(appointment.id);
              toast(t('clinic.appts.cancelled'));
            }}
          />
        </View>
      </View>
    </View>
  );
}

/** The Pure Clinics membership (pureclinics.nl/membership): its perks, and joining in one tap. */
function Membership() {
  const theme = useTheme();
  const { t } = useI18n();
  const { member, joinMembership } = useDemo();
  const toast = useToast();
  const perks = [t('clinic.member.perk1'), t('clinic.member.perk2'), t('clinic.member.perk3'), t('clinic.member.perk4')];
  return (
    <View style={{ backgroundColor: theme.c.ink, borderRadius: theme.r.card, padding: 20, gap: 14, boxShadow: theme.shadow.lift, overflow: 'hidden' }}>
      {/* A member card: the wordmark, a gold line and the member's name, like the card in a wallet. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <PureLogo width={128} color="#FFFFFF" />
        <Txt variant="eyebrow" color={theme.c.gold}>
          {t('clinic.member.eyebrow')}
        </Txt>
      </View>
      <View style={{ height: 1, backgroundColor: theme.c.gold, opacity: 0.6 }} />
      <View style={{ gap: 4 }}>
        <Txt variant="caption" color="rgba(255, 255, 255, 0.6)">
          {`${MEMBER.firstName} ${MEMBER.lastName}`}
        </Txt>
        <Txt variant="title" color="#FFFFFF" accentColor="#FFFFFF">
          {member ? t('clinic.member.joined') : t('clinic.member.title')}
        </Txt>
      </View>
      {member ? null : (
        <Txt variant="body" color="rgba(255, 255, 255, 0.72)">
          {t('clinic.member.body')}
        </Txt>
      )}
      <View style={{ gap: 8 }}>
        {perks.map((perk) => (
          <View key={perk} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="check" size={16} strokeWidth={2.2} color={theme.c.gold} />
            <Txt variant="body" color="#FFFFFF" style={{ flex: 1 }}>
              {perk}
            </Txt>
          </View>
        ))}
      </View>
      {member ? null : (
        <Button
          size="sm"
          kind="light"
          label={t('clinic.member.join')}
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
          onPress={() => {
            joinMembership();
            toast(t('clinic.member.joined'));
          }}
        />
      )}
    </View>
  );
}

/** Both clinics with today's opening hours; a tap calls the clinic. */
function Contact() {
  const theme = useTheme();
  const { t } = useI18n();
  const { now } = useDemo();
  // The left-to-right mark keeps "09:00–17:00" in order inside Arabic text.
  const hours = (h: { open: number; close: number }) => `\u200E${String(h.open).padStart(2, '0')}:00–${String(h.close).padStart(2, '0')}:00`;
  return (
    <Section title={t('clinic.contact.title')}>
      <List>
        {LOCATIONS.map((location, index) => {
          const today = openingHours(now, location.id);
          return (
            <Pressable
              key={location.id}
              accessibilityRole="link"
              onPress={() => Linking.openURL(`tel:${location.phone.replace(/\s/g, '')}`)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 14,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: theme.c.line,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Icon name="pin" size={20} color={theme.c.muted} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyStrong">{cityName(location)}</Txt>
                <Txt variant="small" color={theme.c.muted}>
                  {location.address}
                </Txt>
                <Txt variant="small" color={theme.c.muted}>
                  {today ? t('clinic.contact.today', { hours: hours(today) }) : t('clinic.contact.closed')}
                </Txt>
              </View>
              <Txt variant="smallStrong" color={theme.c.primary}>
                {t('clinic.contact.call', { phone: location.phone })}
              </Txt>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(`mailto:${PURE_CLINICS.email}`)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            minHeight: 52,
            borderTopWidth: 1,
            borderTopColor: theme.c.line,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Icon name="mail" size={20} color={theme.c.muted} />
          <Txt variant="body" style={{ flex: 1 }}>
            {PURE_CLINICS.email}
          </Txt>
        </Pressable>
      </List>
    </Section>
  );
}

function OrderRow({ order, first }: { order: Order; first: boolean }) {
  const theme = useTheme();
  const { t, tp, dayShort, euro } = useI18n();
  const count = order.lines.reduce((n, l) => n + l.qty, 0);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/bestelling/${order.id}`)}
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
            pathname: '/afspraak/[treatmentId]',
            params: { treatmentId: treatment.id, location: location.id, specialist: specialist.id },
          })
        }
      >
        <Txt variant="smallStrong" color={theme.c.primary}>
          {t('clinic.appts.bookAgain')}
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
