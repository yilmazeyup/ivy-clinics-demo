import {
  addDays,
  freeSlots,
  IVY_MEMBER,
  LOCATIONS,
  openingHours,
  sameDay,
  specialistById,
  specialistsFor,
  startOfDay,
  TREATMENTS,
  type FreeSlot,
  type LocationId,
  type SpecialistId,
  type Treatment,
} from '@pure-ivy/shared';
import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { DayStrip } from '@/components/DayStrip';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { Footer, Rail, Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cityName, roleKey, useIvy } from '@/ivy';
import { useTheme } from '@/theme';

type Params = { treatmentId: string; location?: string; specialist?: string; slot?: string; replace?: string };

export default function IvyBooking() {
  const params = useLocalSearchParams<Params>();
  const treatment = TREATMENTS.find((tr) => tr.id === params.treatmentId);
  if (!treatment) return <Redirect href="/ivy/boeken" />;
  return <Booking treatment={treatment} params={params} />;
}

function Booking({ treatment, params }: { treatment: Treatment; params: Params }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { t, text, euro, time, dayShort } = useI18n();
  const ivy = useIvy();
  const replacing = params.replace ? ivy.byId(params.replace) : undefined;

  const [locationId, setLocationId] = useState<LocationId>(
    () => LOCATIONS.find((l) => l.id === params.location)?.id ?? replacing?.locationId ?? IVY_MEMBER.locationId,
  );
  const team = specialistsFor(treatment, locationId);
  const [specialistId, setSpecialistId] = useState<SpecialistId | 'any'>(
    () => team.find((s) => s.id === params.specialist)?.id ?? 'any',
  );
  // The member's other appointments block those times; the one being moved does not.
  const busy = useMemo(() => ivy.appointments.filter((a) => a.id !== params.replace), [ivy.appointments, params.replace]);
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(startOfDay(ivy.now), i)), [ivy.now]);
  const slotsOn = (day: Date, who: SpecialistId | 'any' = specialistId, where: LocationId = locationId) =>
    freeSlots(treatment, who, day, ivy.now, where, busy);

  const suggested = params.slot ? new Date(Number(params.slot)) : null;
  const [day, setDay] = useState<Date>(() => (suggested ? startOfDay(suggested) : (days.find((d) => slotsOn(d).length > 0) ?? days[0])));
  const [slot, setSlot] = useState<FreeSlot | null>(() =>
    suggested ? (slotsOn(startOfDay(suggested)).find((s) => s.start.getTime() === suggested.getTime()) ?? null) : null,
  );
  const slots = slotsOn(day);
  const last = ivy.lastSpecialistFor(treatment.id);
  const firstTime = treatment.category === 'injectables' && !ivy.past.some((a) => a.treatmentId === treatment.id);
  const tile = (width - 40 - 16) / 3;
  // Moving an appointment keeps the deposit that was already paid.
  const deposit = replacing ? 0 : treatment.deposit;

  const chooseLocation = (id: LocationId) => {
    setLocationId(id);
    const stays = specialistsFor(treatment, id).some((s) => s.id === specialistId);
    const who = stays ? specialistId : 'any';
    setSpecialistId(who);
    setSlot(null);
    if (slotsOn(day, who, id).length === 0) setDay(days.find((d) => slotsOn(d, who, id).length > 0) ?? day);
  };

  const chooseSpecialist = (id: SpecialistId | 'any') => {
    setSpecialistId(id);
    setSlot(null);
    if (slotsOn(day, id).length === 0) setDay(days.find((d) => slotsOn(d, id).length > 0) ?? day);
  };

  const confirm = () => {
    if (!slot) return;
    const id = ivy.bookAppointment({ treatmentId: treatment.id, specialistId: slot.specialistId, locationId, start: slot.start });
    if (replacing) ivy.cancelAppointment(replacing.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: '/ivy/bevestiging/[id]', params: replacing ? { id, moved: '1' } : { id } });
  };

  const footer = (
    <Footer>
      {slot ? (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {`${dayShort(slot.start)} · ${time(slot.start)} · ${specialistById(slot.specialistId).name}`}
          </Txt>
          <Txt variant="small" color={theme.c.muted}>
            {deposit ? t('ivy.book.deposit', { amount: euro(deposit) }) : replacing ? '' : t('ivy.price.free')}
          </Txt>
        </View>
      ) : null}
      <Button label={deposit ? t('ivy.book.continue') : t('ivy.book.confirmFree')} disabled={!slot} onPress={confirm} />
      <Txt variant="caption" color={theme.c.muted} align="center">
        {t('ivy.book.policy')}
      </Txt>
    </Footer>
  );

  return (
    <Screen gap={22} footer={footer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="back" label={t('common.back')} tone="surface" onPress={() => router.back()} />
        <Txt variant="small" color={theme.c.muted}>
          {t('ivy.book.step', { n: 2 })}
        </Txt>
      </View>

      <Txt variant="display">{t('ivy.book.moment')}</Txt>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 10 }}>
        <Photo photo={treatment.photo} style={{ width: 56, height: 68, borderRadius: theme.r.small }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong">{text(treatment.name)}</Txt>
          <Txt variant="small" color={theme.c.muted}>
            {`${t('common.minutes', { n: treatment.minutes })} · ${treatment.priceFrom ? t('ivy.price.from', { price: euro(treatment.priceFrom) }) : t('ivy.price.free')}`}
          </Txt>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={10} style={{ paddingHorizontal: 8 }}>
          <Txt variant="smallStrong" color={theme.c.primary}>
            {t('common.change')}
          </Txt>
        </Pressable>
      </View>

      {firstTime ? (
        <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: theme.r.control, borderWidth: 1, borderColor: theme.c.line }}>
          <Icon name="leaf" size={18} color={theme.c.primary} />
          <Txt variant="small" color={theme.c.ink} style={{ flex: 1 }}>
            {t('ivy.book.firstTime')}
          </Txt>
        </View>
      ) : null}

      <Group label={t('ivy.book.location')}>
        <Rail gap={8}>
          {LOCATIONS.map((l) => (
            <Chip key={l.id} label={cityName(l)} icon={l.id === locationId ? 'pin' : undefined} selected={l.id === locationId} onPress={() => chooseLocation(l.id)} />
          ))}
        </Rail>
      </Group>

      <Group label={t('ivy.book.specialist')}>
        <Rail gap={8}>
          <PersonTile name={t('ivy.book.anyone')} note={t('ivy.book.firstAvailable')} selected={specialistId === 'any'} onPress={() => chooseSpecialist('any')} />
          {team.map((s) => (
            <PersonTile
              key={s.id}
              name={s.name}
              note={s.id === last ? t('ivy.book.sameAsLast') : t(roleKey(s.role))}
              selected={specialistId === s.id}
              onPress={() => chooseSpecialist(s.id)}
            />
          ))}
        </Rail>
      </Group>

      <Group label={t('ivy.book.dates')}>
        <DayStrip
          days={days}
          selected={day}
          onSelect={(d) => {
            setDay(d);
            setSlot(null);
          }}
          isDisabled={(d) => openingHours(d) === null}
          isMarked={(d) => ivy.upcoming.some((a) => sameDay(a.start, d))}
        />
      </Group>

      <Group label={specialistId === 'any' ? t('ivy.book.timesAll') : t('ivy.book.timesWith', { name: specialistById(specialistId).name })}>
        {openingHours(day) === null ? (
          <Txt variant="body" color={theme.c.muted}>
            {t('ivy.book.closed')}
          </Txt>
        ) : slots.length === 0 ? (
          <Txt variant="body" color={theme.c.muted}>
            {t('ivy.book.noTimes')}
          </Txt>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {slots.map((s) => {
              const active = slot?.start.getTime() === s.start.getTime();
              return (
                <Pressable
                  key={s.start.getTime()}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSlot(s);
                  }}
                  style={({ pressed }) => ({
                    width: tile,
                    height: specialistId === 'any' ? 58 : 48,
                    borderRadius: theme.r.control,
                    backgroundColor: active ? theme.c.ink : theme.c.surface,
                    borderWidth: active ? 0 : 1,
                    borderColor: theme.c.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Txt variant="bodyStrong" color={active ? theme.c.onPrimary : theme.c.ink}>
                    {time(s.start)}
                  </Txt>
                  {specialistId === 'any' ? (
                    <Txt variant="caption" color={active ? theme.c.onPrimary : theme.c.muted}>
                      {specialistById(s.specialistId).name}
                    </Txt>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </Group>
    </Screen>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Txt variant="eyebrow" color={theme.c.muted}>
        {label}
      </Txt>
      {children}
    </View>
  );
}

function PersonTile({ name, note, selected, onPress }: { name: string; note: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        minWidth: 112,
        height: 60,
        paddingHorizontal: 14,
        borderRadius: theme.r.control,
        backgroundColor: selected ? theme.c.ink : theme.c.surface,
        borderWidth: selected ? 0 : 1,
        borderColor: theme.c.line,
        justifyContent: 'center',
        gap: 1,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Txt variant="bodyStrong" color={selected ? theme.c.onPrimary : theme.c.ink}>
        {name}
      </Txt>
      <Txt variant="caption" color={selected ? theme.c.onPrimary : theme.c.muted} numberOfLines={1}>
        {note}
      </Txt>
    </Pressable>
  );
}
