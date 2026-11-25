import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { naira } from '@/lib/format';
import { POLICIES } from '@/lib/policies';
import { useStore } from '@/lib/store';
import { C, CAT, R, S, shadow } from '@/lib/theme';
import type { Vendor } from '@/lib/types';
import { Cover } from './Cover';
import { Pill, Rating, T } from './ui';

export function startingPrice(v: Vendor) {
  return Math.min(...v.items.map((i) => i.price));
}

function cheapestUnit(v: Vendor) {
  return v.items.reduce((a, b) => (b.price < a.price ? b : a)).unit;
}

function SaveButton({ id }: { id: string }) {
  const { saved, toggleSaved } = useStore();
  const on = saved.includes(id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? 'Remove from saved' : 'Save vendor'}
      accessibilityState={{ selected: on }}
      onPress={() => toggleSaved(id)}
      hitSlop={6}
      style={({ pressed }) => [styles.heart, pressed && { transform: [{ scale: 0.92 }] }]}>
      <Ionicons name={on ? 'heart' : 'heart-outline'} size={18} color={on ? C.gold : C.ink} />
    </Pressable>
  );
}

function CategoryTag({ v }: { v: Vendor }) {
  const c = CAT[v.category];
  return (
    <View style={styles.tag}>
      <Ionicons name={c.icon} size={11} color={c.fg} style={{ marginRight: 4 }} />
      <T size={11} bold color={c.fg}>
        {c.label}
      </T>
    </View>
  );
}

/** Full-width listing card with cover art, as used in Explore. */
export function VendorCard({ vendor, dateOk }: { vendor: Vendor; dateOk?: boolean }) {
  const v = vendor;
  const r = v.reliability;
  return (
    <View style={{ marginBottom: S.lg }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${v.name}, ${v.area}, ${v.city}`}
        onPress={() => router.push(`/vendor/${v.id}`)}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}>
        <Cover category={v.category} seed={v.id} photo={v.photo} height={190} radius={R.lg - 4}>
          <View style={styles.coverTop}>
            <CategoryTag v={v} />
          </View>
          {dateOk !== undefined && (
            <View style={[styles.dateFlag, { backgroundColor: dateOk ? C.green : C.red }]}>
              <Ionicons
                name={dateOk ? 'checkmark-circle' : 'close-circle'}
                size={12}
                color="#fff"
                style={{ marginRight: 4 }}
              />
              <T size={11} bold color="#fff">
                {dateOk ? 'Free on your date' : 'Fully booked'}
              </T>
            </View>
          )}
        </Cover>

        <View style={{ paddingHorizontal: S.xs, paddingTop: S.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: S.md }}>
              <T size={17} bold lines={1}>
                {v.name}
              </T>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color={C.sub} />
                <T size={13} color={C.sub} style={{ marginLeft: 3 }} lines={1}>
                  {v.area}, {v.city}
                </T>
                {v.capacity ? (
                  <>
                    <View style={styles.dot} />
                    <Ionicons name="people-outline" size={13} color={C.sub} />
                    <T size={13} color={C.sub} style={{ marginLeft: 3 }}>
                      {v.capacity} guests
                    </T>
                  </>
                ) : null}
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={styles.metaRow}>
                <Ionicons name="time" size={13} color={C.goldDark} />
                <T size={13} semi style={{ marginLeft: 3, marginRight: S.sm }}>
                  {r.onTimePct}%
                </T>
                <Rating value={v.rating} count={v.ratingCount} />
              </View>
            </View>
          </View>

          <T size={13} color={C.sub} lines={2} style={{ marginTop: S.sm }}>
            {v.tagline}
          </T>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: S.sm }}>
            <Pill label={`${r.completed} jobs`} icon="checkmark-done-outline" />
            <Pill label={`${POLICIES[v.policy].label} cancellation`} icon="shield-checkmark-outline" tone="brand" />
          </View>

          <View style={styles.priceRow}>
            <T size={12} color={C.sub}>
              From
            </T>
            <T size={18} bold color={C.brand} style={{ marginLeft: 6 }}>
              {naira(startingPrice(v))}
            </T>
            <T size={12} color={C.sub}>
              {' '}
              / {cheapestUnit(v)}
            </T>
            <View style={{ flex: 1 }} />
            <View style={styles.arrow}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </View>
        </View>
      </Pressable>
      {/* Sibling, not child: a button may not sit inside another button on the web. */}
      <View style={[styles.heartSlot, { top: S.sm * 2, right: S.sm * 2 }]}>
        <SaveButton id={v.id} />
      </View>
    </View>
  );
}

/** Narrow card for horizontal carousels on Home. */
export function VendorTile({ vendor, width = 230 }: { vendor: Vendor; width?: number }) {
  const v = vendor;
  return (
    <View style={{ marginRight: S.md }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${v.name}, ${v.area}, ${v.city}`}
        onPress={() => router.push(`/vendor/${v.id}`)}
        style={({ pressed }) => [styles.tile, { width }, pressed && { opacity: 0.92 }]}>
        <Cover category={v.category} seed={v.id} photo={v.photo} height={130} radius={R.md}>
          <View style={styles.coverTop}>
            <CategoryTag v={v} />
          </View>
        </Cover>
        <View style={{ padding: S.sm, paddingTop: S.md }}>
          <T size={15} bold lines={1}>
            {v.name}
          </T>
          <View style={[styles.metaRow, { marginTop: 2 }]}>
            <Rating value={v.rating} count={v.ratingCount} size={12} />
          </View>
          <View style={[styles.metaRow, { marginTop: 4 }]}>
            <Ionicons name="location" size={12} color={C.goldDark} />
            <T size={12} color={C.sub} style={{ marginLeft: 3, flex: 1 }} lines={1}>
              {v.area}, {v.city}
            </T>
          </View>
          <T size={12} color={C.sub} style={{ marginTop: 6 }}>
            From{' '}
            <T size={14} bold color={C.ink}>
              {naira(startingPrice(v))}
            </T>
          </T>
        </View>
      </Pressable>
      <View style={[styles.heartSlot, { top: 6 + S.sm, right: 6 + S.sm }]}>
        <SaveButton id={v.id} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.sm,
    paddingBottom: S.md,
    ...shadow.md,
  },
  tile: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: 6,
    ...shadow.md,
  },
  coverTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: S.sm,
  },
  heartSlot: { position: 'absolute' },
  heart: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 26,
    borderRadius: R.pill,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  dateFlag: {
    position: 'absolute',
    left: S.sm,
    bottom: S.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 24,
    borderRadius: R.pill,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.faint, marginHorizontal: 6 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: S.xs,
    paddingTop: S.md,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
