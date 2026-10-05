import { useRef, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { Product } from '@/lib/catalog';
import { formatNaira, KIT_LABELS } from '@/lib/format';
import { C, F, GUTTER } from '@/constants/theme';
import { Button, Eyebrow, T, Title } from './ui';

const BLURBS: Record<string, string> = {
  arsenal: 'North London red for the new season. Breathable match fabric and a sharp collar.',
  'real-madrid': 'All-white elegance from the Bernabéu, built for the big European nights.',
  argentina: "The world champions' sky-blue stripes. A shirt for the bold and the believers.",
  'fc-barcelona': 'Blaugrana stripes straight from Montjuïc, in soft-touch fabric.',
};

const pad = (n: number) => String(n).padStart(2, '0');

// The website's featured-jersey slider, as a swipeable carousel.
export function Hero({ slides }: { slides: Product[] }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList<Product>>(null);
  const imageSize = Math.min(width - GUTTER * 2, 520);

  if (!slides.length) return null;

  return (
    <View>
      <FlatList
        ref={list}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.slug}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: GUTTER }}>
            <Pressable onPress={() => router.push({ pathname: '/product/[slug]', params: { slug: item.slug } })}>
              <Image source={item.image} style={{ width: imageSize, height: imageSize, alignSelf: 'center', backgroundColor: C.white }} contentFit="cover" transition={250} />
            </Pressable>
            <Eyebrow style={{ marginTop: 20 }}>
              {item.club.league.name} · {KIT_LABELS[item.kitType]} kit 26/27
            </Eyebrow>
            <Title size={30} style={{ marginTop: 8, fontFamily: F.medium }}>
              {item.club.name}
            </Title>
            <T style={styles.blurb}>{BLURBS[item.club.slug] ?? item.description}</T>
            <Button
              variant="outline"
              label={`Buy ${formatNaira(item.price)}`}
              onPress={() => router.push({ pathname: '/product/[slug]', params: { slug: item.slug } })}
              style={{ alignSelf: 'flex-start', marginTop: 18 }}
            />
          </View>
        )}
      />
      <View style={styles.pager}>
        <T style={styles.pagerNum}>{pad(index + 1)}</T>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${((index + 1) / slides.length) * 100}%` }]} />
        </View>
        <T style={[styles.pagerNum, { color: C.stone }]}>{pad(slides.length)}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blurb: { marginTop: 10, color: 'rgba(22,21,19,0.8)', fontSize: 14, lineHeight: 21, maxWidth: 360 },
  pager: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: GUTTER, marginTop: 20 },
  pagerNum: { fontFamily: F.medium, fontSize: 11 },
  track: { width: 56, height: 1, backgroundColor: C.line },
  fill: { height: 1, backgroundColor: C.ink },
});
