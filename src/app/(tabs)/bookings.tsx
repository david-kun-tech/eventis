import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Thumb } from '@/components/Cover';
import { Button, EmptyState, PageTitle, Pill, Screen, T } from '@/components/ui';
import { getVendor } from '@/data/vendors';
import { daysUntil, formatDate, naira } from '@/lib/format';
import { useStore } from '@/lib/store';
import { C, R, S, shadow } from '@/lib/theme';
import type { BookingStatus } from '@/lib/types';

export const STATUS_LABEL: Record<BookingStatus, { label: string; tone: 'neutral' | 'good' | 'warn' | 'bad' | 'brand' }> = {
  requested: { label: 'Awaiting vendor', tone: 'warn' },
  accepted: { label: 'Accepted: pay deposit', tone: 'brand' },
  deposit_paid: { label: 'Deposit paid', tone: 'good' },
  fully_paid: { label: 'Fully paid', tone: 'good' },
  delivered: { label: 'Delivered', tone: 'brand' },
  completed: { label: 'Completed', tone: 'good' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  vendor_no_show: { label: 'Vendor no-show: refunded', tone: 'bad' },
};

const PAST: BookingStatus[] = ['completed', 'cancelled', 'vendor_no_show'];

export default function Bookings() {
  const { bookings, reset } = useStore();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const shown = bookings.filter((b) => (tab === 'past') === PAST.includes(b.status));
  const activeCount = bookings.filter((b) => !PAST.includes(b.status)).length;

  if (bookings.length === 0) {
    return (
      <Screen safeTop bottom={80}>
        <PageTitle title="My bookings" />
        <EmptyState
          icon="calendar-outline"
          title="No bookings yet"
          body="Pick a vendor and send a request. You will see the full price and terms first."
          action={<Button label="Browse vendors" icon="compass-outline" onPress={() => router.push('/explore')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen safeTop bottom={80}>
      <PageTitle title="My bookings" subtitle={`${activeCount} in progress · ${bookings.length - activeCount} past`} />

      <View style={styles.segment} accessibilityRole="tablist">
        {(['active', 'past'] as const).map((k) => (
          <Pressable
            key={k}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === k }}
            onPress={() => setTab(k)}
            style={[styles.segBtn, tab === k && styles.segOn]}>
            <T size={14} semi color={tab === k ? C.brand : C.sub}>
              {k === 'active' ? 'In progress' : 'Past'}
            </T>
          </Pressable>
        ))}
      </View>

      {shown.length === 0 ? (
        <EmptyState
          icon={tab === 'active' ? 'hourglass-outline' : 'archive-outline'}
          title={tab === 'active' ? 'Nothing in progress' : 'No past bookings'}
          body={tab === 'active' ? 'New requests will show up here.' : 'Finished and cancelled bookings land here.'}
        />
      ) : (
        shown.map((b) => {
          const v = getVendor(b.vendorId)!;
          const s = STATUS_LABEL[b.status];
          const d = daysUntil(b.dateISO);
          return (
            <Pressable
              key={b.id}
              accessibilityRole="button"
              accessibilityLabel={`${v.name}, ${formatDate(b.dateISO)}, ${s.label}`}
              onPress={() => router.push(`/booking/${b.id}`)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Thumb category={v.category} photo={v.photo} size={60} />
                <View style={{ flex: 1, marginLeft: S.md }}>
                  <T size={16} bold lines={1}>
                    {v.name}
                  </T>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Ionicons name="calendar-outline" size={13} color={C.sub} />
                    <T size={13} color={C.sub} style={{ marginLeft: 4 }}>
                      {formatDate(b.dateISO)}
                      {!PAST.includes(b.status) && d >= 0 ? ` · in ${d} ${d === 1 ? 'day' : 'days'}` : ''}
                    </T>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.faint} />
              </View>
              <View style={styles.cardFoot}>
                <View style={{ flex: 1, flexDirection: 'row' }}>
                  <Pill label={s.label} tone={s.tone} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T size={11} color={C.faint}>
                    Ref {b.id}
                  </T>
                  <T size={16} bold>
                    {naira(b.breakdown.total)}
                  </T>
                </View>
              </View>
            </Pressable>
          );
        })
      )}

      <View style={{ height: S.md }} />
      <Button label="Clear demo data" kind="ghost" icon="refresh-outline" onPress={reset} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: '#EEEADF',
    borderRadius: R.pill,
    padding: 4,
    marginBottom: S.lg,
  },
  segBtn: { flex: 1, height: 40, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: C.card, ...shadow.sm },
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.md,
    marginBottom: S.md,
    ...shadow.md,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: S.md,
    paddingTop: S.md,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
});
