import { CLASS_TYPES, onReformer, PURE_CAPACITY } from '@pure-ivy/shared';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/Badge';
import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { Footer, Screen } from '@/components/Screen';
import { useToast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { seatNote, spotLines, useCancelNote, usePilates, type SessionView } from '@/pilates';
import { useTheme } from '@/theme';

const ROWS = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
];
// The spot we suggest first when nothing is picked yet: middle of the front row, then outwards.
const PREFERRED = [3, 2, 4, 6, 7, 1, 5, 8];

export default function PilatesClass() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pilates = usePilates();
  const session = pilates.byId(id);
  if (!session) return <Missing />;
  return <ClassDetail session={session} />;
}

function Missing() {
  const { t } = useI18n();
  return (
    <Screen>
      <IconButton icon="back" label={t('common.back')} tone="surface" onPress={() => router.back()} />
      <Txt variant="body">{t('pilates.schedule.empty')}</Txt>
    </Screen>
  );
}

function ClassDetail({ session }: { session: SessionView }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, text, time, relativeDay } = useI18n();
  const pilates = usePilates();
  const toast = useToast();
  const type = CLASS_TYPES[session.typeId];
  const reformer = onReformer(session.typeId);
  const isFree = (n: number) => !session.taken.includes(n) && session.booking?.spot !== n;
  // On the reformers you choose your spot; on the mats the first free spot is yours.
  const [picked, setPicked] = useState<number | null>(
    () => (reformer ? PREFERRED : Array.from({ length: session.capacity }, (_, i) => i + 1)).find(isFree) ?? null,
  );
  const cancelNote = useCancelNote();

  const book = () => {
    if (!picked) return;
    if (!pilates.bookClass(session.id, picked)) {
      toast(t('pilates.class.noCredits'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(`/ivy/ticket/${session.id}`);
  };

  let footer;
  if (session.booking) {
    const spot = session.booking.spot;
    const lines = spotLines(session, spot);
    footer = (
      <Footer>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{t('pilates.class.alreadyBooked')}</Txt>
            <Txt variant="small" color={theme.c.muted} numberOfLines={1}>{`${t(lines.label, { n: spot })} · ${t(lines.note)}`}</Txt>
          </View>
          <Button
            kind="secondary"
            size="sm"
            label={t('common.cancel')}
            onPress={() => {
              pilates.cancelClass(session.id);
              toast(t('pilates.my.cancelled'));
            }}
          />
          <Button size="sm" icon="wallet" label={t('pilates.home.wallet')} onPress={() => router.push(`/ivy/ticket/${session.id}`)} />
        </View>
      </Footer>
    );
  } else if (session.full || session.onWaitlist) {
    footer = (
      <Footer>
        <Txt variant="small" color={theme.c.muted}>
          {t('pilates.class.waitlistNote', { pct: session.chance })}
        </Txt>
        <Button
          label={session.onWaitlist ? t('pilates.onWaitlist') : t('pilates.class.joinWaitlist')}
          icon={session.onWaitlist ? 'check' : undefined}
          disabled={session.onWaitlist}
          onPress={() => {
            pilates.joinWaitlist(session.id);
            router.push(`/ivy/ticket/${session.id}?waitlist=1`);
          }}
        />
      </Footer>
    );
  } else {
    footer = (
      <Footer>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{pilates.unlimited ? t('pilates.pkg.unlimited') : t('pilates.class.creditsLeft', { n: pilates.credits })}</Txt>
            <Txt variant="small" color={theme.c.muted} numberOfLines={2}>
              {cancelNote(session)}
            </Txt>
          </View>
          <Button label={t('common.bookNow')} disabled={!picked} onPress={book} style={{ minWidth: 132 }} />
        </View>
      </Footer>
    );
  }

  return (
    <Screen padded={false} gap={0} bottomSpace={24} contentStyle={{ paddingTop: 0 }} footer={footer}>
      <Photo photo={type.photo} scrim style={{ height: 300 + insets.top }}>
        <View
          style={{
            position: 'absolute',
            top: insets.top + 8,
            start: 16,
            end: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <IconButton icon="back" label={t('common.back')} tone="surface" onPress={() => router.back()} />
          <IconButton icon="share" label={t('common.share')} tone="surface" onPress={() => toast(t('common.demoNote'))} />
        </View>
        <View style={{ position: 'absolute', start: 20, end: 20, bottom: 20, gap: 6 }}>
          <Txt variant="hero" color="#FFFFFF">
            {session.name}
          </Txt>
          <Txt variant="body" color={theme.c.onPhotoMuted}>
            {`${relativeDay(session.start)} · ${time(session.start)} · ${t('common.minutes', { n: type.minutes })}`}
          </Txt>
        </View>
      </Photo>

      <View style={{ padding: 20, gap: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.r.control,
              backgroundColor: theme.c.sand,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt variant="heading">{session.instructor.charAt(0)}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="caption" color={theme.c.muted}>
              {t('pilates.class.instructor')}
            </Txt>
            <Txt variant="bodyStrong">{session.instructor}</Txt>
          </View>
          <Badge label={t(`level.${type.level}`)} tone="outline" />
        </View>

        <Txt variant="body" color={theme.c.muted}>
          {text(type.description)}
        </Txt>

        {reformer ? (
          <ReformerPicker session={session} picked={session.booking ? null : picked} onPick={setPicked} />
        ) : (
          <MatSpot session={session} spot={session.booking?.spot ?? picked} />
        )}
      </View>
    </Screen>
  );
}

type SpotState = 'free' | 'taken' | 'picked' | 'mine';

/** Classes on mats in studio 2: no map to choose from, just a fixed spot and everything ready. */
function MatSpot({ session, spot }: { session: SessionView; spot: number | null }) {
  const theme = useTheme();
  const { t } = useI18n();
  const free = session.capacity - session.taken.length - (session.booking ? 1 : 0);
  return (
    <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 18, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <Txt variant="heading">{t('pilates.class.matTitle')}</Txt>
        <Txt variant="small" color={theme.c.muted}>
          {t('pilates.class.freeOf', { free, total: session.capacity })}
        </Txt>
      </View>
      <Txt variant="body" color={theme.c.muted}>
        {t('pilates.class.matBody')}
      </Txt>
      {spot ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 2 }}>
          <Icon name="check" size={18} strokeWidth={2.2} />
          <Txt variant="bodyStrong">{`${t('pilates.class.spot', { n: spot })} · ${t('pilates.class.matStudio')}`}</Txt>
        </View>
      ) : null}
    </View>
  );
}

function ReformerPicker({ session, picked, onPick }: { session: SessionView; picked: number | null; onPick: (n: number) => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  const mine = session.booking?.spot;
  const free = PURE_CAPACITY - session.taken.length - (mine ? 1 : 0);
  const stateOf = (n: number): SpotState => {
    if (n === mine) return 'mine';
    if (session.taken.includes(n)) return 'taken';
    return n === picked ? 'picked' : 'free';
  };
  const shown = mine ?? picked;

  return (
    <View style={{ backgroundColor: theme.c.surface, borderRadius: theme.r.card, padding: 18, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <Txt variant="heading">{t('pilates.class.chooseReformer')}</Txt>
        <Txt variant="small" color={theme.c.muted}>
          {t('pilates.class.freeOf', { free, total: PURE_CAPACITY })}
        </Txt>
      </View>

      {/* The room keeps its real orientation in every language: mirror in front, window on the left. */}
      <View style={{ direction: 'ltr', gap: 10 }}>
        <View style={{ height: 30, borderRadius: 8, backgroundColor: theme.c.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="caption" color={theme.c.muted}>
            {t('pilates.class.mirror')}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ width: 6, borderRadius: 3, backgroundColor: theme.c.window }} />
          <View style={{ flex: 1, gap: 8 }}>
            {ROWS.map((row) => (
              <View key={row[0]} style={{ flexDirection: 'row', gap: 8 }}>
                {row.map((n) => (
                  <Reformer key={n} n={n} state={stateOf(n)} onPress={() => onPick(n)} />
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 }}>
        <Legend color={theme.c.surface} border={theme.c.lineStrong} label={t('pilates.class.free')} />
        <Legend color={theme.c.taken} label={t('pilates.class.taken')} />
        <Legend color={mine ? theme.c.ink : theme.c.highlight} label={t('pilates.class.yours')} />
        <Legend color={theme.c.window} label={t('pilates.class.window')} />
      </View>

      {shown ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 2 }}>
          <Icon name="check" size={18} strokeWidth={2.2} />
          <Txt variant="bodyStrong">{`${t('pilates.class.reformer', { n: shown })} · ${t(seatNote(shown))}`}</Txt>
        </View>
      ) : null}
    </View>
  );
}

function Reformer({ n, state, onPress }: { n: number; state: SpotState; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  const bg = { free: theme.c.surface, taken: theme.c.taken, picked: theme.c.highlight, mine: theme.c.ink }[state];
  const fg = { free: theme.c.ink, taken: theme.c.takenText, picked: theme.c.onHighlight, mine: '#FFFFFF' }[state];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('pilates.class.reformer', { n })}
      accessibilityState={{ selected: state === 'picked' || state === 'mine', disabled: state === 'taken' }}
      disabled={state === 'taken' || state === 'mine'}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        flex: 1,
        height: 78,
        borderRadius: theme.r.control + 4,
        backgroundColor: bg,
        borderWidth: state === 'free' ? 1.5 : 0,
        borderColor: theme.c.lineStrong,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {/* A reformer seen from above: frame with the carriage near the foot bar. */}
      <View style={{ width: 16, height: 32, borderRadius: 4, borderWidth: 1.5, borderColor: fg, opacity: 0.55, padding: 2 }}>
        <View style={{ height: 9, borderRadius: 2, backgroundColor: fg }} />
      </View>
      <Txt variant="smallStrong" color={fg}>
        {String(n)}
      </Txt>
    </Pressable>
  );
}

function Legend({ color, border, label }: { color: string; border?: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color, borderWidth: border ? 1 : 0, borderColor: border }} />
      <Txt variant="caption" color={theme.c.muted}>
        {label}
      </Txt>
    </View>
  );
}
