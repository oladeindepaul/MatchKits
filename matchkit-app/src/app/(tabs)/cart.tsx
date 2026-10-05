import { useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '@/providers/cart';
import { useAuth } from '@/providers/auth';
import { formatNaira, KIT_LABELS, MAX_QTY } from '@/lib/format';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Button, Empty, Eyebrow, Loading, T, Title } from '@/components/ui';
import { C, F, GUTTER } from '@/constants/theme';

export default function CartScreen() {
  const { lines, ready, count, subtotal, setQuantity, remove, refresh } = useCart();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.cream }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ink} />}
        contentContainerStyle={{ padding: GUTTER, paddingBottom: 40 }}>
        <Title style={{ marginTop: 4 }}>Your cart</Title>
        <View style={styles.sync}>
          <Ionicons name={user ? 'sync-outline' : 'phone-portrait-outline'} size={14} color={C.stone} />
          <T style={{ fontSize: 12, color: C.stone, flex: 1 }}>
            {user ? `Synced with your MatchKit account (${user.email})` : 'Saved on this phone. Log in to sync with the website.'}
          </T>
        </View>

        {!ready ? (
          <Loading />
        ) : lines.length === 0 ? (
          <Empty title="Your cart is empty." message="Find your club's new kit and it will show up here." action={<Button variant="outline" label="Start shopping" onPress={() => router.navigate('/shop')} />} />
        ) : (
          <>
            <View style={styles.list}>
              {lines.map((line) => (
                <View key={`${line.productId}-${line.size}`} style={styles.row}>
                  <Pressable onPress={() => router.push({ pathname: '/product/[slug]', params: { slug: line.slug } })} style={styles.thumb}>
                    <Image source={line.image} style={{ flex: 1 }} contentFit="cover" />
                  </Pressable>
                  <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <T numberOfLines={1}>{line.clubName}</T>
                        <T style={styles.sub}>
                          {KIT_LABELS[line.kitType] ?? line.kitType} jersey · Size {line.size}
                        </T>
                        <T style={styles.sub}>{formatNaira(line.price)} each</T>
                      </View>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          remove(line.productId, line.size);
                        }}
                        hitSlop={10}
                        accessibilityLabel={`Remove ${line.name}, size ${line.size}`}>
                        <Ionicons name="close" size={18} color={C.stone} />
                      </Pressable>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <QuantityStepper value={line.quantity} max={MAX_QTY} onChange={(q) => setQuantity(line.productId, line.size, q)} />
                      <T style={{ fontFamily: F.medium }}>{formatNaira(line.price * line.quantity)}</T>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <Pressable onPress={() => router.navigate('/shop')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 18 }}>
              <Ionicons name="arrow-back" size={16} color={C.accent} />
              <Eyebrow style={{ color: C.accent }}>Continue shopping</Eyebrow>
            </Pressable>

            <View style={styles.summary}>
              <Eyebrow style={{ color: C.ink, marginBottom: 14 }}>Order summary</Eyebrow>
              <View style={styles.sumRow}>
                <T style={styles.sumLabel}>
                  Subtotal ({count} item{count === 1 ? '' : 's'})
                </T>
                <T>{formatNaira(subtotal)}</T>
              </View>
              <View style={styles.sumRow}>
                <T style={styles.sumLabel}>Delivery</T>
                <T>Free</T>
              </View>
              <View style={[styles.sumRow, { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 12, marginTop: 4 }]}>
                <T style={{ fontSize: 17 }}>Total</T>
                <T style={{ fontSize: 17, fontFamily: F.medium }}>{formatNaira(subtotal)}</T>
              </View>
              <Button
                label="Proceed to checkout"
                style={{ marginTop: 18 }}
                onPress={() => router.push(user ? '/checkout' : { pathname: '/login', params: { next: 'checkout' } })}
              />
              {!user && <T style={{ fontSize: 12, color: C.stone, textAlign: 'center', marginTop: 10 }}>You&apos;ll be asked to log in first.</T>}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sync: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 18 },
  list: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  row: { flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  thumb: { width: 84, height: 84, backgroundColor: C.white, overflow: 'hidden' },
  sub: { fontSize: 12, color: C.stone, marginTop: 2 },
  summary: { backgroundColor: C.sand, padding: 18 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  sumLabel: { color: C.stone, fontSize: 14 },
});
