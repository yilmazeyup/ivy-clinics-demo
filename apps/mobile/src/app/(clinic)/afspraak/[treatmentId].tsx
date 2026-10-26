import {
  addDays,
  DEALS,
  freeSlots,
  MEMBER,
  LASER_ZONES,
  LOCATIONS,
  openingHours,
  packagePrice,
  sameDay,
  specialistById,
  specialistsFor,
  startOfDay,
  TREATMENTS,
  type Deal,
  type FreeSlot,
  type LocationId,
  type SpecialistId,
  type Treatment,
} from '@pure-clinics/shared';
import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { DayStrip } from '@/components/DayStrip';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { Footer, Rail, Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cityName, roleKey, useClinic } from '@/clinic';
import { DETAIL_WIDTH, useLayout } from '@/layout';
import { useTheme } from '@/theme';

type Params = { treatmentId: string; location?: string; specialist?: string; slot?: string; replace?: string; deal?: string };

export default function BookingScreen() {
  const params = useLocalSearchParams<Params>();
  const treatment = TREATMENTS.find((tr) => tr.id === params.treatmentId);
  if (!treatment) return <Redirect href="/boeken" />;
  return <Booking treatment={treatment} params={params} />;
}

function Booking({ treatment, params }: { treatment: Treatment; params: Params }) {
  const theme = useTheme();
  const { wide, inner } = useLayout();
  const { t, text, euro, time, dayShort } = useI18n();
  const clinic = useClinic();
  const replacing = params.replace ? clinic.byId(params.replace) : undefined;

  const [locationId, setLocationId] = useState<LocationId>(
    () => LOCATIONS.find((l) => l.id === params.location)?.id ?? replacing?.locationId ?? MEMBER.locationId,
  );
  const team = specialistsFor(treatment, locationId);
  const [specialistId, setSpecialistId] = useState<SpecialistId | 'any'>(
    () => team.find((s) => s.id === params.specialist)?.id ?? 'any',
  );
  // The member's other appointments block those times; the one being moved does not.
  const busy = useMemo(() => clinic.appointments.filter((a) => a.id !== params.replace), [clinic.appointments, params.replace]);
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(startOfDay(clinic.now), i)), [clinic.now]);
  const slotsOn = (day: Date, who: SpecialistId | 'any' = specialistId, where: LocationId = locationId) =>
    freeSlots(treatment, who, day, clinic.now, where, busy);

  const suggested = params.slot ? new Date(Number(params.slot)) : null;
  const [day, setDay] = useState<Date>(() => (suggested ? startOfDay(suggested) : (days.find((d) => slotsOn(d).length > 0) ?? days[0])));
  const [slot, setSlot] = useState<FreeSlot | null>(() =>
    suggested ? (slotsOn(startOfDay(suggested)).find((s) => s.start.getTime() === suggested.getTime()) ?? null) : null,
  );
  const slots = slotsOn(day);
  const last = clinic.lastSpecialistFor(treatment.id);
  const firstTime = treatment.id !== 'consult' && treatment.category !== 'beauty' && !clinic.past.some((a) => a.treatmentId === treatment.id);
  // Laser is priced per zone. A deal from Home fixes the zones; someone who had laser before starts with last time's zones.
  const laser = treatment.id === 'laser';
  const [deal, setDeal] = useState<Deal | null>(() => DEALS.find((d) => d.id === params.deal) ?? null);
  const [zones, setZones] = useState<string[]>(() => (clinic.past.some((a) => a.treatmentId === 'laser') ? ['armpits', 'bikini'] : []));
  const [pack, setPack] = useState(false);
  const zoneTotal = zones.reduce((sum, id) => sum + (LASER_ZONES.find((z) => z.id === id)?.price ?? 0), 0);
  const perTime = deal ? deal.price : pack ? packagePrice(zoneTotal) : zoneTotal;
  const needsZone = laser && !deal && zones.length === 0;
  // Three times per row on a phone, five on a computer screen.
  const columns = wide ? 5 : 3;
  const tile = (inner(DETAIL_WIDTH) - 8 * (columns - 1)) / columns;
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
    const id = clinic.bookAppointment({ treatmentId: treatment.id, specialistId: slot.specialistId, locationId, start: slot.start });
    if (replacing) clinic.cancelAppointment(replacing.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: '/bevestiging/[id]', params: replacing ? { id, moved: '1' } : { id } });
  };

  const footer = (
    <Footer>
      {slot ? (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {`${dayShort(slot.start)} · ${time(slot.start)} · ${specialistById(slot.specialistId).name}`}
          </Txt>
          <Txt variant="small" color={theme.c.muted}>
            {replacing
              ? ''
              : deposit
                ? t('clinic.book.deposit', { amount: euro(deposit) })
                : laser
                  ? euro(perTime)
                  : treatment.priceFrom
                    ? t('clinic.price.from', { price: euro(treatment.priceFrom) })
                    : t('clinic.price.free')}
          </Txt>
        </View>
      ) : null}
      <Button label={deposit ? t('clinic.book.continue') : t('clinic.book.confirmFree')} disabled={!slot || needsZone} onPress={confirm} />
      <Txt variant="caption" color={theme.c.muted} align="center">
        {t('clinic.book.policy')}
      </Txt>
    </Footer>
  );

  return (
    <Screen gap={22} footer={footer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="back" label={t('common.back')} tone="surface" onPress={() => router.back()} />
        <Txt variant="small" color={theme.c.muted}>
          {t('clinic.book.step', { n: 2 })}
        </Txt>
      </View>

      <Txt variant="display">{t('clinic.book.moment')}</Txt>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 10 }}>
        <Photo photo={treatment.photo} style={{ width: 56, height: 68, borderRadius: theme.r.small }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="bodyStrong">{text(treatment.name)}</Txt>
          <Txt variant="small" color={theme.c.muted}>
            {`${t('common.minutes', { n: treatment.minutes })} · ${treatment.priceFrom ? t('clinic.price.from', { price: euro(treatment.priceFrom) }) : t('clinic.price.free')}`}
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
            {t('clinic.book.firstTime')}
          </Txt>
        </View>
      ) : null}

      {treatment.insurable ? (
        <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: theme.r.control, backgroundColor: theme.c.sand }}>
          <Icon name="wallet" size={18} color={theme.c.primary} />
          <Txt variant="small" color={theme.c.ink} style={{ flex: 1 }}>
            {t('clinic.book.insurance')}
          </Txt>
        </View>
      ) : null}

      {laser && deal ? <DealCard deal={deal} onChange={() => setDeal(null)} /> : null}
      {laser && !deal ? (
        <Group label={t('clinic.zones.title')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LASER_ZONES.map((z) => {
              const on = zones.includes(z.id);
              return (
                <Chip
                  key={z.id}
                  label={`${text(z.name)} · ${euro(z.price)}`}
                  icon={on ? 'check' : undefined}
                  selected={on}
                  onPress={() => setZones((list) => (on ? list.filter((x) => x !== z.id) : [...list, z.id]))}
                />
              );
            })}
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: pack }}
            onPress={() => {
              Haptics.selectionAsync();
              setPack((on) => !on);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: theme.r.control,
              backgroundColor: theme.c.surface,
              borderWidth: pack ? 1.5 : 1,
              borderColor: pack ? theme.c.ink : theme.c.line,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                borderWidth: pack ? 0 : 1.5,
                borderColor: theme.c.lineStrong,
                backgroundColor: pack ? theme.c.ink : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {pack ? <Icon name="check" size={14} color={theme.c.onPrimary} strokeWidth={2.4} /> : null}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="bodyStrong">{t('clinic.zones.package')}</Txt>
              <Txt variant="small" color={theme.c.muted}>
                {t('clinic.zones.hint')}
              </Txt>
            </View>
          </Pressable>
          <Txt variant="bodyStrong" color={zones.length ? theme.c.ink : theme.c.muted}>
            {zones.length ? t('clinic.zones.total', { price: euro(perTime) }) : t('clinic.zones.none')}
          </Txt>
        </Group>
      ) : null}

      <Group label={t('clinic.book.location')}>
        <Segmented
          label={t('clinic.book.location')}
          value={locationId}
          onChange={chooseLocation}
          options={LOCATIONS.map((l) => ({ value: l.id, label: cityName(l), icon: 'pin' as const }))}
        />
      </Group>

      <Group label={t('clinic.book.specialist')}>
        <Rail gap={8}>
          <PersonTile name={t('clinic.book.anyone')} note={t('clinic.book.firstAvailable')} selected={specialistId === 'any'} onPress={() => chooseSpecialist('any')} />
          {team.map((s) => (
            <PersonTile
              key={s.id}
              name={s.name}
              note={s.id === last ? t('clinic.book.sameAsLast') : t(roleKey(s.role))}
              selected={specialistId === s.id}
              onPress={() => chooseSpecialist(s.id)}
            />
          ))}
        </Rail>
      </Group>

      <Group label={t('clinic.book.dates')}>
        <DayStrip
          days={days}
          selected={day}
          onSelect={(d) => {
            setDay(d);
            setSlot(null);
          }}
          isDisabled={(d) => openingHours(d, locationId) === null}
          isMarked={(d) => clinic.upcoming.some((a) => sameDay(a.start, d))}
        />
      </Group>

      <Group label={specialistId === 'any' ? t('clinic.book.timesAll') : t('clinic.book.timesWith', { name: specialistById(specialistId).name })}>
        {openingHours(day, locationId) === null ? (
          <Txt variant="body" color={theme.c.muted}>
            {t('clinic.book.closed')}
          </Txt>
        ) : slots.length === 0 ? (
          <Txt variant="body" color={theme.c.muted}>
            {t('clinic.book.noTimes')}
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

/** A deal chosen on Home: its zones and price, with a way back to choosing zones yourself. */
function DealCard({ deal, onChange }: { deal: Deal; onChange: () => void }) {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  return (
    <Group label={`${t('clinic.deals.eyebrow')} · ${t(`clinic.deals.${deal.group}`)}`}>
      <View style={{ backgroundColor: theme.c.sand, borderRadius: theme.r.card, padding: 16, gap: 6 }}>
        <Txt variant="heading">{text(deal.zones)}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
          <Txt variant="title">{euro(deal.price)}</Txt>
          {deal.was ? (
            <Txt variant="small" color={theme.c.muted} style={{ textDecorationLine: 'line-through' }}>
              {t('clinic.deals.was', { price: euro(deal.was) })}
            </Txt>
          ) : null}
        </View>
        <Txt variant="caption" color={theme.c.muted}>
          {t('clinic.deals.note')}
        </Txt>
        <Pressable accessibilityRole="button" onPress={onChange} hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
          <Txt variant="smallStrong" color={theme.c.primary}>
            {t('clinic.zones.title')}
          </Txt>
        </Pressable>
      </View>
    </Group>
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
