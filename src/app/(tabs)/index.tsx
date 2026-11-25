import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image } from 'expo-image';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DatePicker } from '@/components/DatePicker';
import { Thumb } from '@/components/Cover';
import { VendorTile } from '@/components/VendorCard';
import {
  Card,
  Dots,
  IconBubble,
  IconButton,
  Notice,
  SearchBar,
  SectionHeader,
  Screen,
  Stepper,
  T,
} from '@/components/ui';
import { VENDORS } from '@/data/vendors';
import { formatDate } from '@/lib/format';
import { useStore } from '@/lib/store';
import { C, CAT, R, S, shadow } from '@/lib/theme';
import type { Category } from '@/lib/types';

const GAPS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'layers-outline',
    title: 'Stock-aware availability',
    body: 'Vendors list how many units they own. You only see what is free on your date.',
  },
  {
    icon: 'receipt-outline',
    title: 'One all-in price',
    body: 'Items, delivery, fuel and the caution deposit, shown before you book.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Clear cancellation',
    body: 'Refund tiers up front. A vendor no-show means a full refund.',
  },
  {
    icon: 'checkbox-outline',
    title: 'Count in, check out',
    body: 'A handover checklist settles damage fairly from the caution deposit.',
  },
  {
    icon: 'flash-outline',
    title: 'Power checks',
    body: 'Generator size, auto-changeover and fuel terms for every venue.',
  },
  {
    icon: 'star-half-outline',
    title: 'Reviews you can trust',
    body: 'Only completed bookings can review. Punctuality is scored separately.',
  },
];

const BANNERS = [
  {
    kicker: 'All-in pricing',
    title: 'Zero surprise fees',
    body: 'Delivery, fuel and caution deposit, all shown before you pay.',
    icon: 'receipt' as const,
    bg: C.brand,
  },
  {
    kicker: 'Protected bookings',
    title: 'No-show? Full refund.',
    body: 'Every vendor shows their refund tiers up front.',
    icon: 'shield-checkmark' as const,
    bg: '#2A2F4A',
  },
  {
    kicker: 'Verified only',
    title: 'Real reviews only',
    body: 'Only customers with a completed booking can review.',
    icon: 'star' as const,
    bg: '#3A3226',
  },
];

const CATS: Category[] = ['venue', 'rental', 'decor', 'planner'];

function Banners() {
  const [w, setW] = useState(0);
  const [i, setI] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (w) setI(Math.round(e.nativeEvent.contentOffset.x / w));
  };
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ marginBottom: S.xl }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}>
        {BANNERS.map((b) => (
          <View key={b.title} style={[styles.banner, { width: w || 1, backgroundColor: b.bg }]}>
            <View style={[styles.bannerCircle, { width: 180, height: 180, right: -40, top: -60 }]} />
            <View style={[styles.bannerCircle, { width: 110, height: 110, right: 60, bottom: -70 }]} />
            <View style={{ flex: 1, paddingRight: S.md }}>
              <View style={styles.kicker}>
                <T size={11} bold color={C.ink}>
                  {b.kicker.toUpperCase()}
                </T>
              </View>
              <T size={22} bold color="#fff" style={{ marginTop: S.sm }}>
                {b.title}
              </T>
              <T size={13} color="rgba(255,255,255,0.85)" style={{ marginTop: 2 }}>
                {b.body}
              </T>
            </View>
            <View style={styles.bannerIcon}>
              <Ionicons name={b.icon} size={30} color={C.goldDark} />
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={{ marginTop: S.md }}>
        <Dots count={BANNERS.length} active={i} />
      </View>
    </View>
  );
}

export default function Home() {
  const { eventDate, setEventDate, guests, setGuests, saved, bookings, vendorApp } = useStore();
  const top = [...VENDORS].sort((a, b) => b.rating - a.rating).slice(0, 6);

  return (
    <Screen safeTop bottom={80}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.lg }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('@/assets/images/logo-mark-light.png')}
              style={{ width: 18, height: 18, marginRight: 6 }}
              contentFit="contain"
              accessibilityLabel="Eventis logo"
            />
            <T size={13} color={C.sub}>
              Welcome to Eventis
            </T>
          </View>
          <T size={26} bold>
            Plan your event
          </T>
        </View>
        <View style={{ flexDirection: 'row', gap: S.sm }}>
          <IconButton
            icon="heart-outline"
            label="Saved vendors"
            badge={saved.length}
            onPress={() => router.push({ pathname: '/explore', params: { saved: '1' } })}
          />
          <IconButton icon="calendar-outline" label="My bookings" badge={bookings.length} onPress={() => router.push('/bookings')} />
        </View>
      </View>

      <SearchBar onPress={() => router.push({ pathname: '/explore', params: { focus: '1' } })} />

      {/* Categories */}
      <View style={styles.cats}>
        {CATS.map((id) => {
          const c = CAT[id];
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${c.plural}`}
              onPress={() => router.push({ pathname: '/explore', params: { cat: c.plural.toLowerCase() } })}
              style={({ pressed }) => [{ alignItems: 'center', flex: 1 }, pressed && { opacity: 0.8 }]}>
              <View style={[styles.catBubble, { backgroundColor: c.bg }]}>
                <Thumb category={id} photo={c.photo} size={58} radius={29} />
              </View>
              <T size={12} semi style={{ marginTop: 6 }}>
                {c.plural}
              </T>
            </Pressable>
          );
        })}
      </View>

      <Banners />

      {/* Event setup */}
      <Card style={{ paddingHorizontal: S.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.sm }}>
          <IconBubble icon="calendar" size={36} />
          <View style={{ flex: 1, marginLeft: S.md }}>
            <T bold>Your event</T>
            <T size={12} color={C.sub}>
              {eventDate ? formatDate(eventDate) : 'Pick a date to see who is free'}
            </T>
          </View>
        </View>
        <DatePicker value={eventDate} onChange={setEventDate} />
        <View style={styles.guestRow}>
          <View style={{ flex: 1 }}>
            <T semi>Guests</T>
            <T size={12} color={C.sub}>
              Tap the number to type it
            </T>
          </View>
          <Stepper value={guests} min={10} max={2000} step={10} editable label="guests" onChange={setGuests} />
        </View>
      </Card>

      {/* Top rated */}
      <SectionHeader title="Top rated" action="See all" onAction={() => router.push('/explore')} style={{ marginTop: S.lg }} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -S.lg }}
        contentContainerStyle={{ paddingHorizontal: S.lg, paddingBottom: S.lg, paddingTop: 2 }}>
        {top.map((v) => (
          <VendorTile key={v.id} vendor={v} />
        ))}
      </ScrollView>

      {/* Why Eventis */}
      <SectionHeader title="Why book on Eventis" style={{ marginTop: S.sm }} />
      <View style={styles.grid}>
        {GAPS.map((g) => (
          <View key={g.title} style={styles.gapTile}>
            <IconBubble icon={g.icon} size={38} />
            <T size={14} bold style={{ marginTop: S.md }}>
              {g.title}
            </T>
            <T size={12} color={C.sub} style={{ marginTop: 2 }}>
              {g.body}
            </T>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/partner')}
        style={({ pressed }) => [styles.vendorCta, pressed && { opacity: 0.9 }]}>
        <IconBubble icon="storefront-outline" size={44} bg="rgba(201, 162, 75, 0.2)" color={C.gold} />
        <View style={{ flex: 1, marginHorizontal: S.md }}>
          <T size={15} bold color="#fff">
            {vendorApp ? 'Your vendor application' : 'Own an events business?'}
          </T>
          <T size={12} color="rgba(255,255,255,0.75)">
            {vendorApp ? 'See where your verification is up to' : 'Get verified and start taking bookings'}
          </T>
        </View>
        <Ionicons name="arrow-forward" size={18} color={C.gold} />
      </Pressable>

      <Notice tone="brand" title="Demo app">
        Vendors, prices and payments are sample data. Nothing here charges real money.
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cats: { flexDirection: 'row', marginTop: S.xl, marginBottom: S.xl },
  catBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
    ...shadow.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: S.xl,
    height: 170,
    borderRadius: R.lg,
    overflow: 'hidden',
  },
  bannerCircle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(201, 162, 75, 0.16)' },
  kicker: {
    alignSelf: 'flex-start',
    backgroundColor: C.gold,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: R.pill,
  },
  bannerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: S.md,
    paddingTop: S.md,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md, marginBottom: S.lg },
  vendorCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.brand,
    borderRadius: R.lg,
    padding: S.lg,
    marginBottom: S.lg,
    ...shadow.brand,
  },
  gapTile: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.lg,
    ...shadow.sm,
  },
});
