import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Divider, EmptyState, IconBubble, Screen, T } from '@/components/ui';
import { initials } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { C, S } from '@/lib/theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function MenuRow({
  icon,
  label,
  detail,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <IconBubble icon={icon} size={36} />
      <T size={15} semi style={{ flex: 1, marginLeft: S.md }}>
        {label}
      </T>
      {detail ? (
        <T size={13} color={C.sub} style={{ marginRight: S.sm }}>
          {detail}
        </T>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={C.faint} />
    </Pressable>
  );
}

export default function AccountScreen() {
  const { user, logOut, deleteAccount, bookings, saved, vendorApp } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) {
    return (
      <Screen>
        <EmptyState
          icon="person-circle-outline"
          title="You're browsing as a guest"
          body="Create an account to keep your bookings and saved vendors together."
          action={
            <View style={{ alignSelf: 'stretch', gap: S.sm }}>
              <Button label="Create account" onPress={() => router.push('/auth/sign-up')} />
              <Button label="Log in" kind="secondary" onPress={() => router.push('/auth/log-in')} />
            </View>
          }
        />
      </Screen>
    );
  }

  const since = new Date(user.createdAt);
  return (
    <Screen>
      <View style={{ alignItems: 'center', marginBottom: S.xl }}>
        <View style={styles.avatar}>
          <T size={30} bold color={C.gold}>
            {initials(user.name)}
          </T>
        </View>
        <T size={22} bold style={{ marginTop: S.md }}>
          {user.name}
        </T>
        <T size={13} color={C.sub}>
          Member since {MONTHS[since.getMonth()]} {since.getFullYear()}
        </T>
      </View>

      <Card style={{ paddingVertical: S.sm }}>
        <View style={styles.detail}>
          <T size={13} color={C.sub}>
            Email
          </T>
          <T size={14} semi>
            {user.email}
          </T>
        </View>
        <Divider />
        <View style={styles.detail}>
          <T size={13} color={C.sub}>
            Phone
          </T>
          <T size={14} semi color={user.phone ? C.ink : C.faint}>
            {user.phone || 'Not added'}
          </T>
        </View>
      </Card>

      <Card style={{ paddingVertical: S.xs }}>
        <MenuRow icon="calendar-outline" label="My bookings" detail={String(bookings.length)} onPress={() => router.push('/bookings')} />
        <Divider />
        <MenuRow
          icon="heart-outline"
          label="Saved vendors"
          detail={String(saved.length)}
          onPress={() => router.push({ pathname: '/explore', params: { saved: '1' } })}
        />
        <Divider />
        <MenuRow
          icon="storefront-outline"
          label={vendorApp ? 'Your vendor application' : 'Become a vendor'}
          onPress={() => router.push('/partner')}
        />
      </Card>

      <View style={{ height: S.sm }} />
      <Button
        label="Log out"
        kind="secondary"
        icon="log-out-outline"
        onPress={() => {
          logOut();
          router.replace('/');
        }}
      />
      <View style={{ height: S.sm }} />
      <Button
        label={confirmDelete ? 'Tap again to remove this account' : 'Remove account from this device'}
        kind={confirmDelete ? 'danger' : 'ghost'}
        icon="trash-outline"
        onPress={() => {
          if (!confirmDelete) return setConfirmDelete(true);
          deleteAccount();
          router.replace('/');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detail: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: S.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.sm },
});
