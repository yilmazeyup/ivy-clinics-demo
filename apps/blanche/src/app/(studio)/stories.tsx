import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/Button';
import { PopIn } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { Txt } from '@/components/Txt';
import { lookById, STORIES, STUDIO } from '@/data';
import { useI18n } from '@/i18n';

const FRAME_MS = 5200;

/** The studio's stories full screen: bars along the top fill up, a tap moves on, and each story ends in something to book. */
export default function StoriesScreen() {
  const insets = useSafeAreaInsets();
  const { t, text } = useI18n();
  const { start } = useLocalSearchParams<{ start?: string }>();
  const [story, setStory] = useState(() =>
    Math.max(
      0,
      STORIES.findIndex((s) => s.id === start),
    ),
  );
  const [frame, setFrame] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const current = STORIES[story];
  const shot = current.frames[frame];

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const next = () => {
    if (frame < current.frames.length - 1) setFrame(frame + 1);
    else if (story < STORIES.length - 1) {
      setStory(story + 1);
      setFrame(0);
    } else close();
  };
  const previous = () => {
    if (frame > 0) setFrame(frame - 1);
    else if (story > 0) {
      setStory(story - 1);
      setFrame(0);
    }
  };

  useEffect(() => {
    progress.setValue(0);
    const run = Animated.timing(progress, { toValue: 1, duration: FRAME_MS, easing: Easing.linear, useNativeDriver: false });
    run.start(({ finished }) => finished && next());
    return () => run.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, frame]);

  const cta = current.cta;
  const act = () => {
    if (cta.kind === 'club') router.replace('/club');
    else if (cta.kind === 'service') router.replace({ pathname: '/behandeling/[id]', params: { id: cta.id } });
    else {
      const look = lookById(cta.id);
      if (look) router.replace({ pathname: '/afspraak/[serviceId]', params: { serviceId: look.service, look: look.id, shade: look.shade, stylist: look.by } });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <PopIn key={`${story}-${frame}`} from={1.04} rise={0} style={StyleSheet.absoluteFill}>
        <Photo photo={shot.photo} style={StyleSheet.absoluteFill} scrim />
      </PopIn>
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} style={{ flex: 1 }} onPress={previous} />
        <Pressable accessibilityRole="button" accessibilityLabel={t('stories.next')} style={{ flex: 2 }} onPress={next} />
      </View>
      <View style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, gap: 12 }} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', gap: 4, direction: 'ltr' }}>
          {current.frames.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
              <Animated.View
                style={{
                  height: '100%',
                  backgroundColor: '#FFFFFF',
                  width: i < frame ? '100%' : i > frame ? '0%' : progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                }}
              />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} pointerEvents="box-none">
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="title" style={{ fontFamily: 'PinyonScript_400Regular', fontSize: 24, lineHeight: 34 }}>
              B
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="smallStrong" color="#FFFFFF">{`@${STUDIO.instagram}`}</Txt>
            <Txt variant="caption" color="rgba(255,255,255,0.75)">
              {text(current.label)}
            </Txt>
          </View>
          <IconButton icon="close" label={t('common.close')} tone="clear" onPress={close} />
        </View>
      </View>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 24, gap: 14 }} pointerEvents="box-none">
        <PopIn key={`t-${story}-${frame}`} delay={120}>
          <Txt variant="display" color="#FFFFFF" style={{ fontSize: 46, lineHeight: 46 }}>
            {text(shot.title)}
          </Txt>
        </PopIn>
        <PopIn key={`b-${story}-${frame}`} delay={220}>
          <Txt variant="body" color="rgba(255,255,255,0.9)" style={{ fontSize: 17, lineHeight: 25 }}>
            {text(shot.body)}
          </Txt>
        </PopIn>
        <Button
          label={cta.kind === 'club' ? t('stories.club') : cta.kind === 'look' ? t('stories.look') : t('stories.service')}
          kind="white"
          iconAfter="arrow"
          onPress={act}
        />
      </View>
    </View>
  );
}
