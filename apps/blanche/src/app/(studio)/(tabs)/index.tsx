import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { ClubCard } from '@/components/ClubCard';
import { DealTile } from '@/components/DealTile';
import { Icon } from '@/components/Icon';
import { LookCard } from '@/components/LookCard';
import { Marquee, Squish, Wobble } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { Rail, Screen, Section } from '@/components/Screen';
import { Sticker, Tag } from '@/components/Sticker';
import { StoryRail } from '@/components/Stories';
import { Ticket } from '@/components/Ticket';
import { Txt } from '@/components/Txt';
import { Wordmark } from '@/components/Wordmark';
import { CATEGORIES, DEALS, fromPrice, locationBlanche, LOOKS, MEMBER, POLISH, REVIEWS, SHADES, STUDIO, studioHours, stylistById } from '@/data';
import { useI18n } from '@/i18n';
import { useLayout } from '@/layout';
import { useStudio } from '@/studio';
import { categoryColors, useTheme } from '@/theme';

export default function HomeScreen() {
  const { wide } = useLayout();
  return (
    <Screen tabs width="page" gap={wide ? 44 : 34}>
      {wide ? null : <Header />}
      <View style={wide ? { flexDirection: 'row', gap: 40, alignItems: 'flex-end' } : { gap: 22 }}>
        <View style={{ flex: wide ? 1 : undefined }}>
          <Greeting />
        </View>
        <View style={{ gap: 14, width: wide ? 460 : undefined }}>
          <NextUp />
        </View>
      </View>
      <Refill />
      <StoryRail />
      <Crafts />
      <Band />
      <View style={wide ? { flexDirection: 'row', gap: 24 } : { gap: 34 }}>
        <View style={{ flex: wide ? 1.1 : undefined }}>
          <ShadeStudio />
        </View>
        <View style={{ flex: wide ? 1 : undefined }}>
          <Inspo />
        </View>
      </View>
      <Trending />
      <View style={wide ? { flexDirection: 'row', gap: 24, alignItems: 'flex-start' } : { gap: 34 }}>
        <View style={{ flex: wide ? 1 : undefined }}>
          <ClubTeaser />
        </View>
        <View style={{ flex: wide ? 1.2 : undefined }}>
          <Deals />
        </View>
      </View>
      <Reviews />
      <Instagram />
      <Visit />
    </Screen>
  );
}

function Header() {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Wordmark size={34} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <IconButton icon="bell" label={t('common.notifications')} tone="chalk" badge={2} />
        <Squish accessibilityLabel={t('settings.title')} onPress={() => router.push('/instellingen')} scaleTo={0.88}>
          <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: theme.c.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="title" color="#FFFFFF" style={{ fontSize: 24, lineHeight: 28 }}>
              {MEMBER.firstName[0]}
            </Txt>
          </View>
        </Squish>
      </View>
    </View>
  );
}

/** "Hey Lisa," in the logo's serif, today's date and whether the studio is open right now. */
function Greeting() {
  const theme = useTheme();
  const { t, dayLong } = useI18n();
  const { now } = useStudio();
  const { wide } = useLayout();
  const hours = studioHours(now);
  const open = hours && now.getHours() >= hours.open && now.getHours() < hours.close;
  return (
    <View style={{ gap: 12 }}>
      <Txt variant="mega" style={wide ? { fontSize: 84, lineHeight: 80 } : undefined}>
        {t('home.hello', { name: MEMBER.firstName })}
      </Txt>
      <Txt variant="body" color={theme.c.inkSoft} style={{ fontSize: wide ? 18 : 16 }}>
        {t('home.sub')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Tag label={dayLong(now)} icon="calendar" />
        <Tag
          label={open ? t('home.openUntil', { time: `${hours!.close}:00` }) : t('home.closedNow')}
          bg={open ? theme.c.mintSoft : theme.c.chalk}
          color={open ? theme.c.mint : theme.c.muted}
          icon={open ? 'check' : 'clock'}
        />
      </View>
    </View>
  );
}

function NextUp() {
  const { t } = useI18n();
  const { next } = useStudio();
  if (!next) {
    return <Button label={t('home.bookFirst')} icon="sparkle" onPress={() => router.navigate('/boeken')} />;
  }
  return (
    <Squish onPress={() => router.navigate('/mijn')} accessibilityLabel={t('home.next')} scaleTo={0.97}>
      <Ticket booking={next} />
    </Squish>
  );
}

/** Three weeks after a BIAB set: how grown-out it is, and a refill at her usual time with the same stylist. */
function Refill() {
  const theme = useTheme();
  const { t, text, time, relativeDayInline } = useI18n();
  const { refill } = useStudio();
  const { wide } = useLayout();
  if (!refill) return null;
  const colors = categoryColors(refill.service.category);
  const share = Math.min(1, refill.days / (refill.due + 7));
  const weeks = 4;
  return (
    <View
      style={{
        borderRadius: theme.r.card,
        backgroundColor: theme.c.ink,
        padding: wide ? 28 : 20,
        gap: 18,
        flexDirection: wide ? 'row' : 'column',
        alignItems: wide ? 'center' : 'stretch',
      }}
    >
      <View style={{ flex: wide ? 1 : undefined, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Tag label={t('home.refill.tag')} bg={colors.ink} color="#FFFFFF" icon="refresh" />
          <Txt variant="small" color="rgba(255,255,255,0.7)">
            {t('home.refill.age', { service: text(refill.service.name), days: refill.days })}
          </Txt>
        </View>
        <Txt variant="display" color="#FFFFFF" accentColor={theme.c.bubble} style={{ fontSize: 40, lineHeight: 40 }}>
          {t('home.refill.title')}
        </Txt>
        {/* The set grows out week by week: four segments, filled as far as it has grown. */}
        <View style={{ flexDirection: 'row', gap: 5, marginTop: 4 }}>
          {Array.from({ length: weeks }, (_, i) => {
            const fill = Math.max(0, Math.min(1, share * weeks - i));
            return (
              <View key={i} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
                <View style={{ width: `${fill * 100}%`, height: '100%', backgroundColor: i >= 3 ? theme.c.bubble : '#FFFFFF' }} />
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[1, 2, 3, 4].map((w) => (
            <Txt key={w} variant="caption" color="rgba(255,255,255,0.55)">
              {t('home.refill.week', { n: w })}
            </Txt>
          ))}
        </View>
      </View>
      <View style={{ gap: 12, width: wide ? 340 : undefined }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)' }}>
          <Icon name="calendar" size={20} color="#FFFFFF" />
          <Txt variant="small" color="#FFFFFF" style={{ flex: 1 }}>
            {t('home.refill.slot', {
              name: stylistById(refill.slot.stylistId).name,
              when: `${relativeDayInline(refill.slot.start)} ${time(refill.slot.start)}`,
            })}
          </Txt>
        </View>
        <Button
          label={t('home.refill.cta')}
          iconAfter="arrow"
          onPress={() =>
            router.push({
              pathname: '/afspraak/[serviceId]',
              params: {
                serviceId: refill.refill.id,
                stylist: refill.slot.stylistId,
                slot: String(refill.slot.start.getTime()),
                shade: refill.last.shadeId ?? '',
              },
            })
          }
        />
      </View>
    </View>
  );
}

/** The three crafts as big photo tiles, each in its own colour with a price sticker. */
function Crafts() {
  const { t, text, euro } = useI18n();
  const { wide } = useLayout();
  const tile = (index: number, height: number) => {
    const category = CATEGORIES[index];
    const colors = categoryColors(category.id);
    return (
      <Squish
        key={category.id}
        accessibilityLabel={text(category.name)}
        onPress={() => router.navigate({ pathname: '/boeken', params: { craft: category.id } })}
        scaleTo={0.96}
        style={{ flex: 1 }}
      >
        <Photo photo={category.photo} scrim style={{ height, borderRadius: 26 }}>
          <View style={{ position: 'absolute', top: 14, start: 14 }}>
            <Sticker label={t('common.from', { price: euro(fromPrice(category.id)) })} bg={colors.soft} angle={index === 1 ? 4 : -5} />
          </View>
          <View style={{ position: 'absolute', start: 16, end: 16, bottom: 16, gap: 2 }}>
            <Txt
              variant="display"
              color="#FFFFFF"
              numberOfLines={1}
              style={{ fontSize: height > 300 ? 46 : text(category.name).length > 8 ? 27 : 34, lineHeight: height > 300 ? 46 : 34 }}
            >
              {text(category.name)}
            </Txt>
            <Txt variant="smallStrong" color="rgba(255,255,255,0.9)" numberOfLines={2}>
              {text(category.tagline)}
            </Txt>
          </View>
        </Photo>
      </Squish>
    );
  };
  return (
    <Section title={t('home.crafts')} sub={t('home.craftsSub')}>
      {wide ? (
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {tile(0, 380)}
          {tile(1, 380)}
          {tile(2, 380)}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 12, height: 372 }}>
          {tile(0, 372)}
          <View style={{ flex: 1, gap: 12 }}>
            {tile(1, 180)}
            {tile(2, 180)}
          </View>
        </View>
      )}
    </Section>
  );
}

/** A cherry ribbon of what the studio does, running sideways. */
function Band() {
  const theme = useTheme();
  const { t } = useI18n();
  const words = t('home.band').split(' · ');
  return (
    <View style={{ marginHorizontal: -40, transform: [{ rotate: '-2deg' }], backgroundColor: theme.c.primary, paddingVertical: 12 }}>
      <Marquee speed={42}>
        {words.map((w, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Txt variant="title" color="#FFFFFF" style={{ fontFamily: theme.f.italic, fontSize: 30, lineHeight: 34, paddingHorizontal: 14 }}>
              {w}
            </Txt>
            <Icon name="sparkle" size={18} color="#FFFFFF" strokeWidth={2} />
          </View>
        ))}
      </Marquee>
    </View>
  );
}

/** The shade studio: a hand to paint, with a fan of today's colours. */
function ShadeStudio() {
  const theme = useTheme();
  const { t } = useI18n();
  const swatches = ['truered', 'peony', 'butter', 'lilac', 'glazed', 'mocha'].map((id) => POLISH.find((p) => p.id === id)!);
  return (
    <Squish onPress={() => router.push('/kleurstudio')} scaleTo={0.97} accessibilityLabel={t('home.shade.cta')}>
      <View style={{ borderRadius: theme.r.card, backgroundColor: theme.c.blush, overflow: 'hidden', flexDirection: 'row', minHeight: 236 }}>
        <View style={{ flex: 1, padding: 20, gap: 10, justifyContent: 'space-between' }}>
          <View style={{ gap: 8 }}>
            <Sticker label={t('common.new')} bg={SHADES.cherry.ink} color="#FFFFFF" angle={-4} />
            <Txt variant="display" style={{ fontSize: 38, lineHeight: 38 }}>
              {t('home.shade.title')}
            </Txt>
            <Txt variant="small" color={theme.c.inkSoft}>
              {t('home.shade.body', { n: POLISH.length })}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {swatches.map((s, i) => (
              <View
                key={s.id}
                style={{
                  width: 22,
                  height: 34,
                  borderRadius: 9,
                  backgroundColor: s.hex,
                  borderWidth: 1.5,
                  borderColor: '#FFFFFF',
                  boxShadow: '0px 2px 6px rgba(20,17,20,0.18)',
                  transform: [{ rotate: `${(i - 2.5) * 5}deg` }],
                }}
              />
            ))}
          </View>
        </View>
        <Photo photo="nails-hand" style={{ width: '42%' }} position="center">
          <View style={{ position: 'absolute', bottom: 14, end: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: theme.c.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="palette" size={22} color="#FFFFFF" />
            </View>
          </View>
        </Photo>
      </View>
    </Squish>
  );
}

/** A stack of looks to swipe through, like a dating app for nails. */
function Inspo() {
  const theme = useTheme();
  const { t } = useI18n();
  const deck = LOOKS.slice(0, 3);
  return (
    <Squish onPress={() => router.push('/inspiratie')} scaleTo={0.97} accessibilityLabel={t('home.inspo.cta')}>
      <View
        style={{
          borderRadius: theme.r.card,
          backgroundColor: theme.c.lilacSoft,
          padding: 20,
          minHeight: 236,
          flexDirection: 'row',
          gap: 14,
          overflow: 'hidden',
        }}
      >
        <View style={{ flex: 1, gap: 8, justifyContent: 'space-between' }}>
          <View style={{ gap: 8 }}>
            <Tag label={t('home.inspo.tag')} bg={theme.c.lilac} color="#FFFFFF" icon="cards" />
            <Txt variant="display" style={{ fontSize: 38, lineHeight: 38 }}>
              {t('home.inspo.title')}
            </Txt>
            <Txt variant="small" color={theme.c.inkSoft}>
              {t('home.inspo.body')}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Txt variant="smallStrong">{t('home.inspo.cta')}</Txt>
            <Icon name="arrow" size={16} strokeWidth={2.2} />
          </View>
        </View>
        <View style={{ width: 120, alignItems: 'center', justifyContent: 'center' }}>
          {deck.map((look, i) => (
            <Photo
              key={look.id}
              photo={look.photo}
              style={{
                position: 'absolute',
                width: 104,
                height: 150,
                borderRadius: 18,
                borderWidth: 3,
                borderColor: '#FFFFFF',
                boxShadow: theme.shadow.card,
                transform: [{ rotate: `${(i - 1) * 9}deg` }, { translateX: (i - 1) * 10 }],
              }}
            />
          ))}
          <View style={{ position: 'absolute', bottom: 4, end: 0 }}>
            <Wobble angle={6}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  backgroundColor: theme.c.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                }}
              >
                <Icon name="heartFill" size={20} color="#FFFFFF" />
              </View>
            </Wobble>
          </View>
        </View>
      </View>
    </Squish>
  );
}

function Trending() {
  const { t } = useI18n();
  return (
    <Section title={t('home.trending')} sub={t('home.trendingSub')} action={t('common.all')} onAction={() => router.push('/inspiratie')}>
      <Rail gap={14} wrap={false}>
        {LOOKS.map((look, i) => (
          <LookCard key={look.id} look={look} tilt={i % 2 === 0 ? -1.5 : 1.5} />
        ))}
      </Rail>
    </Section>
  );
}

function ClubTeaser() {
  const { t } = useI18n();
  return (
    <Section title={t('home.club')} action={t('home.clubCta')} onAction={() => router.navigate('/club')}>
      <Squish onPress={() => router.navigate('/club')} scaleTo={0.97} accessibilityLabel={t('home.club')}>
        <ClubCard />
      </Squish>
    </Section>
  );
}

function Deals() {
  const { t } = useI18n();
  return (
    <Section title={t('home.deals')} action={t('common.all')} onAction={() => router.navigate('/club')}>
      <Rail gap={12} wrap={false}>
        {DEALS.map((deal, i) => (
          <DealTile key={deal.id} deal={deal} index={i} />
        ))}
      </Rail>
    </Section>
  );
}

function Reviews() {
  const theme = useTheme();
  const { t, text, decimal } = useI18n();
  return (
    <Section title={t('home.reviews', { rating: decimal(STUDIO.rating) })} sub={t('home.reviewsSub')}>
      <Rail gap={12} wrap={false}>
        {REVIEWS.map((review, i) => (
          <View
            key={review.name}
            style={{
              width: 268,
              borderRadius: 24,
              padding: 18,
              gap: 12,
              backgroundColor: [theme.c.blush, theme.c.lilacSoft, theme.c.honeySoft, theme.c.mintSoft][i % 4],
            }}
          >
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {Array.from({ length: 5 }, (_, s) => (
                <Icon key={s} name="star" size={16} color={theme.c.ink} />
              ))}
            </View>
            <Txt variant="title" style={{ fontSize: 22, lineHeight: 25 }}>{`“${text(review.text)}”`}</Txt>
            <Txt variant="smallStrong" color={theme.c.inkSoft}>
              {review.name}
            </Txt>
          </View>
        ))}
      </Rail>
    </Section>
  );
}

/** A peek at the studio's Instagram grid. */
function Instagram() {
  const theme = useTheme();
  const { t } = useI18n();
  const { wide, inner } = useLayout();
  const columns = wide ? 6 : 3;
  const size = (inner(1120) - 6 * (columns - 1)) / columns;
  const grid = ['nails-red', 'lashes-lift', 'nails-peony', 'brows-map', 'nails-sparkle', 'nails-nude'] as const;
  const open = () => Linking.openURL(`https://www.instagram.com/${STUDIO.instagram}/`).catch(() => {});
  return (
    <Section title={t('home.insta')} sub={`@${STUDIO.instagram}`} action={t('home.follow')} onAction={open}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {grid.map((photo, i) => (
          <Squish key={photo} onPress={open} scaleTo={0.95} accessibilityLabel={`Instagram ${i + 1}`}>
            <Photo photo={photo} style={{ width: size, height: size, borderRadius: i === 0 ? 22 : 10 }}>
              {i === 0 ? (
                <View style={{ position: 'absolute', top: 8, start: 8 }}>
                  <Icon name="instagram" size={20} color="#FFFFFF" />
                </View>
              ) : null}
            </Photo>
          </Squish>
        ))}
      </View>
      <Txt variant="caption" color={theme.c.muted}>
        {t('home.instaNote')}
      </Txt>
    </Section>
  );
}

function Visit() {
  const theme = useTheme();
  const { t } = useI18n();
  const { wide } = useLayout();
  const home = locationBlanche('nijmegen');
  return (
    <View style={{ borderRadius: theme.r.card, overflow: 'hidden', backgroundColor: theme.c.chalk, flexDirection: wide ? 'row' : 'column' }}>
      <Photo photo="polish-wall" style={{ height: wide ? undefined : 200, width: wide ? '46%' : undefined, minHeight: 220 }} />
      <View style={{ padding: 20, gap: 12, flex: wide ? 1 : undefined }}>
        <Txt variant="display" style={{ fontSize: 38, lineHeight: 38 }}>
          {t('home.visit')}
        </Txt>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Icon name="pin" size={18} />
            <Txt variant="bodyStrong">{`${home.address}, ${home.city}`}</Txt>
          </View>
          <Txt variant="small" color={theme.c.muted}>
            {t('home.visitInside', { place: STUDIO.inside })}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Button label={t('contact.route')} kind="ink" size="md" icon="pin" onPress={() => router.push('/contact')} />
          <Button label={t('contact.whatsapp')} kind="outline" size="md" icon="chat" onPress={() => router.push('/contact')} />
        </View>
      </View>
    </View>
  );
}
