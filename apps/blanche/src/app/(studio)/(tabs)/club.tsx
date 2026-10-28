import { router } from 'expo-router';
import { Share, View } from 'react-native';

import { Button } from '@/components/Button';
import { ClubCard } from '@/components/ClubCard';
import { DealTile } from '@/components/DealTile';
import { Icon, type IconName } from '@/components/Icon';
import { Squish } from '@/components/Motion';
import { Rail, Screen, Section } from '@/components/Screen';
import { Sticker, Tag } from '@/components/Sticker';
import { useToast } from '@/components/Toast';
import { Txt } from '@/components/Txt';
import { DEALS, EARN, MEMBER, PACKS, REWARDS, SHADES, STUDIO, TIERS, type Pack, type Reward } from '@/data';
import { useI18n } from '@/i18n';
import { useLayout } from '@/layout';
import { useStudio } from '@/studio';
import { useTheme } from '@/theme';

/** Blanche Club: the card, the levels, rewards to swap points for, ways to earn, deals and prepaid passes. */
export default function ClubScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const { wide } = useLayout();
  return (
    <Screen tabs width="page" gap={34}>
      <View style={{ gap: 8 }}>
        <Txt variant="display" style={wide ? { fontSize: 64, lineHeight: 62 } : undefined}>
          {t('club.title')}
        </Txt>
        <Txt variant="body" color={theme.c.inkSoft}>
          {t('club.intro')}
        </Txt>
      </View>
      <View style={wide ? { flexDirection: 'row', gap: 28, alignItems: 'stretch' } : { gap: 24 }}>
        <View style={{ flex: wide ? 1 : undefined }}>
          <ClubCard big />
        </View>
        <View style={{ flex: wide ? 1 : undefined }}>
          <Levels />
        </View>
      </View>
      <Rewards />
      <Earn />
      <Friends />
      <Section title={t('club.deals')} sub={t('club.dealsSub')}>
        <Rail gap={12} wrap={false}>
          {DEALS.map((deal, i) => (
            <DealTile key={deal.id} deal={deal} index={i} />
          ))}
        </Rail>
      </Section>
      <Section title={t('club.packs')} sub={t('club.packsSub')}>
        <View style={wide ? { flexDirection: 'row', gap: 14 } : { gap: 12 }}>
          {PACKS.map((pack) => (
            <View key={pack.id} style={{ flex: wide ? 1 : undefined }}>
              <PackCard pack={pack} />
            </View>
          ))}
        </View>
      </Section>
    </Screen>
  );
}

/** The three levels as steps on a path, with the member's position marked. */
function Levels() {
  const theme = useTheme();
  const { t, text } = useI18n();
  const { level } = useStudio();
  const colors = [theme.c.chalk, theme.c.blush, SHADES.cherry.ink];
  return (
    <View style={{ gap: 10, height: '100%' }}>
      {TIERS.map((tier, i) => {
        const current = tier.id === level.tier.id;
        const reached = tier.from <= level.tier.from;
        return (
          <View
            key={tier.id}
            style={{
              flex: 1,
              flexDirection: 'row',
              gap: 14,
              alignItems: 'center',
              padding: 14,
              borderRadius: 22,
              backgroundColor: colors[i],
              borderWidth: current ? 2 : 0,
              borderColor: theme.c.ink,
            }}
          >
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                backgroundColor: i === 2 ? '#FFFFFF' : theme.c.ink,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={reached ? 'crown' : 'sparkle'} size={22} color={i === 2 ? SHADES.cherry.ink : '#FFFFFF'} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Txt variant="title" color={i === 2 ? '#FFFFFF' : theme.c.ink} style={{ fontSize: 26, lineHeight: 28 }}>
                  {tier.name}
                </Txt>
                {current ? <Tag label={t('club.you')} bg={theme.c.ink} color="#FFFFFF" /> : null}
              </View>
              <Txt variant="caption" color={i === 2 ? 'rgba(255,255,255,0.85)' : theme.c.inkSoft} numberOfLines={2}>
                {`${t('club.from', { n: tier.from })} · ${tier.perks.map((p) => text(p)).join(' · ')}`}
              </Txt>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Rewards() {
  const theme = useTheme();
  const { t, text, num } = useI18n();
  const { points, vouchers, redeem } = useStudio();
  const toast = useToast();
  const { wide, inner } = useLayout();
  const columns = wide ? 5 : 2;
  const size = (inner(1120) - 12 * (columns - 1)) / columns;
  const tint = (r: Reward) =>
    r.category === 'nails' ? theme.c.blush : r.category === 'lashes' ? theme.c.lilacSoft : r.category === 'brows' ? theme.c.honeySoft : theme.c.mintSoft;
  return (
    <Section title={t('club.rewards')} sub={t('club.rewardsSub')}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {REWARDS.map((reward) => {
          const enough = points >= reward.points;
          const have = vouchers.filter((v) => v === reward.id).length;
          return (
            <View
              key={reward.id}
              style={{ width: size, minHeight: 190, borderRadius: 24, padding: 16, backgroundColor: tint(reward), justifyContent: 'space-between', gap: 12 }}
            >
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Txt variant="display" style={{ fontSize: 40, lineHeight: 40 }}>
                    {num(reward.points)}
                  </Txt>
                  <Txt variant="caption">{t('club.pts')}</Txt>
                </View>
                <Txt variant="bodyStrong" numberOfLines={3}>
                  {text(reward.name)}
                </Txt>
              </View>
              {have ? <Sticker label={t('club.ready', { n: have })} bg="#FFFFFF" angle={-3} still /> : null}
              <Button
                label={enough ? t('club.swap') : t('club.more', { n: num(reward.points - points) })}
                kind={enough ? 'ink' : 'white'}
                size="sm"
                disabled={!enough}
                onPress={() => {
                  if (redeem(reward.id)) toast(t('club.swapped', { name: text(reward.name) }));
                }}
              />
            </View>
          );
        })}
      </View>
    </Section>
  );
}

function Earn() {
  const theme = useTheme();
  const { t } = useI18n();
  const icons: Record<(typeof EARN)[number]['id'], IconName> = { visit: 'sparkle', post: 'instagram', review: 'star', friend: 'heart', birthday: 'gift' };
  return (
    <Section title={t('club.earn')}>
      <View style={{ borderRadius: theme.r.card, backgroundColor: theme.c.chalk, padding: 6 }}>
        {EARN.map((way, i) => (
          <View
            key={way.id}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: theme.c.line }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={icons[way.id]} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{t(`club.earn.${way.id}`)}</Txt>
              <Txt variant="small" color={theme.c.muted}>
                {t(`club.earn.${way.id}Sub`, { handle: `@${STUDIO.instagram}` })}
              </Txt>
            </View>
            <Txt variant="title" color={theme.c.primary} style={{ fontSize: 24, lineHeight: 26 }}>
              {way.points ? `+${way.points}` : t('club.perEuro')}
            </Txt>
          </View>
        ))}
      </View>
    </Section>
  );
}

/** Give a friend € 10, get 100 points: the member's own code, ready to share. */
function Friends() {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ borderRadius: theme.r.card, padding: 22, gap: 14, backgroundColor: theme.c.lilac, overflow: 'hidden' }}>
      <Sticker label={t('club.friendTag')} bg="#FFFFFF" angle={-4} />
      <Txt variant="display" color="#FFFFFF" style={{ fontSize: 40, lineHeight: 40 }}>
        {t('club.friendTitle')}
      </Txt>
      <Txt variant="body" color="rgba(255,255,255,0.88)">
        {t('club.friendBody')}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <View
          style={{
            paddingHorizontal: 16,
            height: 46,
            borderRadius: theme.r.pill,
            borderWidth: 1.5,
            borderColor: '#FFFFFF',
            borderStyle: 'dashed',
            justifyContent: 'center',
          }}
        >
          <Txt variant="bodyStrong" color="#FFFFFF" style={{ letterSpacing: 1.5 }}>
            {MEMBER.code}
          </Txt>
        </View>
        <Button
          label={t('club.share')}
          kind="white"
          size="md"
          icon="share"
          onPress={() => Share.share({ message: t('club.shareText', { code: MEMBER.code }) }).catch(() => {})}
        />
      </View>
    </View>
  );
}

function PackCard({ pack }: { pack: Pack }) {
  const theme = useTheme();
  const { t, text, euro } = useI18n();
  const shade = SHADES[pack.shade];
  const { addToCart } = useStudio();
  const toast = useToast();
  return (
    <View
      style={{
        borderRadius: 24,
        padding: 18,
        gap: 12,
        backgroundColor: shade.soft,
        borderWidth: 1.5,
        borderColor: theme.c.ink,
        boxShadow: theme.shadow.sticker,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="title">{text(pack.name)}</Txt>
          <Txt variant="small" color={theme.c.inkSoft}>
            {text(pack.body)}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 3, paddingTop: 6 }}>
          {Array.from({ length: pack.visits }, (_, i) => (
            <View key={i} style={{ width: 10, height: 22, borderRadius: 4, backgroundColor: shade.ink, opacity: 1 - i * 0.15 }} />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Txt variant="price" style={{ fontSize: 30, lineHeight: 32 }}>
            {euro(pack.price)}
          </Txt>
          <Txt variant="small" color={theme.c.muted} style={{ textDecorationLine: 'line-through' }}>
            {euro(pack.was)}
          </Txt>
        </View>
        <Squish
          onPress={() => {
            addToCart(`pack:${pack.id}`);
            toast(t('shop.added', { name: text(pack.name) }));
          }}
          scaleTo={0.9}
          accessibilityLabel={t('club.buyPack')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            height: 40,
            paddingHorizontal: 14,
            borderRadius: theme.r.pill,
            backgroundColor: theme.c.ink,
          }}
        >
          <Icon name="bag" size={16} color="#FFFFFF" />
          <Txt variant="smallStrong" color="#FFFFFF">
            {t('club.buyPack')}
          </Txt>
        </Squish>
      </View>
      <Squish onPress={() => router.push({ pathname: '/behandeling/[id]', params: { id: pack.service } })} accessibilityLabel={t('club.packInfo')}>
        <Txt variant="caption" color={theme.c.inkSoft} style={{ textDecorationLine: 'underline' }}>
          {t('club.packInfo')}
        </Txt>
      </Squish>
    </View>
  );
}
