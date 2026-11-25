import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Thumb } from '@/components/Cover';
import { DatePicker } from '@/components/DatePicker';
import {
  Button,
  Card,
  ConfirmDialog,
  Divider,
  EmptyState,
  IconBubble,
  Notice,
  Rating,
  Row,
  Screen,
  SectionHeader,
  Stepper,
  T,
} from '@/components/ui';
import { unitsLeft, vendorAvailableOn } from '@/lib/availability';
import { daysUntil, formatDateLong, naira } from '@/lib/format';
import { POLICIES } from '@/lib/policies';
import { buildBreakdown } from '@/lib/pricing';
import { useStore } from '@/lib/store';
import { C, R, S } from '@/lib/theme';

export default function Book() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { eventDate, setEventDate, guests, bookings, createBooking, vendorById } = useStore();
  const v = vendorById(id);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [outdoor, setOutdoor] = useState(!!v?.outdoor);
  const [rainCover, setRainCover] = useState(false);

  const bd = useMemo(() => (v ? buildBreakdown(v, qty) : null), [v, qty]);

  // Leaving with items picked (back button, swipe or Android back) asks first.
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const picked = Object.values(qty).some((n) => n > 0);
  const allowLeave = usePreventRemove(picked, ({ repeat }) => setPendingLeave(() => repeat));

  if (!v || !bd)
    return (
      <Screen>
        <EmptyState icon="help-circle-outline" title="Vendor not found" body="This vendor may have been removed." />
      </Screen>
    );

  const policy = POLICIES[v.policy];
  const lines = Object.entries(qty)
    .filter(([, n]) => n > 0)
    .map(([itemId, n]) => ({ itemId, qty: n }));
  const dateOk = !!eventDate && vendorAvailableOn(v, eventDate, bookings);
  const days = eventDate ? daysUntil(eventDate) : 0;
  const overCapacity = v.capacity ? guests > v.capacity : false;
  const needsRain = outdoor && v.category === 'venue' && !rainCover;
  const noPowerBackup = v.category === 'venue' && v.power && !v.power.autoChangeover;
  const itemCount = lines.reduce((a, l) => a + l.qty, 0);
  const canSend = dateOk && lines.length > 0 && !overCapacity;

  const submit = () => {
    if (!eventDate || lines.length === 0) return;
    const bid = createBooking({
      vendorId: v.id,
      dateISO: eventDate,
      lines,
      outdoor,
      notes: rainCover ? 'Rain-cover plan confirmed by customer.' : '',
    });
    allowLeave();
    router.replace(`/booking/${bid}`);
  };

  return (
    <Screen
      footer={
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <T size={12} color={C.sub}>
                {itemCount ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'} · total` : 'Total'}
              </T>
              <T size={20} bold color={C.brand}>
                {naira(bd.total)}
              </T>
            </View>
            <View style={{ flex: 1.4 }}>
              <Button label="Send request" icon="send" disabled={!canSend} onPress={submit} />
            </View>
          </View>
          <T size={11} color={C.faint} center style={{ marginTop: S.sm }}>
            {eventDate && lines.length > 0 ? `For ${formatDateLong(eventDate)}. ` : ''}Demo only: no money moves.
          </T>
        </>
      }>
      <ConfirmDialog
        visible={!!pendingLeave}
        title="Discard this booking?"
        body="The items you picked will be cleared."
        confirmLabel="Discard"
        onCancel={() => setPendingLeave(null)}
        onConfirm={() => {
          const leave = pendingLeave;
          setPendingLeave(null);
          allowLeave();
          leave?.();
        }}
      />

      {/* Vendor summary */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', padding: S.md }}>
        <Thumb category={v.category} photo={v.photo} size={56} />
        <View style={{ flex: 1, marginLeft: S.md }}>
          <T size={16} bold lines={1}>
            {v.name}
          </T>
          <T size={12} color={C.sub}>
            {v.area}, {v.city}
          </T>
          <View style={{ marginTop: 2 }}>
            <Rating value={v.rating} count={v.ratingCount} size={12} />
          </View>
        </View>
      </Card>

      <SectionHeader title="Event date" style={{ marginTop: S.md, marginBottom: S.xs }} />
      <DatePicker value={eventDate} onChange={setEventDate} disabled={(iso) => !vendorAvailableOn(v, iso, bookings)} />
      <View style={{ height: S.md }} />
      {eventDate && !dateOk && <Notice tone="bad" title="Fully booked on this date. Try another." />}

      <SectionHeader title="Choose items" style={{ marginTop: S.md }} />
      {v.items.map((i) => {
        const left = eventDate ? unitsLeft(v, i, eventDate, bookings) : 0;
        const n = qty[i.id] ?? 0;
        return (
          <Card key={i.id} style={[styles.item, n > 0 && styles.selected]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: S.md }}>
                <T semi>{i.name}</T>
                <T size={12} color={C.sub}>
                  <T size={12} bold color={C.brandDark}>
                    {naira(i.price)}
                  </T>{' '}
                  per {i.unit}
                  {eventDate ? ` · ${left} available` : ''}
                </T>
              </View>
              <Stepper value={n} max={left} label={i.name} onChange={(k) => setQty((q) => ({ ...q, [i.id]: k }))} />
            </View>
            {i.id === 'chairs' || i.id === 'chair' || i.id === 'plastic' ? (
              <T size={12} color={C.sub} style={{ marginTop: 6 }}>
                Your guest count is {guests}.
              </T>
            ) : null}
          </Card>
        );
      })}
      {!eventDate && <Notice tone="warn" title="Pick a date first so stock can be checked." />}

      {v.category === 'venue' && (
        <>
          {overCapacity && (
            <Notice tone="bad" title={`Too small for ${guests} guests`}>
              This venue seats up to {v.capacity}.
            </Notice>
          )}
          {noPowerBackup && (
            <Notice tone="warn" title="Manual power changeover">
              Expect a short outage when mains drops. Consider adding a silent generator rental.
            </Notice>
          )}
          <Card>
            <View style={styles.switchRow}>
              <IconBubble icon="sunny-outline" size={36} />
              <T semi style={{ flex: 1, marginLeft: S.md }}>
                Outdoor event
              </T>
              <Switch value={outdoor} onValueChange={setOutdoor} trackColor={{ true: C.brand, false: C.line }} thumbColor="#fff" />
            </View>
            {outdoor && (
              <View style={[styles.switchRow, { marginTop: S.md }]}>
                <IconBubble icon="umbrella-outline" size={36} />
                <T style={{ flex: 1, marginHorizontal: S.md }}>I have a rain-cover plan (canopy or marquee)</T>
                <Switch value={rainCover} onValueChange={setRainCover} trackColor={{ true: C.brand, false: C.line }} thumbColor="#fff" />
              </View>
            )}
          </Card>
          {needsRain && (
            <Notice tone="warn" title="Add rain cover">
              A marquee or canopy from a rental vendor protects guests and equipment.
            </Notice>
          )}
        </>
      )}

      {bd.subtotal > 0 && (
        <>
          <SectionHeader title="Full price. No surprises." style={{ marginTop: S.md }} />
          <Card>
            {bd.lines.map((l) => (
              <Row key={l.itemId} left={`${l.name} × ${l.qty}`} right={naira(l.amount)} />
            ))}
            {bd.delivery > 0 && <Row left="Delivery / setup" right={naira(bd.delivery)} />}
            {bd.fuel > 0 && <Row left="Generator fuel" right={naira(bd.fuel)} sub="Not included in the hall price" />}
            <Divider dashed />
            <Row left="Vendor charges" right={naira(bd.nonRefundable)} bold />
            {bd.caution > 0 && (
              <Row
                left="Refundable caution deposit"
                right={naira(bd.caution)}
                sub="Returned after the return check, less any damage or missing items"
              />
            )}
            <View style={styles.totalBox}>
              <T bold style={{ flex: 1 }}>
                Total to pay
              </T>
              <T size={18} bold color={C.brand}>
                {naira(bd.total)}
              </T>
            </View>
            <Row left={`Deposit to confirm (${policy.depositPct}%)`} right={naira(bd.deposit)} />
            <Row left="Balance, due 3 days before" right={naira(bd.balance)} />
          </Card>
        </>
      )}

      <Card style={{ flexDirection: 'row' }}>
        <IconBubble icon="shield-checkmark" size={40} />
        <View style={{ flex: 1, marginLeft: S.md }}>
          <T bold>{policy.label} cancellation</T>
          <T size={13} color={C.sub} style={{ marginTop: 2 }}>
            {policy.summary} Vendor no-shows are refunded in full.
          </T>
          {eventDate && days < 3 && (
            <T size={12} color={C.amber} style={{ marginTop: 4 }}>
              Your event is {days} days away: late bookings may be declined by the vendor.
            </T>
          )}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { padding: S.md, borderWidth: 1.5, borderColor: 'transparent' },
  selected: { borderColor: C.brand },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  totalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.brandTint,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
    marginVertical: S.sm,
  },
});
