import { CLASS_TYPES, IVY_MEMBER, onReformer, sameDay, WINDOW_REFORMERS } from '@pure-ivy/shared';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { Rail, useModalTop } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { usePilates, type SessionView } from '@/pilates';
import { useTheme } from '@/theme';

type NewMessage =
  | { kind: 'text'; from: 'user' | 'bot'; text: string }
  | { kind: 'options'; sessionIds: string[] }
  | { kind: 'booked'; sessionId: string; reformer: number; creditsLeft: number };
type Message = NewMessage & { id: number };

type Prompt = 'q1' | 'q2' | 'reschedule' | 'pause' | 'invite';

/** A scripted demo of the assistant: it answers the example questions and really books the class. */
export default function PureAssistant() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const pilates = usePilates();
  const scroll = useRef<ScrollViewInstance>(null);
  const nextId = useRef(1);
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 0, kind: 'text', from: 'bot', text: t('pilates.ai.intro', { name: IVY_MEMBER.firstName }) },
  ]);
  const [typing, setTyping] = useState(false);
  const [used, setUsed] = useState<Prompt[]>([]);
  const [draft, setDraft] = useState('');
  const top = useModalTop();

  // The first Thursday ahead with calm evening classes, e.g. 19:15 Stretch & Release and 20:30 Slow Flow.
  const calmThursday = pilates.upcoming.filter(
    (s) => s.start.getDay() === 4 && s.start.getHours() >= 18 && CLASS_TYPES[s.typeId].level === 'calm' && onReformer(s.typeId),
  );
  const thursday = calmThursday.filter((s) => sameDay(s.start, calmThursday[0]?.start ?? new Date(0)));
  const target = thursday.find((s) => s.start.getHours() === 19) ?? thursday[0];

  const push = (...items: NewMessage[]) => setMessages((list) => [...list, ...items.map((m) => ({ ...m, id: nextId.current++ }))]);

  const reply = (items: NewMessage[]) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      push(...items);
    }, 900);
  };

  const bookTarget = (): NewMessage[] => {
    if (!target) return [{ kind: 'text', from: 'bot', text: t('pilates.ai.fallback') }];
    if (target.booking) {
      return [{ kind: 'booked', sessionId: target.id, reformer: target.booking.spot, creditsLeft: pilates.credits }];
    }
    const reformer = WINDOW_REFORMERS.find((n) => !target.taken.includes(n)) ?? [1, 2, 3, 4, 5, 6, 7, 8].find((n) => !target.taken.includes(n));
    if (!reformer || !pilates.bookClass(target.id, reformer)) {
      return [{ kind: 'text', from: 'bot', text: t('pilates.class.noCredits') }];
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return [{ kind: 'booked', sessionId: target.id, reformer, creditsLeft: pilates.unlimited ? pilates.credits : pilates.credits - 1 }];
  };

  const ask = (prompt: Prompt) => {
    if (typing) return;
    setUsed((list) => [...list, prompt]);
    if (prompt === 'q1') {
      push({ kind: 'text', from: 'user', text: t('pilates.ai.q1') });
      reply([
        { kind: 'text', from: 'bot', text: t('pilates.ai.a1') },
        { kind: 'options', sessionIds: thursday.map((s) => s.id) },
      ]);
    } else if (prompt === 'q2') {
      push({ kind: 'text', from: 'user', text: t('pilates.ai.q2') });
      reply(bookTarget());
    } else {
      push({ kind: 'text', from: 'user', text: t(`pilates.ai.chip.${prompt}`) });
      reply([{ kind: 'text', from: 'bot', text: t(`pilates.ai.reply.${prompt}`) }]);
    }
  };

  const send = () => {
    const text = draft.trim();
    if (!text || typing) return;
    setDraft('');
    push({ kind: 'text', from: 'user', text });
    reply([{ kind: 'text', from: 'bot', text: t('pilates.ai.fallback') }]);
  };

  // Tapping a suggested class: the 19:15 one books like the follow-up question, others open the class.
  // Screens opened from here replace the sheet, so they show full-screen rather than inside it.
  const pick = (sessionId: string) => {
    if (pilates.byId(sessionId)?.booking) router.replace(`/ivy/ticket/${sessionId}`);
    else if (sessionId === target?.id) ask('q2');
    else router.replace(`/ivy/les/${sessionId}`);
  };

  const booked = messages.some((m) => m.kind === 'booked');
  const suggestions: Prompt[] = [
    ...(used.includes('q1') ? [] : (['q1'] as Prompt[])),
    ...(used.includes('q1') && !booked ? (['q2'] as Prompt[]) : []),
    ...(['reschedule', 'pause', 'invite'] as Prompt[]).filter((p) => !used.includes(p)),
  ];
  const label = (p: Prompt) => (p === 'q1' || p === 'q2' ? t(`pilates.ai.${p}`) : t(`pilates.ai.chip.${p}`));

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
          <Txt variant="heading">{t('pilates.ai.title')}</Txt>
          <Txt variant="small" color={theme.c.muted}>
            {t('pilates.ai.subtitle')}
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
            placeholder={t('pilates.ai.placeholder')}
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
              label={t('pilates.ai.mic')}
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

function MessageView({ message, onPick }: { message: Message; onPick: (sessionId: string) => void }) {
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
  if (message.kind === 'options') return <Options sessionIds={message.sessionIds} onPick={onPick} />;
  return <Booked message={message} />;
}

function Options({ sessionIds, onPick }: { sessionIds: string[]; onPick: (sessionId: string) => void }) {
  const theme = useTheme();
  const { t, tp, time, relativeDay } = useI18n();
  const pilates = usePilates();
  const sessions = sessionIds.map((id) => pilates.byId(id)).filter((s): s is SessionView => Boolean(s));
  return (
    <View style={{ gap: 8, alignSelf: 'stretch' }}>
      {sessions.map((s) => (
        <Pressable
          key={s.id}
          accessibilityRole="button"
          onPress={() => onPick(s.id)}
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
          <Photo photo={CLASS_TYPES[s.typeId].photo} style={{ width: 52, height: 60, borderRadius: 10 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="smallStrong" color={theme.c.muted}>{`${relativeDay(s.start)} · ${time(s.start)}`}</Txt>
            <Txt variant="bodyStrong">{s.name}</Txt>
            <Txt variant="small" color={theme.c.muted}>
              {`${s.instructor} · ${s.booking ? t('pilates.booked') : s.full ? t('pilates.full') : tp('pilates.spots', s.spotsLeft)}`}
            </Txt>
          </View>
          <Icon name="chevron" size={18} color={theme.c.muted} />
        </Pressable>
      ))}
    </View>
  );
}

function Booked({ message }: { message: Extract<Message, { kind: 'booked' }> }) {
  const theme = useTheme();
  const { t, dayShort, time } = useI18n();
  const pilates = usePilates();
  const session = pilates.byId(message.sessionId);
  if (!session) return null;
  const byWindow = WINDOW_REFORMERS.includes(message.reformer);
  return (
    <View style={{ alignSelf: 'stretch', borderRadius: theme.r.card, backgroundColor: theme.c.ink, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 30, height: 30, borderRadius: theme.r.small, backgroundColor: theme.c.sand, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={17} strokeWidth={2.4} />
        </View>
        <Txt variant="bodyStrong" color="#FFFFFF" style={{ flex: 1 }}>
          {byWindow ? t('pilates.ai.bookedTitle', { n: message.reformer }) : t('pilates.class.reformer', { n: message.reformer })}
        </Txt>
      </View>
      <Txt variant="small" color={theme.c.onPhotoMuted}>
        {t('pilates.ai.bookedBody', {
          class: session.name,
          when: `${dayShort(session.start)} ${time(session.start)}`,
          n: message.creditsLeft,
        })}
      </Txt>
      <Button kind="light" size="sm" label={t('common.view')} iconAfter="arrow" onPress={() => router.replace(`/ivy/ticket/${session.id}`)} style={{ alignSelf: 'flex-start' }} />
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
