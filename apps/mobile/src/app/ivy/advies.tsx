import {
  CONCERNS,
  IVY_COLORS,
  inSentence,
  treatmentById,
  type ConcernId,
  type Treatment,
  type TreatmentId,
} from '@pure-ivy/shared';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { Footer, Screen, useModalTop } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';

type Skin = 'calm' | 'sensitive' | 'reactive';
const SKINS: Skin[] = ['calm', 'sensitive', 'reactive'];
const QUESTIONS = 4;
// Treatments that can irritate skin that reddens easily; the doctor decides in person.
const NOT_FOR_REACTIVE: TreatmentId[] = ['sparkpro', 'microneedling'];

/** Four questions and an optional selfie, then a short list of treatments and the free consultation. */
export default function IvyAdvice() {
  const theme = useTheme();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [concerns, setConcerns] = useState<ConcernId[]>([]);
  const [skin, setSkin] = useState<Skin | null>(null);
  const [treatedBefore, setTreatedBefore] = useState<boolean | null>(null);
  const top = useModalTop();

  const answered = [concerns.length > 0, skin !== null, treatedBefore !== null, true][step] ?? true;
  const next = () => setStep((s) => s + 1);
  const result = step >= QUESTIONS;

  const footer =
    step < 3 ? (
      <Footer>
        <Button label={t('ivy.ai.next')} disabled={!answered} iconAfter="arrow" onPress={next} />
      </Footer>
    ) : step === 3 ? (
      <Footer>
        <Button
          icon="camera"
          label={t('ivy.ai.selfie')}
          onPress={next}
        />
        <Button kind="quiet" label={t('ivy.ai.skip')} onPress={next} />
      </Footer>
    ) : (
      <Footer>
        <Button label={t('ivy.home.consultCta')} onPress={() => router.replace('/ivy/afspraak/consult')} />
      </Footer>
    );

  return (
    <Screen gap={22} footer={footer} sheet contentStyle={{ paddingTop: top }}>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {step > 0 && !result ? (
            <IconButton icon="back" label={t('common.back')} tone="surface" onPress={() => setStep((s) => s - 1)} />
          ) : null}
          <View style={{ flex: 1 }}>
            <Txt variant="eyebrow" color={theme.c.muted}>
              {t('ivy.ai.title')}
            </Txt>
            {!result ? (
              <Txt variant="small" color={theme.c.muted}>
                {t('ivy.ai.step', { n: step + 1 })}
              </Txt>
            ) : null}
          </View>
          <IconButton icon="close" label={t('common.close')} tone="surface" onPress={() => router.back()} />
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: QUESTIONS }, (_, i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= step ? theme.c.primary : theme.c.line }} />
          ))}
        </View>
      </View>

      {step === 0 ? (
        <Question title={t('ivy.ai.q1')} hint={t('ivy.ai.q1Hint')}>
          {CONCERNS.map((c) => {
            const on = concerns.includes(c.id);
            return (
              <Option
                key={c.id}
                label={t(`ivy.concern.${c.id}`)}
                selected={on}
                multi
                leading={<Photo photo={c.photo} style={{ width: 48, height: 56, borderRadius: theme.r.small }} />}
                onPress={() => setConcerns((list) => (on ? list.filter((x) => x !== c.id) : [...list, c.id]))}
              />
            );
          })}
        </Question>
      ) : null}

      {step === 1 ? (
        <Question title={t('ivy.ai.q2')}>
          {SKINS.map((s) => (
            <Option key={s} label={t(`ivy.ai.skin.${s}`)} selected={skin === s} onPress={() => setSkin(s)} />
          ))}
        </Question>
      ) : null}

      {step === 2 ? (
        <Question title={t('ivy.ai.q3')}>
          <Option label={t('ivy.ai.yes')} selected={treatedBefore === true} onPress={() => setTreatedBefore(true)} />
          <Option label={t('ivy.ai.no')} selected={treatedBefore === false} onPress={() => setTreatedBefore(false)} />
        </Question>
      ) : null}

      {step === 3 ? (
        <Question title={t('ivy.ai.q4')} hint={t('ivy.ai.q4Body')}>
          <SelfieFrame />
        </Question>
      ) : null}

      {result ? <Advice concerns={concerns} skin={skin} treatedBefore={treatedBefore} /> : null}
    </Screen>
  );
}

function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Txt variant="display">{title}</Txt>
        {hint ? (
          <Txt variant="body" color={theme.c.muted}>
            {hint}
          </Txt>
        ) : null}
      </View>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}

function Option({
  label,
  selected,
  onPress,
  multi,
  leading,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
  leading?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 60,
        padding: leading ? 8 : 16,
        paddingEnd: 16,
        borderRadius: theme.r.control,
        backgroundColor: theme.c.surface,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? theme.c.ink : theme.c.line,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {leading}
      <Txt variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </Txt>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          borderWidth: selected ? 0 : 1.5,
          borderColor: theme.c.lineStrong,
          backgroundColor: selected ? theme.c.ink : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? <Icon name="check" size={14} color={theme.c.onPrimary} strokeWidth={2.4} /> : null}
      </View>
    </Pressable>
  );
}

/** A portrait frame with corner guides; the camera itself is not used in the demo. */
function SelfieFrame() {
  const theme = useTheme();
  const corner = { position: 'absolute' as const, width: 28, height: 28, borderColor: theme.c.ink };
  return (
    <View
      style={{
        alignSelf: 'center',
        width: 220,
        height: 280,
        borderRadius: theme.r.card,
        backgroundColor: IVY_COLORS.blush,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ ...corner, top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 6 }} />
      <View style={{ ...corner, top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 6 }} />
      <View style={{ ...corner, bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 6 }} />
      <View style={{ ...corner, bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 6 }} />
      <Icon name="camera" size={30} color={theme.c.muted} />
    </View>
  );
}

function Advice({ concerns, skin, treatedBefore }: { concerns: ConcernId[]; skin: Skin | null; treatedBefore: boolean | null }) {
  const theme = useTheme();
  const { t, text, euro, locale } = useI18n();
  const picks: { treatment: Treatment; concern: ConcernId }[] = [];
  for (const concern of concerns) {
    for (const id of CONCERNS.find((c) => c.id === concern)?.treatments ?? []) {
      if (skin === 'reactive' && NOT_FOR_REACTIVE.includes(id)) continue;
      if (!picks.some((p) => p.treatment.id === id)) picks.push({ treatment: treatmentById(id), concern });
    }
  }
  const consult = treatmentById('consult');

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Txt variant="display">{t('ivy.ai.resultTitle')}</Txt>
        <Txt variant="body" color={theme.c.muted}>
          {t('ivy.ai.resultBody')}
        </Txt>
      </View>

      {treatedBefore === false ? <Recommendation treatment={consult} note={text(consult.description)} badge={t('ivy.book.startHere')} /> : null}
      {picks.slice(0, 3).map(({ treatment, concern }) => (
        <Recommendation
          key={treatment.id}
          treatment={treatment}
          note={`${t('ivy.ai.match', { concern: inSentence(t(`ivy.concern.${concern}`), locale) })} · ${t('ivy.price.from', { price: euro(treatment.priceFrom) })}`}
        />
      ))}

      <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: theme.r.control, backgroundColor: theme.c.sand }}>
        <Icon name="leaf" size={18} color={theme.c.primary} />
        <Txt variant="small" color={IVY_COLORS.body} style={{ flex: 1 }}>
          {t('ivy.ai.disclaimer')}
        </Txt>
      </View>
    </View>
  );
}

function Recommendation({ treatment, note, badge }: { treatment: Treatment; note: string; badge?: string }) {
  const theme = useTheme();
  const { text } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.replace({ pathname: '/ivy/afspraak/[treatmentId]', params: { treatmentId: treatment.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 10,
        borderRadius: theme.r.card,
        backgroundColor: theme.c.surface,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Photo photo={treatment.photo} style={{ width: 72, height: 88, borderRadius: theme.r.small }} />
      <View style={{ flex: 1, gap: 4 }}>
        {badge ? <Badge label={badge} tone="ink" /> : null}
        <Txt variant="heading">{text(treatment.name)}</Txt>
        <Txt variant="small" color={theme.c.muted}>
          {note}
        </Txt>
      </View>
      <Icon name="chevron" size={18} color={theme.c.muted} />
    </Pressable>
  );
}
