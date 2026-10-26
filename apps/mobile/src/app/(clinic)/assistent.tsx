import {
  addDays,
  DEALS,
  freeSlots,
  inSentence,
  MEMBER,
  LASER_ZONES,
  locationById,
  packagePrice,
  specialistById,
  startOfDay,
  treatmentById,
  type FreeSlot,
  type LocationId,
  type TreatmentId,
} from '@pure-clinics/shared';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { Rail, useModalTop } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { cityName, useClinic } from '@/clinic';
import { useTheme } from '@/theme';

/** Free times the assistant offers: for a new intake, or to move an existing appointment (`replace`). */
type SlotChoice = { treatmentId: TreatmentId; locationId: LocationId; slots: FreeSlot[]; replace?: string };
type NewMessage =
  | { kind: 'text'; from: 'user' | 'bot'; text: string }
  | ({ kind: 'options' } & SlotChoice)
  | { kind: 'link'; label: string; href: Href }
  | { kind: 'booked'; appointmentId: string };
type Message = NewMessage & { id: number };

type Prompt = 'q1' | 'q2' | 'reschedule' | 'price' | 'insurance';

/** Laser zones in the price question, and the deal that covers them. */
const PRICE_ZONES = ['armpits', 'bikini'];
const PRICE_DEAL = 'w1';

/** A scripted demo of the assistant: it answers the example questions and really books the free intake. */
export default function PureAssistant() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, text, euro, locale } = useI18n();
  const clinic = useClinic();
  const scroll = useRef<ScrollViewInstance>(null);
  const nextId = useRef(1);
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 0, kind: 'text', from: 'bot', text: t('clinic.assistant.intro', { name: MEMBER.firstName }) },
  ]);
  const [typing, setTyping] = useState(false);
  const [used, setUsed] = useState<Prompt[]>([]);
  const [draft, setDraft] = useState('');
  const top = useModalTop();

  // Free intakes on the first Wednesday evening ahead in Nijmegen, which is open until nine that day.
  const consult = treatmentById('consult');
  const evening = (() => {
    for (let i = 0; i < 21; i++) {
      const day = addDays(startOfDay(clinic.now), i);
      if (day.getDay() !== 3) continue;
      const slots = freeSlots(consult, 'any', day, clinic.now, 'nijmegen', clinic.appointments).filter((s) => s.start.getHours() >= 18);
      if (slots.length > 0) return slots.slice(0, 3);
    }
    return [];
  })();

  const push = (...items: NewMessage[]) => setMessages((list) => [...list, ...items.map((m) => ({ ...m, id: nextId.current++ }))]);

  const reply = (items: NewMessage[]) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      push(...items);
    }, 900);
  };

  const bookFirst = (): NewMessage[] => {
    const slot = evening[0];
    if (!slot) return [{ kind: 'text', from: 'bot', text: t('clinic.assistant.fallback') }];
    const appointmentId = clinic.bookAppointment({ treatmentId: 'consult', specialistId: slot.specialistId, locationId: 'nijmegen', start: slot.start });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return [{ kind: 'booked', appointmentId }];
  };

  // The next appointment with its first free times on later days, with the same specialist.
  const reschedule = (): NewMessage[] => {
    const next = clinic.next;
    if (!next) return [{ kind: 'text', from: 'bot', text: t('clinic.assistant.reply.none') }];
    const others = clinic.appointments.filter((a) => a.id !== next.id);
    const slots: FreeSlot[] = [];
    for (let i = 1; i <= 14 && slots.length < 3; i++) {
      const day = addDays(startOfDay(next.start), i);
      slots.push(...freeSlots(next.treatment, next.specialistId, day, clinic.now, next.locationId, others).slice(0, 3 - slots.length));
    }
    return [
      {
        kind: 'text',
        from: 'bot',
        text: t('clinic.assistant.reply.reschedule', { treatment: inSentence(text(next.treatment.name), locale), name: next.specialist.name }),
      },
      { kind: 'options', treatmentId: next.treatmentId, locationId: next.locationId, slots, replace: next.id },
    ];
  };

  const price = (): NewMessage[] => {
    const total = LASER_ZONES.filter((z) => PRICE_ZONES.includes(z.id)).reduce((sum, z) => sum + z.price, 0);
    const deal = DEALS.find((d) => d.id === PRICE_DEAL);
    return [
      { kind: 'text', from: 'bot', text: t('clinic.assistant.reply.price', { total: euro(total), package: euro(packagePrice(total)), deal: euro(deal?.price ?? total) }) },
      { kind: 'link', label: t('clinic.assistant.link.deal'), href: { pathname: '/afspraak/[treatmentId]', params: { treatmentId: 'laser', deal: PRICE_DEAL } } },
    ];
  };

  const ask = (prompt: Prompt) => {
    if (typing) return;
    setUsed((list) => [...list, prompt]);
    if (prompt === 'q1') {
      push({ kind: 'text', from: 'user', text: t('clinic.assistant.q1') });
      reply([
        { kind: 'text', from: 'bot', text: t('clinic.assistant.a1') },
        { kind: 'options', treatmentId: 'consult', locationId: 'nijmegen', slots: evening },
      ]);
    } else if (prompt === 'q2') {
      push({ kind: 'text', from: 'user', text: t('clinic.assistant.q2') });
      reply(bookFirst());
    } else {
      push({ kind: 'text', from: 'user', text: t(`clinic.assistant.chip.${prompt}`) });
      if (prompt === 'reschedule') reply(reschedule());
      else if (prompt === 'price') reply(price());
      else reply([{ kind: 'text', from: 'bot', text: t('clinic.assistant.reply.insurance') }]);
    }
  };

  const send = () => {
    const typed = draft.trim();
    if (!typed || typing) return;
    setDraft('');
    push({ kind: 'text', from: 'user', text: typed });
    reply([{ kind: 'text', from: 'bot', text: t('clinic.assistant.fallback') }]);
  };

  // The first suggested intake books like the follow-up question; any other time opens the booking screen on it.
  // Screens opened from here replace the sheet, so they show full-screen rather than inside it.
  const pick = (choice: SlotChoice, slot: FreeSlot) => {
    if (!choice.replace && slot === evening[0] && !used.includes('q2')) {
      ask('q2');
      return;
    }
    router.replace({
      pathname: '/afspraak/[treatmentId]',
      params: {
        treatmentId: choice.treatmentId,
        location: choice.locationId,
        specialist: slot.specialistId,
        slot: String(slot.start.getTime()),
        ...(choice.replace ? { replace: choice.replace } : {}),
      },
    });
  };

  const booked = messages.some((m) => m.kind === 'booked');
  const suggestions: Prompt[] = [
    ...(used.includes('q1') ? [] : (['q1'] as Prompt[])),
    ...(used.includes('q1') && !booked ? (['q2'] as Prompt[]) : []),
    ...(['reschedule', 'price', 'insurance'] as Prompt[]).filter((p) => !used.includes(p)),
  ];
  const label = (p: Prompt) => (p === 'q1' || p === 'q2' ? t(`clinic.assistant.${p}`) : t(`clinic.assistant.chip.${p}`));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 20,
          paddingTop: top,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: theme.c.line,
        }}
      >
        <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: theme.c.ink, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkle" size={20} color={theme.c.sand} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="heading">{t('clinic.assistant.title')}</Txt>
          <Txt variant="small" color={theme.c.muted}>
            {t('clinic.assistant.subtitle')}
          </Txt>
        </View>
        <IconButton icon="close" label={t('common.close')} tone="surface" onPress={() => router.back()} />
      </View>

      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) => (
          <MessageView key={m.id} message={m} onPick={pick} />
        ))}
        {typing ? <Typing /> : null}
      </ScrollView>

      <View style={{ paddingTop: 10, paddingBottom: Math.max(insets.bottom, 12), gap: 10, borderTopWidth: 1, borderTopColor: theme.c.line, backgroundColor: theme.c.surface }}>
        {suggestions.length > 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <Rail gap={8}>
              {suggestions.map((p) => (
                <Pressable
                  key={p}
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    ask(p);
                  }}
                  style={({ pressed }) => ({
                    maxWidth: 280,
                    minHeight: 40,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: theme.r.chip,
                    borderWidth: 1,
                    backgroundColor: p === 'q1' || p === 'q2' ? theme.c.highlight : theme.c.surface,
                    borderColor: p === 'q1' || p === 'q2' ? theme.c.highlight : theme.c.lineStrong,
                    justifyContent: 'center',
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Txt variant="smallStrong" numberOfLines={2} color={p === 'q1' || p === 'q2' ? theme.c.onHighlight : theme.c.ink}>
                    {label(p)}
                  </Txt>
                </Pressable>
              ))}
            </Rail>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20 }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={send}
            placeholder={t('clinic.assistant.placeholder')}
            placeholderTextColor={theme.c.muted}
            returnKeyType="send"
            style={{
              flex: 1,
              height: 46,
              paddingHorizontal: 14,
              borderRadius: theme.r.control,
              backgroundColor: theme.c.bg,
              fontFamily: theme.f.body,
              fontSize: 15,
              color: theme.c.ink,
              textAlign: theme.rtl ? 'right' : 'left',
            }}
          />
          {draft.trim() ? (
            <IconButton icon="arrow" label={t('common.send')} tone="ink" onPress={send} size={46} />
          ) : (
            <IconButton
              icon="mic"
              label={t('clinic.assistant.mic')}
              tone="ink"
              onPress={() => push({ kind: 'text', from: 'bot', text: t('common.demoNote') })}
              size={46}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageView({ message, onPick }: { message: Message; onPick: (choice: SlotChoice, slot: FreeSlot) => void }) {
  const theme = useTheme();
  if (message.kind === 'text') {
    const mine = message.from === 'user';
    return (
      <View
        style={{
          alignSelf: mine ? 'flex-end' : 'flex-start',
          maxWidth: '84%',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 16,
          borderBottomEndRadius: mine ? 4 : 16,
          borderBottomStartRadius: mine ? 16 : 4,
          backgroundColor: mine ? theme.c.ink : theme.c.surface,
        }}
      >
        <Txt variant="body" color={mine ? '#FFFFFF' : theme.c.ink}>
          {message.text}
        </Txt>
      </View>
    );
  }
  if (message.kind === 'options') return <Options choice={message} onPick={onPick} />;
  if (message.kind === 'link') {
    return (
      <Button
        kind="secondary"
        size="sm"
        label={message.label}
        iconAfter="arrow"
        onPress={() => router.replace(message.href)}
        style={{ alignSelf: 'flex-start' }}
      />
    );
  }
  return <Booked appointmentId={message.appointmentId} />;
}

function Options({ choice, onPick }: { choice: SlotChoice; onPick: (choice: SlotChoice, slot: FreeSlot) => void }) {
  const theme = useTheme();
  const { t, text, time, relativeDay } = useI18n();
  const treatment = treatmentById(choice.treatmentId);
  const location = locationById(choice.locationId);
  if (choice.slots.length === 0) {
    return (
      <Txt variant="small" color={theme.c.muted}>
        {t('clinic.book.noTimes')}
      </Txt>
    );
  }
  return (
    <View style={{ gap: 8, alignSelf: 'stretch' }}>
      {choice.slots.map((s) => (
        <Pressable
          key={s.start.getTime()}
          accessibilityRole="button"
          onPress={() => onPick(choice, s)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 10,
            borderRadius: 16,
            backgroundColor: theme.c.surface,
            borderWidth: 1,
            borderColor: theme.c.line,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Photo photo={treatment.photo} style={{ width: 52, height: 60, borderRadius: 10 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="smallStrong" color={theme.c.muted}>{`${relativeDay(s.start)} · ${time(s.start)}`}</Txt>
            <Txt variant="bodyStrong">{text(treatment.name)}</Txt>
            <Txt variant="small" color={theme.c.muted}>
              {`${specialistById(s.specialistId).name} · ${cityName(location)}`}
            </Txt>
          </View>
          <Icon name="chevron" size={18} color={theme.c.muted} />
        </Pressable>
      ))}
    </View>
  );
}

function Booked({ appointmentId }: { appointmentId: string }) {
  const theme = useTheme();
  const { t, dayShort, time } = useI18n();
  const clinic = useClinic();
  const appointment = clinic.byId(appointmentId);
  if (!appointment) return null;
  return (
    <View style={{ alignSelf: 'stretch', borderRadius: theme.r.card, backgroundColor: theme.c.ink, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 30, height: 30, borderRadius: theme.r.small, backgroundColor: theme.c.sand, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={17} strokeWidth={2.4} />
        </View>
        <Txt variant="bodyStrong" color="#FFFFFF" style={{ flex: 1 }}>
          {t('clinic.assistant.bookedTitle')}
        </Txt>
      </View>
      <Txt variant="small" color={theme.c.onPhotoMuted}>
        {t('clinic.assistant.bookedBody', {
          when: `${dayShort(appointment.start)} ${time(appointment.start)}`,
          name: appointment.specialist.name,
          city: cityName(appointment.location),
        })}
      </Txt>
      <Button
        kind="light"
        size="sm"
        label={t('common.view')}
        iconAfter="arrow"
        onPress={() => router.replace({ pathname: '/bevestiging/[id]', params: { id: appointment.id } })}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  );
}

/** Three small squares that pulse while the assistant "types". */
function Typing() {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 3, duration: 900, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRadius: 16,
        borderBottomStartRadius: 4,
        backgroundColor: theme.c.surface,
      }}
    >
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 2,
            backgroundColor: theme.c.muted,
            opacity: pulse.interpolate({
              inputRange: [0, 0.5, 1, 1.5, 2, 2.5, 3],
              outputRange: [0, 1, 2, 3, 4, 5, 6].map((step) => (step === 2 * i + 1 ? 1 : 0.3)),
            }),
          }}
        />
      ))}
    </View>
  );
}
