import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Thumb } from '@/components/Cover';
import {
  Button,
  Card,
  Divider,
  EmptyState,
  IconBubble,
  Notice,
  Pill,
  Row,
  Screen,
  SectionHeader,
  StarPicker,
  Stepper,
  T,
} from '@/components/ui';
import { formatDateLong, formatStamp, naira } from '@/lib/format';
import { POLICIES } from '@/lib/policies';
import { paidSoFar, previewCancellation, settleReturn } from '@/lib/pricing';
import { useStore } from '@/lib/store';
import { C, F, R, S } from '@/lib/theme';
import type { BookingStatus } from '@/lib/types';
import { STATUS_LABEL } from '../(tabs)/bookings';

const STEPS: { label: string; at: BookingStatus[] }[] = [
  { label: 'Sent', at: ['requested'] },
  { label: 'Accepted', at: ['accepted'] },
  { label: 'Deposit', at: ['deposit_paid'] },
  { label: 'Paid', at: ['fully_paid'] },
  { label: 'Delivered', at: ['delivered'] },
  { label: 'Done', at: ['completed'] },
];

function Progress({ status }: { status: BookingStatus }) {
  const stopped = status === 'cancelled' || status === 'vendor_no_show';
  const idx = STEPS.findIndex((s) => s.at.includes(status));
  return (
    <View style={{ flexDirection: 'row', marginTop: S.lg }} accessibilityLabel={`Progress: ${STATUS_LABEL[status].label}`}>
      {STEPS.map((s, i) => {
        const done = !stopped && i <= idx;
        const current = !stopped && i === idx;
        return (
          <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
            {/* Fixed-height row: the larger "current" node must not shift this step's line. */}
            <View style={styles.trackRow}>
              <View style={[styles.track, { opacity: i === 0 ? 0 : 1 }, done && styles.trackOn]} />
              <View style={[styles.node, done && styles.nodeOn, current && styles.nodeCurrent, stopped && styles.nodeStopped]}>
                {done && !current ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                {current ? <View style={styles.nodeDot} /> : null}
              </View>
              <View
                style={[
                  styles.track,
                  { opacity: i === STEPS.length - 1 ? 0 : 1 },
                  !stopped && i < idx && styles.trackOn,
                ]}
              />
            </View>
            <T size={10} semi={current} color={done ? C.ink : C.faint} style={{ marginTop: 4 }}>
              {s.label}
            </T>
          </View>
        );
      })}
    </View>
  );
}

function StepCard({
  icon,
  title,
  body,
  children,
  tone = 'brand',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  children: React.ReactNode;
  tone?: 'brand' | 'good';
}) {
  return (
    <Card style={styles.stepCard}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.md }}>
        <IconBubble icon={icon} size={40} bg={tone === 'good' ? C.greenSoft : C.goldSoft} color={tone === 'good' ? C.green : C.goldDark} />
        <View style={{ flex: 1, marginLeft: S.md }}>
          <T size={11} bold color={C.goldDark}>
            NEXT STEP
          </T>
          <T bold size={16}>
            {title}
          </T>
          <T size={13} color={C.sub} style={{ marginTop: 2 }}>
            {body}
          </T>
        </View>
      </View>
      {children}
    </Card>
  );
}

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookings, advance, confirmDelivery, completeReturn, cancel, reportNoShow, submitReview, vendorById } = useStore();
  const b = bookings.find((x) => x.id === id);
  const v = b ? vendorById(b.vendorId) : undefined;

  const [recv, setRecv] = useState<Record<string, number>>({});
  const [ret, setRet] = useState<Record<string, { returned: number; damaged: number }>>({});
  const [stars, setStars] = useState(5);
  const [punct, setPunct] = useState(5);
  const [desc, setDesc] = useState(5);
  const [text, setText] = useState('');

  if (!b || !v)
    return (
      <Screen>
        <EmptyState icon="document-text-outline" title="Booking not found" body="It may have been cleared with the demo data." />
      </Screen>
    );

  const s = STATUS_LABEL[b.status];
  const paid = paidSoFar(b);
  const items = b.lines.map((l) => ({ line: l, item: v.items.find((i) => i.id === l.itemId)! }));
  const returnables = items.filter((x) => x.item.returnable);
  const canCancel = ['requested', 'accepted', 'deposit_paid', 'fully_paid'].includes(b.status);
  const cancelPreview = previewCancellation(b);

  const recvOf = (itemId: string, qty: number) => recv[itemId] ?? qty;
  const retOf = (itemId: string, qty: number) => ret[itemId] ?? { returned: qty, damaged: 0 };
  const liveSettle = settleReturn(
    v,
    b,
    Object.fromEntries(returnables.map((x) => [x.line.itemId, retOf(x.line.itemId, x.line.qty)]))
  );
  const paidTotal = paid.vendorMoney + paid.caution;

  return (
    <Screen>
      {/* Header */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Thumb category={v.category} photo={v.photo} size={56} />
          <View style={{ flex: 1, marginLeft: S.md }}>
            <T size={17} bold lines={1}>
              {v.name}
            </T>
            <T size={12} color={C.sub}>
              {formatDateLong(b.dateISO)}
            </T>
            <T size={11} color={C.faint}>
              Ref {b.id}
            </T>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginTop: S.md }}>
          <Pill label={s.label} tone={s.tone} />
        </View>
        <Progress status={b.status} />
      </Card>

      {/* Payment summary */}
      <SectionHeader title="Payment" style={{ marginTop: S.sm }} />
      <Card>
        {b.breakdown.lines.map((l) => (
          <Row key={l.itemId} left={`${l.name} × ${l.qty}`} right={naira(l.amount)} />
        ))}
        {b.breakdown.delivery > 0 && <Row left="Delivery / setup" right={naira(b.breakdown.delivery)} />}
        {b.breakdown.fuel > 0 && <Row left="Generator fuel" right={naira(b.breakdown.fuel)} />}
        {b.breakdown.caution > 0 && <Row left="Refundable caution deposit" right={naira(b.breakdown.caution)} />}
        <Divider dashed />
        <Row left="Total" right={naira(b.breakdown.total)} bold />
        <View style={styles.paidBar}>
          <View
            style={[
              styles.paidFill,
              { width: `${b.breakdown.total ? Math.min(100, (paidTotal / b.breakdown.total) * 100) : 0}%` },
            ]}
          />
        </View>
        <Row left="Paid so far" right={naira(paidTotal)} color={C.green} />
      </Card>

      {/* Next step */}
      {b.status === 'requested' && (
        <StepCard
          icon="hourglass-outline"
          title={`Waiting for ${v.name}`}
          body={`Typical reply: ${v.reliability.responseMins} minutes. Nothing is charged until the vendor accepts.`}>
          <Button
            label="Simulate vendor accepting"
            kind="secondary"
            onPress={() => advance(b.id, 'accepted', 'Vendor accepted. Stock is now held for you.')}
          />
        </StepCard>
      )}
      {b.status === 'accepted' && (
        <StepCard
          icon="card-outline"
          title="Pay deposit to confirm"
          body={`${POLICIES[b.policy].depositPct}% of vendor charges secures your date.`}>
          <Button
            label={`Pay ${naira(b.breakdown.deposit)} (simulated)`}
            icon="card"
            onPress={() => advance(b.id, 'deposit_paid', `Deposit of ${naira(b.breakdown.deposit)} paid.`)}
          />
        </StepCard>
      )}
      {b.status === 'deposit_paid' && (
        <StepCard
          icon="wallet-outline"
          title="Balance due 3 days before"
          body={`Includes the refundable caution deposit of ${naira(b.breakdown.caution)}.`}>
          <Button
            label={`Pay ${naira(b.breakdown.balance)} (simulated)`}
            icon="card"
            onPress={() => advance(b.id, 'fully_paid', `Balance of ${naira(b.breakdown.balance)} paid.`)}
          />
        </StepCard>
      )}
      {b.status === 'fully_paid' && (
        <StepCard
          icon="sparkles-outline"
          title="Day of the event"
          body={`${v.arrival}. Count everything when it arrives. If nobody shows, report it and get a full refund.`}>
          <Button
            label="Items arrived: start count"
            icon="checkbox"
            onPress={() => advance(b.id, 'fully_paid', 'Arrival confirmed. Counting started.')}
          />
          <View style={{ height: S.sm }} />
          <Button label="Vendor did not show up" kind="danger" icon="alert-circle" onPress={() => reportNoShow(b.id)} />
        </StepCard>
      )}

      {b.status === 'fully_paid' && b.events.some((e) => e.text.startsWith('Arrival')) && (
        <Card>
          <T size={16} bold>
            Handover count
          </T>
          <T size={13} color={C.sub} style={{ marginBottom: S.sm }}>
            Adjust anything that is short.
          </T>
          {items.map(({ line, item }) => (
            <View key={line.itemId} style={styles.countRow}>
              <View style={{ flex: 1 }}>
                <T semi>{item.name}</T>
                <T size={12} color={C.sub}>
                  Ordered {line.qty}
                </T>
              </View>
              <Stepper
                value={recvOf(line.itemId, line.qty)}
                max={line.qty}
                label={item.name}
                onChange={(n) => setRecv((r) => ({ ...r, [line.itemId]: n }))}
              />
            </View>
          ))}
          <View style={{ height: S.md }} />
          <Button
            label="Confirm delivery"
            icon="checkmark-circle"
            onPress={() =>
              confirmDelivery(
                b.id,
                Object.fromEntries(
                  items.map(({ line }) => [
                    line.itemId,
                    { received: recvOf(line.itemId, line.qty), ok: recvOf(line.itemId, line.qty) === line.qty },
                  ])
                )
              )
            }
          />
        </Card>
      )}

      {b.status === 'delivered' && (
        <StepCard
          icon="return-down-back-outline"
          title="Return check"
          body={
            returnables.length === 0
              ? 'Nothing to return for this booking.'
              : 'Missing items are charged at replacement value, damaged items at 50%, taken from your caution deposit only.'
          }>
          {returnables.map(({ line, item }) => {
            const r = retOf(line.itemId, line.qty);
            return (
              <View key={line.itemId} style={styles.returnBox}>
                <T bold>{item.name}</T>
                <View style={styles.countRow}>
                  <T size={13} color={C.sub} style={{ flex: 1 }}>
                    Returned of {line.qty}
                  </T>
                  <Stepper
                    value={r.returned}
                    max={line.qty}
                    label={`${item.name} returned`}
                    onChange={(n) => setRet((x) => ({ ...x, [line.itemId]: { returned: n, damaged: Math.min(r.damaged, n) } }))}
                  />
                </View>
                <View style={styles.countRow}>
                  <T size={13} color={C.sub} style={{ flex: 1 }}>
                    Damaged
                  </T>
                  <Stepper
                    value={r.damaged}
                    max={r.returned}
                    label={`${item.name} damaged`}
                    onChange={(n) => setRet((x) => ({ ...x, [line.itemId]: { ...r, damaged: n } }))}
                  />
                </View>
              </View>
            );
          })}
          {returnables.length > 0 && (
            <>
              <Row left="Deduction" right={naira(liveSettle.deduction)} color={liveSettle.deduction ? C.red : C.ink} />
              <Row left="Caution refunded to you" right={naira(liveSettle.refund)} bold color={C.green} />
              <View style={{ height: S.sm }} />
            </>
          )}
          <Button
            label="Complete return and settle"
            onPress={() =>
              completeReturn(
                b.id,
                Object.fromEntries(returnables.map((x) => [x.line.itemId, retOf(x.line.itemId, x.line.qty)]))
              )
            }
          />
        </StepCard>
      )}

      {b.status === 'completed' && b.settlement && (
        <Notice
          tone={b.settlement.deduction > 0 ? 'warn' : 'good'}
          title={b.settlement.deduction > 0 ? `Deduction ${naira(b.settlement.deduction)}` : 'Full caution deposit released'}>
          {b.settlement.deduction > 0
            ? `${b.settlement.details.join('; ')}. Refund ${naira(b.settlement.refund)}.`
            : `Refund ${naira(b.settlement.refund)}.`}
        </Notice>
      )}

      {b.status === 'completed' && !b.review && (
        <StepCard icon="star-outline" title="Leave a verified review" body="Your review helps the next host choose well." tone="good">
          <T size={13} semi color={C.sub}>
            Overall
          </T>
          <StarPicker value={stars} onChange={setStars} />
          <T size={13} semi color={C.sub} style={{ marginTop: S.md }}>
            Punctuality
          </T>
          <StarPicker value={punct} onChange={setPunct} />
          <T size={13} semi color={C.sub} style={{ marginTop: S.md }}>
            As described
          </T>
          <StarPicker value={desc} onChange={setDesc} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="What went well or badly?"
            placeholderTextColor={C.faint}
            multiline
            style={styles.input}
          />
          <Button label="Post review" icon="send" onPress={() => submitReview(b.id, { stars, punctuality: punct, asDescribed: desc, text })} />
        </StepCard>
      )}
      {b.review && (
        <Notice tone="good" title="Review posted">
          Thanks. Verified reviews help the next customer.
        </Notice>
      )}

      {b.status === 'vendor_no_show' && b.cancellation && (
        <Notice tone="good" title={`Refund: ${naira(b.cancellation.refund)}`}>
          Full refund because the vendor did not arrive. The no-show is added to their record.
        </Notice>
      )}
      {b.status === 'cancelled' && b.cancellation && (
        <Notice tone="warn" title={`Refund: ${naira(b.cancellation.refund)}`}>
          {b.cancellation.pct}% of vendor charges returned
          {b.cancellation.forfeited ? `, ${naira(b.cancellation.forfeited)} kept by the vendor` : ''}.
        </Notice>
      )}

      {/* Timeline */}
      <SectionHeader title="Timeline" style={{ marginTop: S.md }} />
      <Card>
        {[...b.events].reverse().map((e, i, arr) => (
          <View key={i} style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', width: 20 }}>
              <View style={[styles.tlDot, i === 0 && { backgroundColor: C.brand, borderColor: C.brandSoft }]} />
              {i < arr.length - 1 && <View style={styles.tlLine} />}
            </View>
            <View style={{ flex: 1, marginLeft: S.sm, paddingBottom: i < arr.length - 1 ? S.lg : 0 }}>
              <T size={14} semi={i === 0}>
                {e.text}
              </T>
              <T size={12} color={C.faint}>
                {formatStamp(e.at)}
              </T>
            </View>
          </View>
        ))}
      </Card>

      {canCancel && (
        <Card style={{ marginTop: S.sm }}>
          <T bold>Cancel booking</T>
          <T size={13} color={C.sub} style={{ marginTop: 2, marginBottom: S.md }}>
            {cancelPreview.days} days before the event on a {POLICIES[b.policy].label.toLowerCase()} policy: you would get back{' '}
            <T size={13} bold>
              {naira(cancelPreview.refund)}
            </T>
            .
          </T>
          <Button label="Cancel booking" kind="danger" onPress={() => cancel(b.id)} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  trackRow: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 24 },
  // Even height in an even row keeps the line on whole pixels, so it stays crisp.
  track: { flex: 1, height: 2, backgroundColor: C.line },
  trackOn: { backgroundColor: C.brand },
  node: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeOn: { backgroundColor: C.brand },
  nodeCurrent: { backgroundColor: C.brand, borderWidth: 4, borderColor: C.brandSoft, width: 24, height: 24, borderRadius: 12 },
  nodeStopped: { backgroundColor: C.faint },
  nodeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  stepCard: { borderWidth: 1.5, borderColor: C.goldSoft },
  paidBar: { height: 6, borderRadius: 3, backgroundColor: C.greenSoft, marginTop: S.sm, marginBottom: S.xs, overflow: 'hidden' },
  paidFill: { height: 6, borderRadius: 3, backgroundColor: C.green },
  countRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  returnBox: { backgroundColor: C.brandTint, borderRadius: R.md, padding: S.md, marginBottom: S.sm },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    borderRadius: R.md,
    padding: S.md,
    marginVertical: S.md,
    minHeight: 80,
    fontFamily: F.regular,
    color: C.ink,
    textAlignVertical: 'top',
  },
  tlDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.faint,
    borderWidth: 3,
    borderColor: C.line,
    marginTop: 4,
  },
  tlLine: { flex: 1, width: 2, backgroundColor: C.line, marginTop: 2 },
});
