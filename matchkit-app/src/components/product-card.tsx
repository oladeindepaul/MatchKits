import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Product } from '@/lib/catalog';
import { formatNaira, KIT_LABELS } from '@/lib/format';
import { C, F } from '@/constants/theme';
import { T } from './ui';
import { HeartButton } from './heart-button';

export function ProductCard({ product, width }: { product: Product; width: number }) {
  return (
    <View style={[styles.card, { width }]}>
      <Link href={{ pathname: '/product/[slug]', params: { slug: product.slug } }} asChild>
        <Pressable accessibilityLabel={`${product.name}, ${formatNaira(product.price)}`}>
          <View style={styles.imageWrap}>
            <Image source={product.image} style={styles.image} contentFit="cover" transition={200} recyclingKey={product.slug} />
          </View>
          <View style={styles.meta}>
            <View style={{ flex: 1 }}>
              <T numberOfLines={1} style={styles.name}>
                {product.club.name}
              </T>
              <T numberOfLines={1} style={styles.sub}>
                {KIT_LABELS[product.kitType]} · {product.club.league.shortName}
              </T>
            </View>
            <T style={styles.price}>{formatNaira(product.price)}</T>
          </View>
        </Pressable>
      </Link>
      <View style={styles.heart}>
        <HeartButton productId={product.id} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.sand, padding: 8 },
  imageWrap: { aspectRatio: 1, backgroundColor: C.white, overflow: 'hidden' },
  image: { flex: 1 },
  meta: { flexDirection: 'row', gap: 6, paddingHorizontal: 4, paddingTop: 10, paddingBottom: 6, alignItems: 'flex-start' },
  name: { fontSize: 13 },
  sub: { fontSize: 11, color: C.stone, marginTop: 2 },
  price: { fontSize: 13, fontFamily: F.medium },
  heart: { position: 'absolute', right: 12, top: 12 },
});
