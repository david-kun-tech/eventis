import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { Button, Dots, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { C, CAT, R, S } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const LOGO = require('@/assets/images/logo-mark-light.png');

const SLIDES: { title: string; body: string; art: 'vendors' | 'price' | 'track'; floats: [IconName, IconName, IconName] }[] = [
  {
    title: 'Find vendors you can trust',
    body: 'Venues, rentals, decor and planners, with verified reviews and real on-time records.',
    art: 'vendors',
    floats: ['heart', 'star', 'sparkles'],
  },
  {
    title: 'See the full price first',
    body: 'Delivery, generator fuel and the refundable caution deposit, all shown before you book.',
    art: 'price',
    floats: ['pricetag', 'shield-checkmark', 'wallet'],
  },
  {
    title: 'Keep track of every booking',
    body: 'Pay deposits, count items at drop-off and settle returns fairly, all in one place.',
    art: 'track',
    floats: ['calendar', 'checkmark-circle', 'notifications'],
  },
];

function Line({ w, strong }: { w: number | `${number}%`; strong?: boolean }) {
  return <View style={{ height: 8, width: w, borderRadius: 4, backgroundColor: strong ? C.ink : C.line, marginTop: 6 }} />;
}

/** The mini "phone card" at the centre of each illustration. */
function ArtCard({ art }: { art: (typeof SLIDES)[number]['art'] }) {
  if (art === 'vendors') {
    const c = CAT.venue;
    return (
      <>
        <View style={[styles.artCover, { backgroundColor: c.bg }]}>
          <View style={[styles.artBlob, { backgroundColor: c.deep }]} />
          <Ionicons name={c.icon} size={30} color={c.fg} />
        </View>
        <Line w="80%" strong />
        <Line w="55%" />
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Ionicons key={i} name="star" size={12} color={C.gold} />
          ))}
        </View>
      </>
    );
  }
  if (art === 'price') {
    return (
      <>
        <T size={11} bold color={C.sub}>
          ALL-IN PRICE
        </T>
        {[
          ['Chairs × 150', '₦45,000'],
          ['Delivery', '₦8,000'],
          ['Fuel', '₦12,000'],
          ['Caution', '₦9,000'],
        ].map(([a, b]) => (
          <View key={a} style={styles.receiptRow}>
            <T size={11} color={C.sub}>
              {a}
            </T>
            <T size={11} semi>
              {b}
            </T>
          </View>
        ))}
        <View style={styles.receiptTotal}>
          <T size={11} bold color="#fff">
            Total
          </T>
          <T size={12} bold color="#fff">
            ₦74,000
          </T>
        </View>
      </>
    );
  }
  return (
    <>
      <T size={11} bold color={C.sub}>
        YOUR BOOKING
      </T>
      {['Request sent', 'Deposit paid', 'Items counted'].map((label, i) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <View style={[styles.tick, i === 2 && { backgroundColor: C.brandSoft }]}>
            <Ionicons name={i === 2 ? 'ellipsis-horizontal' : 'checkmark'} size={10} color={i === 2 ? C.brand : '#fff'} />
          </View>
          <T size={11} semi={i < 2} color={i < 2 ? C.ink : C.sub} style={{ marginLeft: 8 }}>
            {label}
          </T>
        </View>
      ))}
      <View style={[styles.receiptTotal, { marginTop: 14 }]}>
        <T size={11} bold color="#fff">
          Return check
        </T>
        <Ionicons name="arrow-forward" size={12} color="#fff" />
      </View>
    </>
  );
}

function Illustration({ slide }: { slide: (typeof SLIDES)[number] }) {
  const [a, b, c] = slide.floats;
  return (
    <View style={styles.art} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={styles.halo} />
      <View style={styles.ring} />
      {[
        { left: '12%', top: '18%', s: 10 },
        { left: '84%', top: '30%', s: 8 },
        { left: '20%', top: '82%', s: 7 },
        { left: '78%', top: '86%', s: 12 },
        { left: '50%', top: '4%', s: 6 },
      ].map((d, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: d.left as `${number}%`,
            top: d.top as `${number}%`,
            width: d.s,
            height: d.s,
            borderRadius: d.s,
            backgroundColor: i % 2 ? C.gold : C.brand,
            opacity: 0.5,
          }}
        />
      ))}
      <View style={styles.card}>
        <ArtCard art={slide.art} />
      </View>
      <View style={[styles.float, { left: '6%', top: '30%' }]}>
        <Ionicons name={a} size={22} color={C.brand} />
      </View>
      <View style={[styles.float, { right: '6%', top: '14%', width: 44, height: 44 }]}>
        <Ionicons name={b} size={20} color={C.gold} />
      </View>
      <View style={[styles.float, { right: '10%', bottom: '10%' }]}>
        <Ionicons name={c} size={22} color={C.green} />
      </View>
    </View>
  );
}

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { finishOnboarding } = useStore();
  const scroller = useRef<ScrollViewInstance>(null);
  const [{ w, h }, setSize] = useState({ w: 0, h: 0 });
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;

  const done = () => {
    finishOnboarding();
    router.replace('/');
  };
  const next = () => {
    if (last) return router.push({ pathname: '/auth/sign-up', params: { from: 'welcome' } });
    scroller.current?.scrollTo({ x: (i + 1) * w, animated: true });
    setI(i + 1);
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (w) setI(Math.round(e.nativeEvent.contentOffset.x / w));
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, S.lg) }}>
      <View style={styles.inner}>
        <View style={styles.top}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image source={LOGO} style={{ width: 30, height: 30 }} contentFit="contain" accessibilityLabel="Eventis logo" />
            <T size={17} bold style={{ marginLeft: 8 }}>
              Eventis
            </T>
          </View>
          <Pressable onPress={done} hitSlop={10} accessibilityRole="button">
            <T size={14} semi color={C.goldDark}>
              Continue as guest
            </T>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          <ScrollView
            ref={scroller}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={32}>
            {SLIDES.map((s) => (
              <View key={s.title} style={{ width: w || 1, height: h || undefined, paddingHorizontal: S.xl, justifyContent: 'center' }}>
                <Illustration slide={s} />
                <T size={26} bold center style={{ marginTop: S.xl }}>
                  {s.title}
                </T>
                <T size={15} color={C.sub} center style={{ marginTop: S.sm, paddingHorizontal: S.sm }}>
                  {s.body}
                </T>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: S.xl }}>
          <Dots count={SLIDES.length} active={i} />
          <View style={{ height: S.xl }} />
          <Button label={last ? 'Create account' : 'Next'} icon={last ? 'sparkles' : undefined} onPress={next} />
          {last ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: S.md }}>
              <T size={14} color={C.sub}>
                Already have an account?{' '}
              </T>
              <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/auth/log-in', params: { from: 'welcome' } })} hitSlop={8}>
                <T size={14} semi color={C.brand} style={{ textDecorationLine: 'underline' }}>
                  Log in
                </T>
              </Pressable>
            </View>
          ) : (
            <T size={12} color={C.faint} center style={{ marginTop: S.md }}>
              Demo app · sample vendors, no real payments
            </T>
          )}
        </View>
      </View>
    </View>
  );
}

const ART = 280;

const styles = StyleSheet.create({
  inner: { flex: 1, maxWidth: 520, width: '100%', alignSelf: 'center' },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
  },
  art: { width: ART, height: ART, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  halo: {
    position: 'absolute',
    width: ART * 0.92,
    height: ART * 0.92,
    borderRadius: ART,
    backgroundColor: C.goldSoft,
  },
  ring: {
    position: 'absolute',
    width: ART,
    height: ART,
    borderRadius: ART,
    borderWidth: 1.5,
    borderColor: '#E3D7BC',
    borderStyle: 'dashed',
  },
  card: {
    width: 150,
    padding: S.md,
    backgroundColor: C.card,
    borderRadius: R.lg,
    transform: [{ rotate: '-6deg' }],
    boxShadow: '0px 18px 40px rgba(20, 22, 40, 0.16)',
  },
  artCover: {
    height: 74,
    borderRadius: R.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 4,
  },
  artBlob: { position: 'absolute', width: 90, height: 90, borderRadius: 45, top: -40, right: -30 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  receiptTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.brand,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 10,
  },
  tick: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  float: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 8px 20px rgba(20, 22, 40, 0.12)',
  },
});
