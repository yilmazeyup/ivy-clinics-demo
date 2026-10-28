import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Linking, Share, View } from 'react-native';

import { Button } from '@/components/Button';
import { Confetti } from '@/components/Confetti';
import { Icon, type IconName } from '@/components/Icon';
import { PopIn, Squish } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { QrCode } from '@/components/QrCode';
import { Screen } from '@/components/Screen';
import { Tag } from '@/components/Sticker';
import { Txt } from '@/components/Txt';
import { addOnById, MEMBER, polishById, STUDIO } from '@/data';
import { useI18n } from '@/i18n';
import { pointsFor, useStudio, type BookingView } from '@/studio';
import { categoryColors, useTheme } from '@/theme';

export default function ConfirmationScreen() {
  const { id, moved } = useLocalSearchParams<{ id: string; moved?: string }>();
  const { byId } = useStudio();
  const booking = id ? byId(id) : undefined;
  if (!booking) return <Redirect href="/" />;
  return <Confirmation booking={booking} moved={moved === '1'} />;
}

function Confirmation({ booking, moved }: { booking: BookingView; moved: boolean }) {
  const theme = useTheme();
  const { t, text, euro, dayLong, time } = useI18n();
  const colors = categoryColors(booking.service.category);
  const extras = booking.addOns ?? [];
  const price = booking.service.price + extras.reduce((sum, id) => sum + addOnById(id as never).price, 0);
  const shade = booking.shadeId ? polishById(booking.shadeId) : null;
  const action = (icon: IconName, label: string, onPress: () => void) => (
    <Squish key={label} onPress={onPress} scaleTo={0.92} style={{ flex: 1 }} accessibilityLabel={label}>
      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 14, borderRadius: 20, backgroundColor: theme.c.chalk }}>
        <Icon name={icon} size={22} />
        <Txt variant="caption" align="center" numberOfLines={1}>
          {label}
        </Txt>
      </View>
    </Squish>
  );
  return (
    <View style={{ flex: 1 }}>
      <Screen gap={24} enter={false}>
        <PopIn delay={80}>
          <View style={{ alignItems: 'center', gap: 10, paddingTop: 10 }}>
            <Tag label={moved ? t('confirm.movedTag') : t('confirm.tag')} bg={theme.c.mintSoft} color={theme.c.mint} icon="check" style={{ alignSelf: 'center' }} />
            <Txt variant="mega" align="center">
              {t('confirm.title', { name: MEMBER.firstName })}
            </Txt>
            <Txt variant="body" align="center" color={theme.c.inkSoft}>
              {moved ? t('confirm.moved') : t('confirm.body')}
            </Txt>
          </View>
        </PopIn>

        <PopIn delay={240} tilt={-3} from={0.85}>
          <View style={{ borderRadius: 30, overflow: 'hidden', backgroundColor: '#FFFFFF', boxShadow: theme.shadow.lift }}>
            <Photo photo={booking.service.photo} style={{ height: 150 }} scrim>
              <View style={{ position: 'absolute', start: 18, bottom: 14, end: 18 }}>
                <Txt variant="title" color="#FFFFFF">
                  {text(booking.service.name)}
                </Txt>
              </View>
            </Photo>
            <View style={{ padding: 18, gap: 14, backgroundColor: colors.soft }}>
              <View style={{ flexDirection: 'row', gap: 18 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="tag" color={colors.ink}>
                    {t('confirm.when')}
                  </Txt>
                  <Txt variant="bodyStrong">{dayLong(booking.start)}</Txt>
                  <Txt variant="display" style={{ fontSize: 40, lineHeight: 42 }}>
                    {time(booking.start)}
                  </Txt>
                </View>
                <View style={{ gap: 2 }}>
                  <Txt variant="tag" color={colors.ink}>
                    {t('confirm.with')}
                  </Txt>
                  <Txt variant="display" style={{ fontSize: 40, lineHeight: 42 }}>
                    {booking.stylist.name}
                  </Txt>
                </View>
              </View>
              {extras.length || shade ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {extras.map((id) => (
                    <Tag key={id} label={text(addOnById(id as never).name)} bg="#FFFFFF" />
                  ))}
                  {shade ? <Tag label={shade.name} bg="#FFFFFF" icon="polish" /> : null}
                </View>
              ) : null}
            </View>
            <View style={{ borderTopWidth: 2, borderStyle: 'dashed', borderColor: theme.c.lineStrong }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 }}>
              <QrCode seed={booking.start.getMinutes() + 7} cell={4} />
              <View style={{ flex: 1, gap: 4 }}>
                <Txt variant="bodyStrong">{t('confirm.checkin')}</Txt>
                <Txt variant="small" color={theme.c.muted}>
                  {t('confirm.checkinBody')}
                </Txt>
                <Txt variant="smallStrong" color={colors.ink}>
                  {t('confirm.pay', { amount: euro(price) })}
                </Txt>
              </View>
            </View>
          </View>
        </PopIn>

        <PopIn delay={420}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 22, backgroundColor: theme.c.ink }}>
            <Icon name="crown" size={24} color={theme.c.bubble} />
            <Txt variant="small" color="#FFFFFF" style={{ flex: 1 }}>
              {t('confirm.points', { n: pointsFor(price) })}
            </Txt>
          </View>
        </PopIn>

        <PopIn delay={520}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {action('calendar', t('confirm.calendar'), () => {})}
            {action('pin', t('contact.route'), () => router.push('/contact'))}
            {action('share', t('confirm.share'), () =>
              Share.share({ message: t('confirm.shareText', { service: text(booking.service.name), code: MEMBER.code }) }).catch(() => {}),
            )}
            {action('instagram', 'Instagram', () => Linking.openURL(`https://www.instagram.com/${STUDIO.instagram}/`).catch(() => {}))}
          </View>
        </PopIn>

        <PopIn delay={600}>
          <Button label={t('confirm.home')} kind="outline" onPress={() => router.dismissTo('/')} />
        </PopIn>
      </Screen>
      <Confetti />
    </View>
  );
}
