import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/auth';
import { useCart } from '@/providers/cart';
import { supabase } from '@/lib/supabase';
import { formatDate, formatNaira } from '@/lib/format';
import { Button, Empty, Eyebrow, T, Title } from '@/components/ui';
import { C, F, GUTTER } from '@/constants/theme';

type OrderRow = { id: string; order_number: string; created_at: string; total: number; status: string; order_items: { quantity: number }[] };

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { clearLocal } = useCart();
  const [name, setName] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: profile }, { data }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      supabase.from('orders').select('id, order_number, created_at, total, status, order_items(quantity)').order('created_at', { ascending: false }),
    ]);
    setName(profile?.full_name ?? null);
    setOrders((data as OrderRow[]) ?? []);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!user) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.cream, padding: GUTTER }}>
        <Title style={{ marginTop: 4, marginBottom: 20 }}>Account</Title>
        <Empty
          title="Welcome to MatchKit"
          message="Log in with the same account you use on the website. Your cart, wishlist and orders follow you."
          action={
            <View style={{ gap: 10, alignSelf: 'stretch' }}>
              <Button label="Log in" onPress={() => router.push('/login')} />
              <Button variant="outline" label="Create account" onPress={() => router.push('/register')} />
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.cream }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={C.ink}
          />
        }
        contentContainerStyle={{ padding: GUTTER, paddingBottom: 40 }}>
        <Eyebrow style={{ marginTop: 4 }}>My account</Eyebrow>
        <Title style={{ marginTop: 6 }}>{name || user.email}</Title>
        <T style={{ color: C.stone, marginTop: 4, fontSize: 14 }}>{user.email}</T>

        <Eyebrow style={{ color: C.ink, marginTop: 32, marginBottom: 10 }}>Orders</Eyebrow>
        {orders === null ? null : orders.length ? (
          <View style={styles.list}>
            {orders.map((o) => {
              const qty = o.order_items.reduce((n, i) => n + i.quantity, 0);
              return (
                <Pressable key={o.id} onPress={() => router.push({ pathname: '/order/[id]', params: { id: o.id } })} style={({ pressed }) => [styles.order, pressed && { backgroundColor: C.sand }]}>
                  <View style={{ flex: 1 }}>
                    <T style={{ fontFamily: F.medium }}>{o.order_number}</T>
                    <T style={styles.sub}>
                      {formatDate(o.created_at)} · {qty} jersey{qty === 1 ? '' : 's'} · {o.status}
                    </T>
                  </View>
                  <T>{formatNaira(o.total)}</T>
                  <Ionicons name="chevron-forward" size={16} color={C.stone} />
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Empty title="No orders yet." action={<Button variant="outline" label="Start shopping" onPress={() => router.navigate('/shop')} />} />
        )}

        <Pressable onPress={() => router.navigate('/wishlist')} style={styles.link}>
          <Ionicons name="heart-outline" size={18} color={C.ink} />
          <T style={{ flex: 1 }}>My wishlist</T>
          <Ionicons name="chevron-forward" size={16} color={C.stone} />
        </Pressable>
        <Pressable onPress={() => router.push('/leagues')} style={styles.link}>
          <Ionicons name="grid-outline" size={18} color={C.ink} />
          <T style={{ flex: 1 }}>Leagues & clubs</T>
          <Ionicons name="chevron-forward" size={16} color={C.stone} />
        </Pressable>

        <Button
          variant="outline"
          label="Sign out"
          style={{ marginTop: 28 }}
          onPress={async () => {
            await signOut();
            clearLocal(); // the cart stays saved in the account
            setOrders(null);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  order: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  sub: { fontSize: 12, color: C.stone, marginTop: 2, textTransform: 'capitalize' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line, marginTop: 8 },
});
