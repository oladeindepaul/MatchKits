import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SITE_URL } from '@/lib/format';
import { Field } from '@/components/field';
import { Button, Eyebrow, T, Title } from '@/components/ui';
import { C, GUTTER } from '@/constants/theme';

export default function RegisterScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function register() {
    if (name.trim().length < 2) return setError('Enter your full name.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setBusy(true);
    setError('');
    // Same sign-up as the website: Supabase emails a verification (magic) link that opens the website.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() }, emailRedirectTo: SITE_URL ? `${SITE_URL}/auth/callback` : undefined },
    });
    setBusy(false);
    if (error) return setError(/rate limit/i.test(error.message) ? 'Too many sign-ups just now. Please wait a few minutes.' : error.message);
    // If email confirmation is switched off in Supabase, the account is logged in straight away.
    if (data.session) {
      router.back();
      if (next === 'checkout') router.push('/checkout');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: C.cream, padding: GUTTER, paddingTop: 28, gap: 16 }}>
        <Eyebrow style={{ color: C.accent }}>Check your inbox</Eyebrow>
        <Title>Almost there</Title>
        <T style={{ lineHeight: 22 }}>
          We sent a verification link to <T style={{ fontFamily: 'Jost_600SemiBold' }}>{email.trim()}</T>. Open it to activate your account, then come back and log in
          with your email and password.
        </T>
        <Button label="Go to log in" onPress={() => router.replace({ pathname: '/login', params: next ? { next } : {} })} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.cream }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: GUTTER, paddingTop: 28, gap: 16 }}>
        <Title>Create account</Title>
        <T style={{ color: C.stone, fontSize: 14 }}>One account for the MatchKit app and website.</T>
        <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" />
        {error ? <T style={{ color: C.danger, fontSize: 14 }}>{error}</T> : null}
        <Button label="Create account" onPress={register} loading={busy} disabled={!name || !email || !password} />
        <T style={{ color: C.stone, fontSize: 12, textAlign: 'center' }}>We&apos;ll email you a magic link to verify your address.</T>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
