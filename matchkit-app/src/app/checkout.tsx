import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/auth';
import { useCart } from '@/providers/cart';
import { supabase } from '@/lib/supabase';
import { formatNaira, KIT_LABELS, NIGERIAN_STATES, SITE_URL } from '@/lib/format';
import { Field } from '@/components/field';
import { Button, Empty, Eyebrow, T } from '@/components/ui';
import { C, F, GUTTER } from '@/constants/theme';

type Values = { name: string; email: string; phone: string; address: string; city: string; state: string };
type Errors = Partial<Record<keyof Values, string>>;

export default function CheckoutScreen() {
  const { user, session } = useAuth();
  const { lines, subtotal, clearLocal, refresh } = useCart();
  const [values, setValues] = useState<Values>({ name: '', email: user?.email ?? '', phone: '', address: '', city: '', state: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [statePicker, setStatePicker] = useState(false);

  // Prefill from the shopper's profile, as on the website.
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) =>
        setValues((v) => ({ ...v, name: v.name || data?.full_name || (user.user_metadata?.full_name as string) || '', phone: v.phone || data?.phone || '' }))
      );
  }, [user]);

  if (!user) return <Empty title="Please log in to check out." action={<Button label="Log in" onPress={() => router.replace({ pathname: '/login', params: { next: 'checkout' } })} />} />;
  if (lines.length === 0) return <Empty title="Your cart is empty." action={<Button variant="outline" label="Browse jerseys" onPress={() => router.navigate('/shop')} />} />;

  const set = (key: keyof Values) => (text: string) => {
    setValues((v) => ({ ...v, [key]: text }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  // The order is placed by the website's /api/checkout (same rules, database prices and confirmation email).
  async function placeOrder() {
    if (!SITE_URL) return setError('Checkout is not configured (EXPO_PUBLIC_SITE_URL is missing).');
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${SITE_URL}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ ...values, lines: lines.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity })) }),
      });
      const result = await res.json();
      if (!result.ok) {
        setError(result.error ?? 'Could not place your order.');
        setErrors(result.fields ?? {});
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearLocal();
      refresh();
      router.replace({ pathname: '/order/[id]', params: { id: result.orderId, placed: '1', email: result.emailSent ? 'sent' : 'failed' } });
    } catch {
      setError("Can't reach MatchKit. Check your internet connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: GUTTER, paddingBottom: 48, gap: 14 }}>
        <Eyebrow style={{ color: C.ink }}>Contact</Eyebrow>
        <Field label="Full name" value={values.name} onChangeText={set('name')} error={errors.name} autoComplete="name" />
        <Field label="Email (for your confirmation)" value={values.email} onChangeText={set('email')} error={errors.email} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Phone" value={values.phone} onChangeText={set('phone')} error={errors.phone} keyboardType="phone-pad" placeholder="080 0000 0000" autoComplete="tel" />

        <Eyebrow style={{ color: C.ink, marginTop: 10 }}>Delivery</Eyebrow>
        <Field label="Street address" value={values.address} onChangeText={set('address')} error={errors.address} autoComplete="street-address" />
        <Field label="City / town" value={values.city} onChangeText={set('city')} error={errors.city} />
        <View style={{ gap: 6 }}>
          <Eyebrow>State</Eyebrow>
          <Pressable onPress={() => setStatePicker(true)} style={[styles.select, errors.state ? { borderColor: C.danger } : null]}>
            <T style={{ color: values.state ? C.ink : C.stone, fontSize: 16 }}>{values.state || 'Choose a state'}</T>
            <Ionicons name="chevron-down" size={16} color={C.ink} />
          </Pressable>
          {errors.state ? <T style={{ color: C.danger, fontSize: 12 }}>{errors.state}</T> : null}
        </View>

        <View style={styles.note}>
          <Eyebrow style={{ marginBottom: 4 }}>Payment</Eyebrow>
          <T style={{ fontSize: 13, lineHeight: 19 }}>No online payment is taken. Placing your order reserves your jerseys; we&apos;ll contact you to arrange payment and delivery.</T>
        </View>

        <View style={styles.summary}>
          <Eyebrow style={{ color: C.ink, marginBottom: 10 }}>Your order</Eyebrow>
          {lines.map((l) => (
            <View key={`${l.productId}-${l.size}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: 10 }}>
              <T style={{ fontSize: 13, flex: 1 }} numberOfLines={1}>
                {l.quantity} × {l.clubName} {KIT_LABELS[l.kitType] ?? ''} · {l.size}
              </T>
              <T style={{ fontSize: 13 }}>{formatNaira(l.price * l.quantity)}</T>
            </View>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.line, marginTop: 8, paddingTop: 10 }}>
            <T style={{ fontSize: 16 }}>Total (free delivery)</T>
            <T style={{ fontSize: 16, fontFamily: F.medium }}>{formatNaira(subtotal)}</T>
          </View>
        </View>

        {error ? <T style={{ color: C.danger, fontSize: 14 }}>{error}</T> : null}
        <Button label={`Place order · ${formatNaira(subtotal)}`} onPress={placeOrder} loading={busy} />
      </ScrollView>

      <Modal visible={statePicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setStatePicker(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.cream }}>
          <View style={styles.sheetHead}>
            <Eyebrow style={{ color: C.ink }}>Choose your state</Eyebrow>
            <Pressable onPress={() => setStatePicker(false)} hitSlop={10}>
              <Ionicons name="close" size={22} color={C.ink} />
            </Pressable>
          </View>
          <ScrollView>
            {NIGERIAN_STATES.map((s) => (
              <Pressable
                key={s}
                onPress={() => {
                  set('state')(s);
                  setStatePicker(false);
                }}
                style={({ pressed }) => [styles.stateRow, pressed && { backgroundColor: C.sand }]}>
                <T>{s}</T>
                {values.state === s && <Ionicons name="checkmark" size={18} color={C.accent} />}
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.line, backgroundColor: C.paper, paddingHorizontal: 14, paddingVertical: 13 },
  note: { borderWidth: 1, borderColor: C.line, backgroundColor: C.paper, padding: 14, marginTop: 6 },
  summary: { backgroundColor: C.sand, padding: 16 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: GUTTER, borderBottomWidth: 1, borderBottomColor: C.line },
  stateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: GUTTER, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
});
