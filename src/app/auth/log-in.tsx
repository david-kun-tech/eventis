import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AuthShell, leaveAuth } from '@/components/AuthShell';
import { Button, Field, Notice, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, S } from '@/lib/theme';

export default function LogIn() {
  const { logIn, finishOnboarding, accounts } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy || !email.trim() || !password) return;
    setBusy(true);
    const ok = await logIn(email, password);
    setBusy(false);
    setFailed(!ok);
    if (ok) leaveAuth();
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your bookings and saved vendors."
      onGuest={() => {
        finishOnboarding();
        leaveAuth();
      }}>
      {failed && (
        <Notice tone="bad" title="Email or password is incorrect">
          {accounts.length === 0 ? 'No accounts exist on this device yet. Create one instead.' : 'Check them and try again.'}
        </Notice>
      )}
      <Field
        label="Email"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setFailed(false);
        }}
        placeholder="amaka@example.com"
        keyboardType="email-address"
        autoComplete="email"
        returnKeyType="next"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setFailed(false);
        }}
        secure
        autoComplete="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <Button label={busy ? 'Logging in…' : 'Log in'} onPress={submit} disabled={busy || !email.trim() || !password} />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: S.lg }}>
        <T size={14} color={C.sub}>
          New to Eventis?{' '}
        </T>
        <Pressable accessibilityRole="link" onPress={() => router.replace('/auth/sign-up')} hitSlop={8}>
          <T size={14} semi color={C.brand} style={{ textDecorationLine: 'underline' }}>
            Create an account
          </T>
        </Pressable>
      </View>
    </AuthShell>
  );
}
