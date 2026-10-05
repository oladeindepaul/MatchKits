import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SITE_URL } from '@/lib/format';
import { Field } from '@/components/field';
import { Button, Eyebrow, T, Title } from '@/components/ui';
import { C, GUTTER } from '@/constants/theme';

function friendly(message: string) {
  if (/invalid login credentials/i.test(message)) return "That email and password don't match. Try again, or email yourself a magic link.";
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first: open the link we sent when you registered.';
  if (/rate limit|too many/i.test(message)) return 'Too many attempts just now. Please wait a few minutes.';
  if (/network|fetch/i.test(message)) return "Can't reach MatchKit. Check your internet connection.";
  return message;
}

export default function LoginScreen() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [magicSent, setMagicSent] = useState(false);

  async function logIn() {
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setError(friendly(error.message));
    router.back();
    if (next === 'checkout') router.push('/checkout');
  }

  // The magic link opens the website, which logs you in there; on the phone, use your password.
  async function magicLink() {
    if (!email.trim()) return setError('Enter your email first.');
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: SITE_URL ? `${SITE_URL}/auth/callback` : undefined },
    });
    setBusy(false);
    if (error) return setError(friendly(error.message));
    setMagicSent(true);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.cream }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: GUTTER, paddingTop: 28, gap: 16 }}>
        <Title>Welcome back</Title>
        <T style={{ color: C.stone, fontSize: 14 }}>
          {next === 'checkout' ? 'Log in to complete your order.' : 'Use the same email and password as the MatchKit website.'}
        </T>

        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={logIn} returnKeyType="go" />

        {error ? <T style={{ color: C.danger, fontSize: 14 }}>{error}</T> : null}
        {magicSent ? <T style={{ color: C.accent, fontSize: 14 }}>Magic link sent to {email.trim()}. Check your inbox (and spam).</T> : null}

        <Button label="Log in" onPress={logIn} loading={busy} disabled={!email || !password} />

        <Pressable onPress={magicLink} style={{ alignItems: 'center', paddingVertical: 6 }}>
          <T style={{ color: C.accent, fontSize: 13 }}>Forgot your password? Email me a magic link</T>
        </Pressable>

        <View style={{ borderTopWidth: 1, borderTopColor: C.line, paddingTop: 20, marginTop: 8, alignItems: 'center', gap: 10 }}>
          <Eyebrow>New to MatchKit?</Eyebrow>
          <Button variant="outline" label="Create account" style={{ alignSelf: 'stretch' }} onPress={() => router.replace({ pathname: '/register', params: next ? { next } : {} })} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
