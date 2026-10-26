import { addDays, CLASS_TYPES, sameDay, startOfDay, timeOfDay } from '@pure-ivy/shared';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Chip } from '@/components/Chip';
import { CreditsBar } from '@/components/CreditsBar';
import { DayStrip } from '@/components/DayStrip';
import { Photo } from '@/components/Photo';
import { Rail, Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { usePilates, type SessionView } from '@/pilates';
import { useTheme } from '@/theme';

type Filter = 'all' | 'calm' | 'beginner' | 'advanced';
const FILTERS: Filter[] = ['all', 'calm', 'beginner', 'advanced'];
const PARTS = ['morning', 'afternoon', 'evening'] as const;

function matches(session: SessionView, filter: Filter): boolean {
  const level = CLASS_TYPES[session.typeId].level;
  if (filter === 'all') return true;
  // Classes for all levels are fine for beginners too.
  if (filter === 'beginner') return level === 'beginner' || level === 'all';
  return level === filter;
}

export default function PilatesSchedule() {
  const theme = useTheme();
  const { t } = useI18n();
  const pilates = usePilates();
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(startOfDay(pilates.now), i)), [pilates.now]);
  const [day, setDay] = useState(days[0]);
  const [filter, setFilter] = useState<Filter>('all');

  const sessions = pilates.upcoming.filter((s) => sameDay(s.start, day) && matches(s, filter));
  const parts = PARTS.map((part) => ({ part, items: sessions.filter((s) => timeOfDay(s.start) === part) })).filter((p) => p.items.length > 0);

  return (
    <Screen gap={18}>
      <View style={{ gap: 8 }}>
        <Txt variant="display">{t('ivy.pilates.title')}</Txt>
        <Txt variant="body" color={theme.c.muted}>
          {t('ivy.pilates.intro')}
        </Txt>
      </View>

      <CreditsBar />

      <DayStrip days={days} selected={day} onSelect={setDay} isMarked={(d) => pilates.myClasses.some((s) => sameDay(s.start, d))} />

      <Rail gap={8}>
        {FILTERS.map((f) => (
          <Chip key={f} label={t(`pilates.filter.${f}`)} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </Rail>

      {parts.length === 0 ? (
        <View style={{ paddingVertical: 48, paddingHorizontal: 24 }}>
          <Txt variant="body" color={theme.c.muted} align="center">
            {t('pilates.schedule.empty')}
          </Txt>
        </View>
      ) : (
        parts.map(({ part, items }) => (
          <View key={part} style={{ gap: 10 }}>
            <Txt variant="eyebrow" color={theme.c.muted}>
              {t(`pilates.schedule.${part}`)}
            </Txt>
            {items.map((s) => (
              <ClassRow key={s.id} session={s} />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

function ClassRow({ session }: { session: SessionView }) {
  const theme = useTheme();
  const { t, time } = useI18n();
  const type = CLASS_TYPES[session.typeId];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(`/ivy/les/${session.id}`)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 10,
        paddingEnd: 14,
        borderRadius: theme.r.card,
        backgroundColor: theme.c.surface,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Photo photo={type.photo} style={{ width: 66, height: 80, borderRadius: theme.r.photo }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="smallStrong" color={theme.c.muted}>{`${time(session.start)} · ${t('common.minutes', { n: type.minutes })}`}</Txt>
        <Txt variant="heading" numberOfLines={2}>
          {session.name}
        </Txt>
        <Txt variant="small" color={theme.c.muted} numberOfLines={1}>{`${session.instructor} · ${t(`level.${type.level}`)}`}</Txt>
      </View>
      <Status session={session} />
    </Pressable>
  );
}

function Status({ session }: { session: SessionView }) {
  const theme = useTheme();
  const { t, tp } = useI18n();
  if (session.booking) return <Badge label={t('pilates.booked')} tone="highlight" icon="check" />;
  if (session.onWaitlist) return <Badge label={t('pilates.onWaitlist')} tone="outline" />;
  if (session.full) {
    return (
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Badge label={t('pilates.full')} tone="muted" />
        <Txt variant="caption" color={theme.c.muted}>
          {t('pilates.chance', { pct: session.chance })}
        </Txt>
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'flex-end', gap: 4 }}>
      {session.offPeak ? <Badge label="−20%" tone="ink" /> : null}
      <Txt variant="smallStrong" color={session.spotsLeft <= 2 ? theme.c.ink : theme.c.muted}>
        {tp('pilates.spots', session.spotsLeft)}
      </Txt>
    </View>
  );
}
