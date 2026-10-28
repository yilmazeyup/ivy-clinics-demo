import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { Screen } from '@/components/Screen';
import { Tag } from '@/components/Sticker';
import { Txt } from '@/components/Txt';
import { LOCATIONS_BLANCHE, STUDIO, type StudioLocation } from '@/data';
import { useI18n } from '@/i18n';
import { useLayout } from '@/layout';
import { useStudio } from '@/studio';
import { useTheme } from '@/theme';

const open = (url: string) => Linking.openURL(url).catch(() => {});

/** Where to find Blanche: the studio inside Pure Clinics Nijmegen, lash lifts in Uden, hours, phone and Instagram. */
export default function ContactScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const { wide } = useLayout();
  return (
    <Screen gap={26}>
      <IconButton icon="back" label={t('common.back')} tone="chalk" onPress={() => (router.canGoBack() ? router.back() : router.replace('/mijn'))} />
      <Txt variant="display">{t('contact.title')}</Txt>
      <Photo photo="polish-wall" style={{ height: wide ? 300 : 220, borderRadius: 28 }}>
        <View style={{ position: 'absolute', start: 16, bottom: 16 }}>
          <Tag label={t('contact.inside', { place: STUDIO.inside })} bg="#FFFFFF" icon="store" />
        </View>
      </Photo>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Button label={t('contact.call')} kind="ink" size="md" icon="phone" onPress={() => open(`tel:${STUDIO.phoneLink}`)} />
        <Button
          label={t('contact.whatsapp')}
          kind="outline"
          size="md"
          icon="chat"
          onPress={() => open(`https://wa.me/${STUDIO.phoneLink.replace(/\D/g, '')}`)}
        />
        <Button label="Instagram" kind="outline" size="md" icon="instagram" onPress={() => open(`https://www.instagram.com/${STUDIO.instagram}/`)} />
      </View>
      {LOCATIONS_BLANCHE.map((l) => (
        <Place key={l.id} place={l} />
      ))}
      <View style={{ gap: 8, padding: 18, borderRadius: 24, backgroundColor: theme.c.chalk }}>
        <Txt variant="bodyStrong">{t('contact.policyTitle')}</Txt>
        <Txt variant="small" color={theme.c.inkSoft}>
          {t('contact.policy', { hours: STUDIO.cancelHours })}
        </Txt>
      </View>
    </Screen>
  );
}

function Place({ place }: { place: StudioLocation }) {
  const theme = useTheme();
  const { t, weekday } = useI18n();
  const { now } = useStudio();
  const today = now.getDay();
  // Monday first, like a Dutch calendar.
  const order = [1, 2, 3, 4, 5, 6, 0];
  const sample = (dow: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7));
    return d;
  };
  const days = order.filter((dow) => place.id === 'nijmegen' || place.hours[dow]);
  return (
    <View style={{ gap: 14, padding: 18, borderRadius: 26, borderWidth: 1.5, borderColor: theme.c.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            backgroundColor: place.id === 'nijmegen' ? theme.c.primary : theme.c.lilac,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="pin" size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="title">{place.city}</Txt>
          <Txt variant="body">{`${place.address}, ${place.postcode}`}</Txt>
          <Txt variant="small" color={theme.c.muted}>
            {place.id === 'nijmegen' ? t('contact.nijmegenNote') : t('contact.udenNote')}
          </Txt>
        </View>
      </View>
      <View style={{ gap: 6 }}>
        {days.map((dow) => {
          const h = place.hours[dow];
          const on = dow === today;
          return (
            <View
              key={dow}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 10,
                backgroundColor: on ? theme.c.blush : 'transparent',
              }}
            >
              <Txt variant={on ? 'bodyStrong' : 'body'}>{weekday(sample(dow))}</Txt>
              <Txt variant={on ? 'bodyStrong' : 'body'} color={h ? theme.c.ink : theme.c.muted}>
                {h ? `${String(h.open).padStart(2, '0')}:00 – ${h.close}:00` : t('contact.closed')}
              </Txt>
            </View>
          );
        })}
      </View>
      <Button
        label={t('contact.route')}
        kind="soft"
        size="md"
        icon="pin"
        onPress={() => open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.address}, ${place.postcode} ${place.city}`)}`)}
      />
    </View>
  );
}
