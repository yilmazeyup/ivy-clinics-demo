import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PopIn } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { Pills } from '@/components/Pills';
import { Screen } from '@/components/Screen';
import { ServiceRow } from '@/components/ServiceRow';
import { Txt } from '@/components/Txt';
import { CATEGORIES, servicesIn, STUDIO, type CategoryId } from '@/data';
import { useI18n } from '@/i18n';
import { useLayout } from '@/layout';
import { categoryColors, useTheme } from '@/theme';

type Filter = 'all' | CategoryId;

/** The menu: every service of the three crafts, with time and price, filtered by craft. */
export default function MenuScreen() {
  const theme = useTheme();
  const { t, text } = useI18n();
  const { wide } = useLayout();
  const params = useLocalSearchParams<{ craft?: string }>();
  const [filter, setFilter] = useState<Filter>('all');
  // A craft tile on Home opens the menu on that craft.
  useEffect(() => {
    if (params.craft && CATEGORIES.some((c) => c.id === params.craft)) setFilter(params.craft as CategoryId);
  }, [params.craft]);
  const shown = CATEGORIES.filter((c) => filter === 'all' || c.id === filter);

  return (
    <Screen tabs width="page" gap={26}>
      <View style={{ gap: 10 }}>
        <Txt variant="display" style={wide ? { fontSize: 64, lineHeight: 62 } : undefined}>
          {t('menu.title')}
        </Txt>
        <Txt variant="body" color={theme.c.inkSoft}>
          {t('menu.intro')}
        </Txt>
      </View>
      <Pills
        label={t('menu.filter')}
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: t('common.all') },
          ...CATEGORIES.map((c) => ({
            value: c.id,
            label: text(c.name),
            icon: c.id === 'nails' ? ('polish' as const) : c.id === 'lashes' ? ('lash' as const) : ('brow' as const),
            color: categoryColors(c.id).ink,
          })),
        ]}
      />
      {shown.map((category) => {
        const colors = categoryColors(category.id);
        const services = servicesIn(category.id);
        return (
          <PopIn key={`${filter}-${category.id}`} style={{ gap: 14 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 24, backgroundColor: colors.soft, overflow: 'hidden' }}
            >
              <Photo photo={category.photo} style={{ width: 64, height: 64, borderRadius: 18 }} />
              <View style={{ flex: 1 }}>
                <Txt variant="title" color={theme.c.ink}>
                  {text(category.name)}
                </Txt>
                <Txt variant="small" color={theme.c.inkSoft}>
                  {text(category.tagline)}
                </Txt>
              </View>
              <Txt variant="title" color={colors.ink} style={{ fontSize: 40, lineHeight: 42 }}>
                {String(services.length)}
              </Txt>
            </View>
            <View style={wide ? { flexDirection: 'row', flexWrap: 'wrap', gap: 14 } : { gap: 12 }}>
              {services.map((service) => (
                <View key={service.id} style={wide ? { width: '48.9%' } : undefined}>
                  <ServiceRow service={service} />
                </View>
              ))}
            </View>
          </PopIn>
        );
      })}
      <View
        style={{
          borderRadius: theme.r.card,
          padding: 20,
          gap: 12,
          backgroundColor: theme.c.chalk,
          borderWidth: 1.5,
          borderColor: theme.c.ink,
          borderStyle: 'dashed',
        }}
      >
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icon name="camera" size={22} />
          <Txt variant="heading" style={{ flex: 1 }}>
            {t('menu.photoTitle')}
          </Txt>
        </View>
        <Txt variant="small" color={theme.c.inkSoft}>
          {t('menu.photoBody')}
        </Txt>
        <Button
          label={t('contact.whatsapp')}
          kind="ink"
          size="md"
          icon="chat"
          style={{ alignSelf: 'flex-start' }}
          onPress={() => Linking.openURL(`https://wa.me/${STUDIO.phoneLink.replace(/\D/g, '')}`).catch(() => router.push('/contact'))}
        />
      </View>
    </Screen>
  );
}
