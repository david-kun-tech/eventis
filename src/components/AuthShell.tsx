import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, R, S } from '@/lib/theme';
import { T } from './ui';

const LOGO = require('@/assets/images/logo-mark-light.png');

/** Leave the auth flow for Home, dropping the auth screens (and the welcome slides) behind. */
export function leaveAuth() {
  if (router.canDismiss()) router.dismissAll();
  router.replace('/');
}

/** Shared frame for sign up and log in: back, logo, title, form, and a guest exit. */
export function AuthShell({
  title,
  subtitle,
  children,
  onGuest,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onGuest: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.top, { paddingTop: insets.top + S.sm }]}>
        {router.canGoBack() ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={8} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={C.ink} />
          </Pressable>
        ) : (
          <View style={{ width: 40, height: 40 }} />
        )}
        <Pressable accessibilityRole="button" onPress={onGuest} hitSlop={8}>
          <T size={14} semi color={C.goldDark}>
            Continue as guest
          </T>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + S.xxl }]}
        keyboardShouldPersistTaps="handled">
        <Image source={LOGO} style={styles.logo} contentFit="contain" accessibilityLabel="Eventis logo" />
        <T size={28} bold>
          {title}
        </T>
        <T size={14} color={C.sub} style={{ marginTop: 4, marginBottom: S.xl }}>
          {subtitle}
        </T>
        {children}
        <View style={styles.demo}>
          <Ionicons name="phone-portrait-outline" size={14} color={C.sub} />
          <T size={12} color={C.sub} style={{ flex: 1, marginLeft: 6 }}>
            Demo: accounts are saved only on this device. Passwords are stored as salted hashes, never as typed.
          </T>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingBottom: S.sm,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: S.xl, paddingTop: S.md, maxWidth: 480, width: '100%', alignSelf: 'center' },
  logo: { width: 56, height: 56, marginBottom: S.lg },
  demo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: S.xl,
    padding: S.md,
    borderRadius: R.md,
    backgroundColor: '#EFEBE2',
  },
});
