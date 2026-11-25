import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AuthShell, leaveAuth } from '@/components/AuthShell';
import { Button, Field, T } from '@/components/ui';
import { passwordRules, type SignUpProblems } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { C, S } from '@/lib/theme';

export default function SignUp() {
  const { signUp, finishOnboarding } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<SignUpProblems>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    const problems = await signUp({ name, email, phone, password });
    setBusy(false);
    setErrors(problems);
    if (Object.keys(problems).length === 0) leaveAuth();
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save vendors, track bookings and get verified as a vendor."
      onGuest={() => {
        finishOnboarding();
        leaveAuth();
      }}>
      <Field label="Full name" value={name} onChangeText={setName} placeholder="Amaka Obi" autoCapitalize="words" autoComplete="name" returnKeyType="next" error={errors.name} />
      <Field label="Email" value={email} onChangeText={setEmail} placeholder="amaka@example.com" keyboardType="email-address" autoComplete="email" returnKeyType="next" error={errors.email} />
      <Field
        label="Phone"
        optional
        value={phone}
        onChangeText={setPhone}
        placeholder="0803 123 4567"
        keyboardType="phone-pad"
        autoComplete="tel"
        returnKeyType="next"
        error={errors.phone}
        hint="For booking updates from vendors."
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={errors.password}
      />
      <View style={{ marginTop: -S.sm, marginBottom: S.lg }}>
        {passwordRules(password).map((r) => (
          <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={r.ok ? C.green : C.faint} />
            <T size={12} color={r.ok ? C.green : C.sub} style={{ marginLeft: 6 }}>
              {r.label}
            </T>
          </View>
        ))}
      </View>

      <Button label={busy ? 'Creating account…' : 'Create account'} onPress={submit} disabled={busy} />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: S.lg }}>
        <T size={14} color={C.sub}>
          Already have an account?{' '}
        </T>
        <Pressable accessibilityRole="link" onPress={() => router.replace('/auth/log-in')} hitSlop={8}>
          <T size={14} semi color={C.brand} style={{ textDecorationLine: 'underline' }}>
            Log in
          </T>
        </Pressable>
      </View>
    </AuthShell>
  );
}
