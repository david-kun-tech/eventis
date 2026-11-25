import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Thumb } from '@/components/Cover';
import {
  Button,
  Card,
  Divider,
  IconBubble,
  Notice,
  NumberInput,
  PageTitle,
  Screen,
  SectionHeader,
  Stepper,
  T,
} from '@/components/ui';
import { PLANNER_RULES as P } from '@/data/vendors';
import { naira } from '@/lib/format';
import { powerPlan } from '@/lib/power';
import { useStore } from '@/lib/store';
import { C, F, R, S, shadow } from '@/lib/theme';

function PowerOption({
  icon,
  title,
  body,
  onPress,
  thumb,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  onPress: () => void;
  thumb?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && { opacity: 0.85 }]}>
      {thumb ?? <IconBubble icon={icon ?? 'flash'} size={40} />}
      <View style={{ flex: 1, marginHorizontal: S.md }}>
        <T size={14} semi>
          {title}
        </T>
        <T size={12} color={C.sub}>
          {body}
        </T>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.faint} />
    </Pressable>
  );
}

export default function Plan() {
  const { guests, setGuests, vendors } = useStore();
  const [hours, setHours] = useState(6);
  const tables = Math.ceil(guests / P.guestsPerTable);
  const toilets = Math.ceil(guests / P.guestsPerToilet);
  const canopies = Math.ceil(guests / P.guestsPerCanopy);
  const power = powerPlan(guests, hours, vendors);
  const poweredVenues = power.venues.fuelIncluded.length + power.venues.fuelExtra.length;

  const needs: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    qty: string;
    note: string;
    cat: string;
  }[] = [
    { icon: 'people-outline', label: 'Chairs', qty: String(guests), note: 'One per guest', cat: 'rentals' },
    { icon: 'restaurant-outline', label: 'Round tables', qty: String(tables), note: `${P.guestsPerTable} guests per table`, cat: 'rentals' },
    { icon: 'water-outline', label: 'Toilets (outdoor)', qty: String(toilets), note: `About 1 per ${P.guestsPerToilet} guests`, cat: 'rentals' },
    { icon: 'umbrella-outline', label: 'Canopies (outdoor)', qty: String(canopies), note: `1 per ${P.guestsPerCanopy} guests`, cat: 'rentals' },
    { icon: 'business-outline', label: 'Venue capacity', qty: `${Math.ceil(guests * 1.1)}+`, note: 'Guests plus 10% buffer', cat: 'venues' },
  ];

  const fits = vendors.filter((v) => v.category === 'venue' && (v.capacity ?? 0) >= guests * 1.1).length;

  return (
    <Screen safeTop bottom={80}>
      <PageTitle title="Plan my event" subtitle="A starting checklist sized to your guest list" />

      <View style={styles.hero}>
        <View style={[styles.circle, { width: 200, height: 200, right: -60, top: -80 }]} />
        <View style={[styles.circle, { width: 120, height: 120, left: -40, bottom: -60 }]} />
        <T size={13} semi color={C.gold}>
          GUEST COUNT
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NumberInput
              value={guests}
              onCommit={setGuests}
              min={10}
              max={2000}
              label="Guest count"
              style={styles.heroInput}
            />
            <Ionicons name="pencil" size={16} color={C.gold} style={{ marginLeft: S.sm }} />
          </View>
          <Stepper light hideValue value={guests} min={10} max={2000} step={10} label="guests" onChange={setGuests} />
        </View>
        <T size={13} color="rgba(255,255,255,0.8)" style={{ marginTop: S.xs }}>
          Tap the number to type it · ≈ {tables} tables
        </T>
      </View>

      <Notice tone="warn" title="Rules of thumb, not guarantees">
        Ratios vary by event style. Confirm quantities with your vendors.
      </Notice>

      <SectionHeader title="What you'll need" style={{ marginTop: S.sm }} />
      <View style={styles.grid}>
        {needs.map((n) => (
          <Pressable
            key={n.label}
            accessibilityRole="button"
            accessibilityLabel={`${n.label}: ${n.qty}. Find vendors`}
            onPress={() => router.push({ pathname: '/explore', params: { cat: n.cat } })}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.88 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <IconBubble icon={n.icon} size={38} />
              <Ionicons name="arrow-forward" size={16} color={C.faint} />
            </View>
            <T size={22} bold color={C.brandDark} style={{ marginTop: S.md }}>
              {n.qty}
            </T>
            <T size={14} semi>
              {n.label}
            </T>
            <T size={12} color={C.sub}>
              {n.note}
            </T>
          </Pressable>
        ))}
      </View>

      {/* Power, in words a host can act on */}
      <SectionHeader title="Power for your event" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconBubble icon="flash" size={44} />
          <View style={{ flex: 1, marginLeft: S.md }}>
            <T size={16} bold>
              {power.size} generator
            </T>
            <T size={13} color={C.sub}>
              {power.runs}
            </T>
          </View>
        </View>
        <View style={styles.kvaNote}>
          <Ionicons name="information-circle-outline" size={14} color={C.sub} />
          <T size={12} color={C.sub} style={{ flex: 1, marginLeft: 6 }}>
            Vendors size generators in kVA. Ask for at least{' '}
            <T size={12} semi>
              {power.kva} kVA
            </T>
            .
          </T>
        </View>

        <Divider style={{ marginVertical: S.md }} />

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <T semi>How long will it run?</T>
            <T size={12} color={C.sub}>
              Include setup and teardown
            </T>
          </View>
          <Stepper value={hours} min={1} max={24} label="event hours" suffix="hrs" onChange={setHours} />
        </View>

        <View style={styles.fuelBox}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <T size={13} color={C.sub} style={{ marginRight: 6 }}>
              About
            </T>
            <T size={20} bold>
              {naira(power.fuelCost)}
            </T>
            <T size={13} color={C.sub} style={{ marginLeft: 6 }}>
              in diesel
            </T>
          </View>
          <T size={12} color={C.sub}>
            About {power.litresPerHour} litres an hour, so {power.fuelLitres} litres for {hours}{' '}
            {hours === 1 ? 'hour' : 'hours'}. Only matters when fuel is not included.
          </T>
          <T size={11} color={C.faint} style={{ marginTop: 4 }}>
            Assumes diesel at {naira(P.dieselPerLitre)} a litre. Pump prices change often.
          </T>
        </View>

        <T size={13} semi color={C.sub} style={{ marginTop: S.lg, marginBottom: S.sm }}>
          WAYS TO GET IT
        </T>
        {poweredVenues > 0 ? (
          <PowerOption
            icon="business"
            title={`Book a venue with power (${poweredVenues})`}
            body={
              power.venues.fuelIncluded.length > 0
                ? `${power.venues.fuelIncluded.length} include fuel in the hall price`
                : 'Generator on site, fuel charged on top'
            }
            onPress={() => router.push({ pathname: '/explore', params: { cat: 'venues' } })}
          />
        ) : (
          <PowerOption
            icon="business-outline"
            title="No listed venue has enough power"
            body="Plan to rent generators alongside your venue"
            onPress={() => router.push({ pathname: '/explore', params: { cat: 'venues' } })}
          />
        )}
        {power.rental && (
          <PowerOption
            thumb={<Thumb category={power.rental.vendor.category} photo={power.rental.vendor.photo} size={40} radius={12} />}
            title={`Rent ${power.rental.units} × ${power.rental.item.kva} kVA from ${naira(power.rental.cost)}`}
            body={`${power.rental.vendor.name}${power.rental.item.fuelIncluded ? ', fuel included' : ''}`}
            onPress={() => router.push(`/vendor/${power.rental!.vendor.id}`)}
          />
        )}
      </Card>

      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconBubble icon="business" bg={C.greenSoft} color={C.green} size={44} />
        <View style={{ flex: 1, marginLeft: S.md }}>
          <T bold>
            {fits} {fits === 1 ? 'venue fits' : 'venues fit'} this crowd
          </T>
          <T size={12} color={C.sub}>
            With room for {Math.ceil(guests * 1.1)} guests
          </T>
        </View>
      </Card>
      <View style={{ height: S.sm }} />
      <Button label="Find vendors" icon="search" onPress={() => router.push('/explore')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: C.brand,
    borderRadius: R.xl,
    padding: S.xl,
    marginBottom: S.lg,
    overflow: 'hidden',
    ...shadow.brand,
  },
  heroInput: {
    fontFamily: F.semibold,
    fontSize: 44,
    lineHeight: 52,
    color: '#fff',
    textAlign: 'left',
    minWidth: 70,
    maxWidth: 120,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(201, 162, 75, 0.6)',
    borderStyle: 'dashed',
  },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(201, 162, 75, 0.16)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.md, marginBottom: S.lg },
  tile: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.lg,
    ...shadow.md,
  },
  kvaNote: { flexDirection: 'row', alignItems: 'flex-start', marginTop: S.md },
  fuelBox: {
    backgroundColor: C.goldSoft,
    borderRadius: R.md,
    padding: S.md,
    marginTop: S.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: S.sm,
  },
});
