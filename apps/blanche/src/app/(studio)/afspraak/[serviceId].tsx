import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PopIn, Squish } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { Pills } from '@/components/Pills';
import { Footer, Screen } from '@/components/Screen';
import { Sticker } from '@/components/Sticker';
import { StylistCard } from '@/components/StylistCard';
import { Txt } from '@/components/Txt';
import { addDays, sameDay, startOfDay } from '@pure-clinics/shared';

import {
  addOnById,
  DEALS,
  isServiceId,
  locationBlanche,
  lookById,
  openSlots,
  placesFor,
  polishById,
  rewardById,
  serviceById,
  studioHours,
  stylistById,
  stylistsFor,
  type AddOnId,
  type Service,
  type Slot,
  type StudioLocationId,
  type StylistId,
} from '@/data';
import { useI18n } from '@/i18n';
import { useLayout } from '@/layout';
import { useStudio } from '@/studio';
import { categoryColors, useTheme } from '@/theme';

type Params = {
  serviceId: string;
  stylist?: string;
  slot?: string;
  addOns?: string;
  look?: string;
  shade?: string;
  deal?: string;
  replace?: string;
  location?: string;
};

export default function BookingScreen() {
  const params = useLocalSearchParams<Params>();
  if (!params.serviceId || !isServiceId(params.serviceId)) return <Redirect href="/boeken" />;
  return <Booking service={serviceById(params.serviceId)} params={params} />;
}

function Booking({ service, params }: { service: Service; params: Params }) {
  const theme = useTheme();
  const { wide } = useLayout();
  const { t, text, euro, time, dayShort, weekday } = useI18n();
  const studio = useStudio();
  const colors = categoryColors(service.category);
  const replacing = params.replace ? studio.byId(params.replace) : undefined;
  const places = placesFor(service);
  const [location, setLocation] = useState<StudioLocationId>(() =>
    params.location === 'uden' && places.includes('uden') ? 'uden' : (replacing?.location ?? 'nijmegen'),
  );
  const team = stylistsFor(service, location);
  const look = params.look ? lookById(params.look) : undefined;
  const shade = params.shade ? polishById(params.shade) : undefined;
  const deal = params.deal ? DEALS.find((d) => d.id === params.deal) : undefined;
  const extras = (params.addOns ? params.addOns.split(',') : (look?.addOns ?? [])).filter(
    (x): x is AddOnId => !!x && service.addOns?.includes(x as AddOnId) === true,
  );
  const minutes = service.minutes + extras.reduce((sum, id) => sum + addOnById(id).minutes, 0);
  const price = deal ? deal.price : service.price + extras.reduce((sum, id) => sum + addOnById(id).price, 0);

  const [stylistId, setStylistId] = useState<StylistId | 'any'>(() => team.find((s) => s.id === params.stylist)?.id ?? replacing?.stylistId ?? 'any');
  const busy = useMemo(() => studio.bookings.filter((b) => b.id !== params.replace), [studio.bookings, params.replace]);
  const days = useMemo(() => Array.from({ length: 21 }, (_, i) => addDays(startOfDay(studio.now), i)), [studio.now]);
  const slotsOn = (day: Date, who: StylistId | 'any' = stylistId, where: StudioLocationId = location) =>
    openSlots(service, who, day, studio.now, busy, minutes, where);
  const suggested = params.slot ? new Date(Number(params.slot)) : null;
  const [day, setDay] = useState<Date>(() => (suggested ? startOfDay(suggested) : (days.find((d) => slotsOn(d).length > 0) ?? days[0])));
  const [slot, setSlot] = useState<Slot | null>(() =>
    suggested ? (slotsOn(startOfDay(suggested)).find((s) => s.start.getTime() === suggested.getTime()) ?? null) : null,
  );
  const slots = slotsOn(day);
  const voucher = studio.vouchers.map((id) => rewardById(id)).find((r) => r && (r.category === service.category || r.category === 'all'));
  const [useVoucher, setUseVoucher] = useState(false);
  const last = studio.lastStylistFor(service.id);

  const chooseLocation = (where: StudioLocationId) => {
    setLocation(where);
    const who = stylistsFor(service, where).some((s) => s.id === stylistId) ? stylistId : 'any';
    setStylistId(who);
    setSlot(null);
    if (slotsOn(day, who, where).length === 0) setDay(days.find((d) => slotsOn(d, who, where).length > 0) ?? day);
  };

  const chooseStylist = (id: StylistId | 'any') => {
    setStylistId(id);
    setSlot(null);
    if (slotsOn(day, id).length === 0) setDay(days.find((d) => slotsOn(d, id).length > 0) ?? day);
  };

  const confirm = () => {
    if (!slot) return;
    const id = studio.book({
      serviceId: service.id,
      stylistId: slot.stylistId,
      location,
      start: slot.start,
      addOns: extras,
      shadeId: shade?.id ?? look?.shade,
      lookId: look?.id,
    });
    if (replacing) studio.cancel(replacing.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.replace({ pathname: '/bevestiging/[id]', params: replacing ? { id, moved: '1' } : { id } });
  };

  const groups: { key: 'morning' | 'afternoon' | 'evening'; list: Slot[] }[] = [
    { key: 'morning', list: slots.filter((s) => s.start.getHours() < 12) },
    { key: 'afternoon', list: slots.filter((s) => s.start.getHours() >= 12 && s.start.getHours() < 17) },
    { key: 'evening', list: slots.filter((s) => s.start.getHours() >= 17) },
  ];

  const footer = (
    <Footer>
      {slot ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 10, height: 34, borderRadius: 4, backgroundColor: colors.ink }} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong" numberOfLines={1}>{`${dayShort(slot.start)} · ${time(slot.start)}`}</Txt>
            <Txt variant="small" color={theme.c.muted} numberOfLines={1}>
              {`${t('book.with', { name: stylistById(slot.stylistId).name, minutes })} · ${locationBlanche(location).city}`}
            </Txt>
          </View>
          <Txt variant="price">{replacing ? '' : euro(price)}</Txt>
        </View>
      ) : (
        <Txt variant="small" color={theme.c.muted} align="center">
          {t('book.pickTime')}
        </Txt>
      )}
      <Button label={replacing ? t('book.move') : t('book.confirm')} disabled={!slot} onPress={confirm} icon="check" />
      <Txt variant="caption" color={theme.c.muted} align="center">
        {t('book.policy')}
      </Txt>
    </Footer>
  );

  return (
    <Screen footer={footer} gap={26}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="back" label={t('common.back')} tone="chalk" onPress={() => (router.canGoBack() ? router.back() : router.replace('/boeken'))} />
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: i === 1 ? 26 : 10, height: 10, borderRadius: 5, backgroundColor: i <= 1 ? colors.ink : theme.c.lineStrong }} />
          ))}
        </View>
      </View>

      <Txt variant="display">{replacing ? t('book.moveTitle') : t('book.title')}</Txt>

      <View style={{ flexDirection: 'row', gap: 14, padding: 10, borderRadius: 24, backgroundColor: colors.soft, alignItems: 'center' }}>
        <Photo photo={look?.photo ?? service.photo} style={{ width: 64, height: 76, borderRadius: 16 }} />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt variant="heading" numberOfLines={1}>
            {text(service.name)}
          </Txt>
          <Txt variant="small" color={theme.c.inkSoft} numberOfLines={2}>
            {[t('common.minutes', { n: minutes }), ...extras.map((id) => `+ ${text(addOnById(id).name)}`)].join(' · ')}
          </Txt>
          {look || shade ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <View
                style={{
                  width: 12,
                  height: 16,
                  borderRadius: 5,
                  backgroundColor: (shade ?? polishById(look!.shade)).hex,
                  borderWidth: 1,
                  borderColor: '#FFFFFF',
                }}
              />
              <Txt variant="caption" color={theme.c.inkSoft}>
                {look ? t('book.look', { name: look.name }) : t('book.shade', { name: shade!.name })}
              </Txt>
            </View>
          ) : null}
        </View>
        <Squish onPress={() => router.back()} accessibilityLabel={t('common.change')} style={{ paddingHorizontal: 10 }}>
          <Txt variant="smallStrong" style={{ textDecorationLine: 'underline' }}>
            {t('common.change')}
          </Txt>
        </Squish>
      </View>

      {deal ? (
        <Sticker
          label={t('book.deal', { name: text(deal.title), amount: euro(deal.was - deal.price) })}
          bg={theme.c.honeySoft}
          angle={-2}
          still
          big
          icon="gift"
        />
      ) : null}

      {places.length > 1 ? (
        <View style={{ gap: 12 }}>
          <Txt variant="title">{t('book.where')}</Txt>
          <Pills
            label={t('book.where')}
            value={location}
            onChange={chooseLocation}
            options={places.map((id) => ({ value: id, label: `${locationBlanche(id).city} · ${locationBlanche(id).address}`, icon: 'pin' as const }))}
          />
        </View>
      ) : null}

      <View style={{ gap: 12 }}>
        <Txt variant="title">{t('book.stylist')}</Txt>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: wide ? 0 : -20 }}
          contentContainerStyle={{ paddingHorizontal: wide ? 0 : 20, gap: 12, paddingVertical: 6 }}
        >
          <Squish onPress={() => chooseStylist('any')} scaleTo={0.95} accessibilityRole="radio" accessibilityState={{ checked: stylistId === 'any' }}>
            <View
              style={{
                width: 132,
                height: '100%',
                minHeight: 230,
                borderRadius: 24,
                padding: 16,
                justifyContent: 'space-between',
                backgroundColor: stylistId === 'any' ? theme.c.ink : theme.c.chalk,
              }}
            >
              <Icon name="sparkle" size={30} color={stylistId === 'any' ? '#FFFFFF' : theme.c.ink} />
              <View style={{ gap: 4 }}>
                <Txt variant="title" color={stylistId === 'any' ? '#FFFFFF' : theme.c.ink} style={{ fontSize: 24, lineHeight: 26 }}>
                  {t('book.anyone')}
                </Txt>
                <Txt variant="caption" color={stylistId === 'any' ? 'rgba(255,255,255,0.7)' : theme.c.muted}>
                  {t('book.anyoneSub')}
                </Txt>
              </View>
            </View>
          </Squish>
          {team.map((s) => (
            <StylistCard
              key={s.id}
              stylist={s}
              service={service}
              selected={stylistId === s.id}
              onPress={() => chooseStylist(s.id)}
              note={last === s.id ? t('book.sameAsLast') : undefined}
              location={location}
            />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: 12 }}>
        <Txt variant="title">{t('book.day')}</Txt>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: wide ? 0 : -20 }}
          contentContainerStyle={{ paddingHorizontal: wide ? 0 : 20, gap: 8, paddingVertical: 4 }}
        >
          {days.map((d) => {
            const closed = !studioHours(d, location);
            const free = closed ? 0 : slotsOn(d).length;
            const on = sameDay(d, day);
            return (
              <Squish
                key={d.getTime()}
                disabled={free === 0}
                scaleTo={0.9}
                onPress={() => {
                  setDay(d);
                  setSlot(null);
                }}
                accessibilityState={{ selected: on, disabled: free === 0 }}
                accessibilityLabel={dayShort(d)}
              >
                <View
                  style={{
                    width: 62,
                    height: 86,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    backgroundColor: on ? colors.ink : '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: on ? colors.ink : theme.c.line,
                    opacity: free === 0 ? 0.38 : 1,
                  }}
                >
                  <Txt variant="caption" color={on ? 'rgba(255,255,255,0.8)' : theme.c.muted}>
                    {weekday(d)}
                  </Txt>
                  <Txt variant="title" color={on ? '#FFFFFF' : theme.c.ink} style={{ fontSize: 30, lineHeight: 32 }}>
                    {String(d.getDate())}
                  </Txt>
                  <Txt variant="caption" color={on ? '#FFFFFF' : free ? theme.c.mint : theme.c.muted} style={{ fontSize: 10 }}>
                    {closed ? t('book.closed') : free ? t('book.free', { n: free }) : t('book.full')}
                  </Txt>
                </View>
              </Squish>
            );
          })}
        </ScrollView>
      </View>

      <PopIn key={`${day.getTime()}-${stylistId}`} style={{ gap: 16 }}>
        {slots.length === 0 ? (
          <Txt variant="body" color={theme.c.muted}>
            {t('book.noTimes')}
          </Txt>
        ) : (
          groups
            .filter((g) => g.list.length)
            .map((g) => (
              <View key={g.key} style={{ gap: 10 }}>
                <Txt variant="tag" color={theme.c.muted}>
                  {t(`book.${g.key}`)}
                </Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {g.list.map((s) => {
                    const on = slot?.start.getTime() === s.start.getTime();
                    return (
                      <Squish
                        key={s.start.getTime()}
                        scaleTo={0.9}
                        onPress={() => setSlot(s)}
                        accessibilityState={{ selected: on }}
                        style={{
                          height: 46,
                          minWidth: 82,
                          paddingHorizontal: 14,
                          borderRadius: theme.r.pill,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: on ? theme.c.primary : '#FFFFFF',
                          borderWidth: 1.5,
                          borderColor: on ? theme.c.primary : theme.c.lineStrong,
                          boxShadow: on ? theme.shadow.pop : undefined,
                        }}
                      >
                        <Txt variant="bodyStrong" color={on ? '#FFFFFF' : theme.c.ink}>
                          {time(s.start)}
                        </Txt>
                        {stylistId === 'any' ? (
                          <Txt variant="caption" color={on ? 'rgba(255,255,255,0.85)' : theme.c.muted} style={{ fontSize: 10 }}>
                            {stylistById(s.stylistId).name}
                          </Txt>
                        ) : null}
                      </Squish>
                    );
                  })}
                </View>
              </View>
            ))
        )}
      </PopIn>

      {voucher ? (
        <Squish
          onPress={() => setUseVoucher((v) => !v)}
          scaleTo={0.97}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: useVoucher }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            borderRadius: 22,
            backgroundColor: useVoucher ? theme.c.mintSoft : theme.c.chalk,
          }}
        >
          <Icon name="gift" size={22} color={useVoucher ? theme.c.mint : theme.c.ink} />
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{t('book.voucher')}</Txt>
            <Txt variant="small" color={theme.c.inkSoft}>
              {text(voucher.name)}
            </Txt>
          </View>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 9,
              borderWidth: 2,
              borderColor: useVoucher ? theme.c.mint : theme.c.lineStrong,
              backgroundColor: useVoucher ? theme.c.mint : '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {useVoucher ? <Icon name="check" size={16} color="#FFFFFF" strokeWidth={2.6} /> : null}
          </View>
        </Squish>
      ) : null}
    </Screen>
  );
}
