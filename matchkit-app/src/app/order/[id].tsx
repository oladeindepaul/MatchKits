import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { formatDate, formatNaira, KIT_LABELS, storageUrl } from '@/lib/format';
import { Button, Empty, Eyebrow, Loading, T, Title } from '@/components/ui';
import { C, F, GUTTER } from '@/constants/theme';

type Item = { id: number; club_name: string; kit_type: string; image_path: string | null; size: string; quantity: number; unit_price: number; line_total: number };
type Order = {
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  subtotal: number;
  total: number;
  created_at: string;
  order_items: Item[];
};

export default function OrderScreen() {
  const { id, placed, email } = useLocalSearchParams<{ id: string; placed?: string; email?: string }>();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    // Row Level Security only returns the order if it belongs to the signed-in shopper.
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .order('id', { referencedTable: 'order_items' })
      .maybeSingle()
      .then(({ data }) => setOrder((data as Order) ?? null));
  }, [id]);

  if (order === undefined) return <Loading />;
  if (order === null) return <Empty title="Order not found" />;

  const count = order.order_items.reduce((n, i) => n + i.quantity, 0);

  return (
    <>
      <Stack.Screen options={{ title: placed ? 'Order confirmed' : order.order_number, headerBackVisible: !placed, gestureEnabled: !placed }} />
      <ScrollView contentContainerStyle={{ padding: GUTTER, paddingBottom: 48 }}>
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Eyebrow style={{ color: C.accent }}>{placed ? 'Order confirmed' : 'Order details'}</Eyebrow>
          <Title size={28} style={{ marginTop: 8, textAlign: 'center' }}>
            {placed ? `Thank you, ${order.customer_name.split(' ')[0]}.` : order.order_number}
          </Title>
          {placed ? (
            <T style={{ textAlign: 'center', marginTop: 10, lineHeight: 21, color: 'rgba(22,21,19,0.8)', fontSize: 14 }}>
              {email === 'failed'
                ? `Your order is placed and saved. We couldn't send the confirmation email to ${order.email} right now, so keep your order number below.`
                : `Your order has been placed. A confirmation email is on its way to ${order.email}.`}
            </T>
          ) : null}
        </View>

        <View style={styles.facts}>
          {[
            ['Order number', order.order_number],
            ['Date', formatDate(order.created_at)],
            ['Items', String(count)],
            ['Total', formatNaira(order.total)],
          ].map(([k, v]) => (
            <View key={k} style={styles.fact}>
              <Eyebrow style={{ fontSize: 10 }}>{k}</Eyebrow>
              <T style={{ fontFamily: F.medium, marginTop: 4 }}>{v}</T>
            </View>
          ))}
        </View>

        <Eyebrow style={{ color: C.ink, marginTop: 24, marginBottom: 8 }}>Jerseys</Eyebrow>
        <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line }}>
          {order.order_items.map((i) => (
            <View key={i.id} style={styles.item}>
              <Image source={storageUrl(i.image_path)} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <T style={{ fontSize: 14 }}>
                  {i.club_name} {KIT_LABELS[i.kit_type] ?? i.kit_type} Jersey
                </T>
                <T style={{ fontSize: 12, color: C.stone, marginTop: 2 }}>
                  Size {i.size} · Qty {i.quantity} · {formatNaira(i.unit_price)} each
                </T>
              </View>
              <T style={{ fontSize: 14 }}>{formatNaira(i.line_total)}</T>
            </View>
          ))}
        </View>
        <View style={{ alignSelf: 'flex-end', width: 220, marginTop: 10, gap: 4 }}>
          <View style={styles.sumRow}>
            <T style={{ color: C.stone, fontSize: 14 }}>Subtotal</T>
            <T style={{ fontSize: 14 }}>{formatNaira(order.subtotal)}</T>
          </View>
          <View style={styles.sumRow}>
            <T style={{ color: C.stone, fontSize: 14 }}>Delivery</T>
            <T style={{ fontSize: 14 }}>Free</T>
          </View>
          <View style={[styles.sumRow, { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8 }]}>
            <T>Total</T>
            <T style={{ fontFamily: F.medium }}>{formatNaira(order.total)}</T>
          </View>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: C.line, marginTop: 24, paddingTop: 18, gap: 16 }}>
          <View>
            <Eyebrow>Customer</Eyebrow>
            <T style={{ marginTop: 4 }}>{order.customer_name}</T>
            <T style={{ color: C.stone, fontSize: 14 }}>{order.email}</T>
            <T style={{ color: C.stone, fontSize: 14 }}>{order.phone}</T>
          </View>
          <View>
            <Eyebrow>Delivery address</Eyebrow>
            <T style={{ marginTop: 4 }}>{order.address}</T>
            <T style={{ color: C.stone, fontSize: 14 }}>
              {order.city}, {order.state}
            </T>
          </View>
        </View>

        <View style={{ gap: 10, marginTop: 28 }}>
          <Button label="Continue shopping" onPress={() => router.dismissTo('/shop')} />
          <Button variant="outline" label="My orders" onPress={() => router.dismissTo('/account')} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 1, backgroundColor: C.line, marginTop: 16 },
  fact: { backgroundColor: C.sand, padding: 12, flexGrow: 1, flexBasis: '45%' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  thumb: { width: 56, height: 56, backgroundColor: C.white },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
