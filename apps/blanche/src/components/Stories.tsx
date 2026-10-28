import { router } from 'expo-router';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { SHADES, STORIES, type Story } from '@/data';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';

import { Squish } from './Motion';
import { Photo } from './Photo';
import { Rail } from './Screen';
import { Txt } from './Txt';

const W = 78;
const H = 112;

/** A frame in the studio's three colours around a story that has not been seen yet. */
function Ring() {
  return (
    <Svg width={W + 8} height={H + 8} style={{ position: 'absolute', top: -4, left: -4 }} pointerEvents="none">
      <Defs>
        <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={SHADES.cherry.ink} />
          <Stop offset="0.5" stopColor={SHADES.lilac.ink} />
          <Stop offset="1" stopColor="#F2A93B" />
        </LinearGradient>
      </Defs>
      <Rect x={1.5} y={1.5} width={W + 5} height={H + 5} rx={22} fill="none" stroke="url(#ring)" strokeWidth={3} />
    </Svg>
  );
}

function StoryTile({ story }: { story: Story }) {
  const { text } = useI18n();
  const theme = useTheme();
  return (
    <Squish onPress={() => router.push({ pathname: '/stories', params: { start: story.id } })} scaleTo={0.92} accessibilityLabel={text(story.label)}>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <View style={{ width: W, height: H }}>
          <Ring />
          <Photo photo={story.frames[0].photo} style={{ width: W, height: H, borderRadius: 18, borderWidth: 2, borderColor: '#FFFFFF' }} scrim />
        </View>
        <Txt variant="caption" color={theme.c.ink} numberOfLines={1} style={{ maxWidth: W + 8, fontFamily: theme.f.strong }}>
          {text(story.label)}
        </Txt>
      </View>
    </Squish>
  );
}

/** The studio's stories on Home: what is new, the look of the week, a tip. */
export function StoryRail() {
  const theme = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Txt variant="tag" color={theme.c.muted}>
          {t('home.stories')}
        </Txt>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.c.line }} />
      </View>
      <Rail gap={14} wrap={false}>
        {STORIES.map((story) => (
          <StoryTile key={story.id} story={story} />
        ))}
      </Rail>
    </View>
  );
}
