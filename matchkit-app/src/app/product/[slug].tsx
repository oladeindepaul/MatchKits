import { useState } from 'react';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useCatalog } from '@/providers/catalog';
import { useCart } from '@/providers/cart';
import { useWishlist } from '@/providers/wishlist';
import { formatNaira, KIT_LABELS, MAX_QTY } from '@/lib/format';
import { QuantityStepper } from '@/components/quantity-stepper';
import { ProductGrid } from '@/components/product-grid';
import { Button, Empty, Eyebrow, Loading, T, Title } from '@/components/ui';
import { C, F, GUTTER } from '@/constants/theme';

// Keyed by slug so size, quantity and messages reset when switching between a club's kits.
export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <ProductView key={slug} slug={slug} />;
}

function ProductView({ slug }: { slug: string }) {
  const { products, loading } = useCatalog();
  const { add } = useCart();
  const wishlist = useWishlist();
  const { width } = useWindowDimensions();
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  const product = products.find((p) => p.slug === slug);
  if (loading) return <Loading />;
  if (!product)
    return (
      <View style={{ padding: GUTTER }}>
        <Empty title="Jersey not found" action={<Button label="Browse jerseys" onPress={() => router.replace('/shop')} />} />
      </View>
    );

  const kits = products.filter((p) => p.club.slug === product.club.slug);
  const related = products
    .filter((p) => p.club.league.slug === product.club.league.slug && p.club.slug !== product.club.slug && p.kitType === product.kitType)
    .slice(0, 4);
  const saved = wishlist.has(product.id);
  const imageSize = Math.min(width, 600);

  function addToCart() {
    if (!product) return;
    if (!size) {
      setSizeError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    add(
      { productId: product.id, slug: product.slug, name: product.name, clubName: product.club.name, kitType: product.kitType, price: product.price, image: product.image, size },
      quantity
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAdded(`${quantity} × size ${size}`);
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: product.club.name,
          headerRight: () => (
            <Pressable onPress={() => wishlist.toggle(product.id)} hitSlop={10} accessibilityLabel={saved ? 'Remove from wishlist' : 'Add to wishlist'}>
              <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? C.accent : C.ink} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={{ backgroundColor: C.white, alignItems: 'center' }}>
          <Image source={product.image} style={{ width: imageSize, height: imageSize }} contentFit="cover" transition={200} />
          {product.club.logo && <Image source={product.club.logo} style={styles.crest} contentFit="contain" />}
        </View>

        <View style={{ paddingHorizontal: GUTTER, paddingTop: 22 }}>
          <Eyebrow>
            {product.club.league.name} · {product.season}
          </Eyebrow>
          <Title size={28} style={{ marginTop: 6, fontFamily: F.medium }}>
            {product.club.name}
          </Title>
          <T style={{ fontFamily: F.light, fontSize: 18, marginTop: 2 }}>{KIT_LABELS[product.kitType]} Jersey</T>
          <T style={{ fontSize: 24, marginTop: 14 }}>{formatNaira(product.price)}</T>

          {kits.length > 1 && (
            <View style={{ marginTop: 22 }}>
              <Eyebrow style={{ marginBottom: 8 }}>Kit</Eyebrow>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {kits.map((k) => {
                  const active = k.slug === product.slug;
                  return (
                    <Pressable
                      key={k.slug}
                      onPress={() => !active && router.setParams({ slug: k.slug })}
                      style={[styles.kit, active && { backgroundColor: C.ink, borderColor: C.ink }]}>
                      <Image source={k.image} style={{ width: 28, height: 28 }} contentFit="cover" />
                      <T style={{ fontSize: 13, color: active ? C.cream : C.ink }}>{KIT_LABELS[k.kitType]}</T>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ marginTop: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Eyebrow>Size</Eyebrow>
              {sizeError && !size && <T style={{ color: C.danger, fontSize: 12 }}>Please choose a size</T>}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {product.sizes.map((s) => {
                const active = size === s.size;
                return (
                  <Pressable
                    key={s.size}
                    disabled={!s.inStock}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSize(s.size);
                      setAdded(null);
                    }}
                    accessibilityState={{ selected: active, disabled: !s.inStock }}
                    style={[
                      styles.size,
                      active && { backgroundColor: C.ink, borderColor: C.ink },
                      sizeError && !size && { borderColor: C.danger },
                    ]}>
                    <T style={{ fontFamily: F.medium, fontSize: 13, color: active ? C.cream : s.inStock ? C.ink : C.line }}>{s.size}</T>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 22, alignItems: 'flex-end' }}>
            <View>
              <Eyebrow style={{ marginBottom: 8 }}>Quantity</Eyebrow>
              <QuantityStepper value={quantity} max={MAX_QTY} onChange={(q) => { setQuantity(q); setAdded(null); }} />
            </View>
            <Button label="Add to cart" onPress={addToCart} style={{ flex: 1, minHeight: 46 }} />
          </View>

          {added && (
            <View style={styles.added}>
              <T style={{ fontSize: 13, flex: 1 }}>Added {added} to your cart.</T>
              <Pressable onPress={() => router.navigate('/cart')} hitSlop={8}>
                <Eyebrow style={{ color: C.accent }}>View cart</Eyebrow>
              </Pressable>
            </View>
          )}

          <View style={styles.details}>
            {[
              ['Club', product.club.name],
              ['League', product.club.league.name],
              ['Kit type', KIT_LABELS[product.kitType]],
              ['Season', product.season],
              ['Sizes', product.sizes.map((s) => s.size).join(', ')],
            ].map(([k, v]) => (
              <View key={k} style={styles.detailRow}>
                <T style={{ color: C.stone, fontSize: 14 }}>{k}</T>
                <T style={{ fontSize: 14 }}>{v}</T>
              </View>
            ))}
          </View>
          {product.description ? <T style={{ marginTop: 16, fontSize: 14, lineHeight: 21, color: 'rgba(22,21,19,0.8)' }}>{product.description}</T> : null}

          {related.length > 0 && (
            <View style={{ marginTop: 36 }}>
              <Title size={20} style={{ marginBottom: 14 }}>
                You may also like
              </Title>
              <ProductGrid products={related} />
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  crest: { position: 'absolute', left: GUTTER, top: GUTTER, width: 40, height: 40 },
  kit: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.line, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.paper },
  size: { flex: 1, height: 46, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper },
  added: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.sand, padding: 14, marginTop: 14 },
  details: { marginTop: 26, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
});
