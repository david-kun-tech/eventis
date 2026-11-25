import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DatePicker } from '@/components/DatePicker';
import { Button, Card, Divider, IconBubble, Notice, Pill, Screen, SectionHeader, T, type Tone } from '@/components/ui';
import { formatDateLong, formatStamp } from '@/lib/format';
import { POLICIES } from '@/lib/policies';
import { useStore } from '@/lib/store';
import { C, CAT, R, S, shadow } from '@/lib/theme';
import {
  CHECKS,
  runAutomaticChecks,
  statusOf,
  type AppStatus,
  type CheckId,
  type CheckState,
  type VendorApplication,
} from '@/lib/verification';

const NEEDS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'id-card-outline', title: 'Your NIN', body: 'And a selfie, so we can match you to your ID.' },
  { icon: 'document-text-outline', title: 'CAC number, if you have one', body: 'BN or RC. Unregistered vendors can still apply.' },
  { icon: 'card-outline', title: 'A bank account', body: 'In your own name or your business name, for payouts.' },
  { icon: 'cube-outline', title: 'Your price list and stock', body: 'What you rent or offer, with real quantities.' },
  { icon: 'call-outline', title: 'Two past clients', body: 'We call them to confirm you delivered.' },
];

const STATUS: Record<AppStatus, { title: string; body: string; tone: Tone; icon: keyof typeof Ionicons.glyphMap }> = {
  in_review: {
    title: 'We are checking your details',
    body: 'Automatic checks take minutes. Reference calls usually take 1 to 2 working days.',
    tone: 'warn',
    icon: 'hourglass-outline',
  },
  changes_requested: {
    title: 'Something needs fixing',
    body: 'One check did not pass. Fix it below and we will check again.',
    tone: 'bad',
    icon: 'alert-circle-outline',
  },
  inspection: {
    title: 'Book your inspection',
    body: 'Your details check out. One visit and you are live.',
    tone: 'brand',
    icon: 'calendar-outline',
  },
  verified: {
    title: 'You are a verified vendor',
    body: 'Every check passed. Your listing is ready to go live.',
    tone: 'good',
    icon: 'shield-checkmark',
  },
};

const STATE_ICON: Record<CheckState, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  waiting: { icon: 'ellipse-outline', color: C.faint, label: 'Waiting' },
  passed: { icon: 'checkmark-circle', color: C.green, label: 'Passed' },
  failed: { icon: 'close-circle', color: C.red, label: 'Needs fixing' },
  skipped: { icon: 'remove-circle-outline', color: C.sub, label: 'Not needed' },
};

const stamp = () => new Date().toISOString();

function Landing({ hasDraft }: { hasDraft: boolean }) {
  return (
    <Screen
      footer={
        <Button
          label={hasDraft ? 'Continue application' : 'Start application'}
          icon="arrow-forward"
          onPress={() => router.push('/partner/apply')}
        />
      }>
      <View style={styles.hero}>
        <View style={[styles.circle, { width: 180, height: 180, right: -50, top: -70 }]} />
        <T size={12} semi color={C.gold}>
          FOR VENDORS
        </T>
        <T size={24} bold color="#fff" style={{ marginTop: S.xs }}>
          Get booked by hosts who pay deposits
        </T>
        {[
          'Deposits are paid before the event, never on the day',
          'Your cancellation terms are shown to every host',
          'Payouts straight to your bank account',
        ].map((b) => (
          <View key={b} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: S.sm }}>
            <Ionicons name="checkmark-circle" size={16} color={C.gold} style={{ marginTop: 2 }} />
            <T size={13} color="rgba(255,255,255,0.9)" style={{ flex: 1, marginLeft: S.sm }}>
              {b}
            </T>
          </View>
        ))}
      </View>

      <SectionHeader title="What you'll need" />
      <Card style={{ paddingVertical: S.sm }}>
        {NEEDS.map((n, i) => (
          <View key={n.title}>
            {i > 0 && <Divider />}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: S.xs }}>
              <IconBubble icon={n.icon} size={36} />
              <View style={{ flex: 1, marginLeft: S.md }}>
                <T size={14} semi>
                  {n.title}
                </T>
                <T size={12} color={C.sub}>
                  {n.body}
                </T>
              </View>
            </View>
          </View>
        ))}
      </Card>

      <SectionHeader title="How verification works" style={{ marginTop: S.md }} />
      <Card>
        {[...CHECKS.map((c) => ({ title: c.title, by: c.by as string, what: c.what })),
          {
            title: 'First 3 bookings',
            by: 'Probation',
            what: 'Payouts are released 24 hours after each event, and we check in with the host.',
          },
        ].map((c, i, arr) => (
          <View key={c.title} style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', width: 28 }}>
              <View style={styles.stepNum}>
                <T size={11} bold color={C.gold}>
                  {i + 1}
                </T>
              </View>
              {i < arr.length - 1 && <View style={styles.stepLine} />}
            </View>
            <View style={{ flex: 1, marginLeft: S.md, paddingBottom: i < arr.length - 1 ? S.lg : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <T size={14} semi style={{ marginRight: S.sm }}>
                  {c.title}
                </T>
                <Pill label={c.by} tone={c.by === 'Automatic' ? 'neutral' : c.by === 'Probation' ? 'warn' : 'brand'} />
              </View>
              <T size={12} color={C.sub}>
                {c.what}
              </T>
            </View>
          </View>
        ))}
      </Card>

      <Notice tone="warn" title="Demo app">
        Use made-up numbers. Checks are simulated, and only the last 4 digits of your NIN and account number are kept.
      </Notice>
    </Screen>
  );
}

function Status({ app }: { app: VendorApplication }) {
  const { saveVendorApp } = useStore();
  const [inspectOn, setInspectOn] = useState<string | null>(app.inspectionDate);
  const status = statusOf(app);
  const s = STATUS[status];
  const d = app.draft;
  const cat = d.business.category ? CAT[d.business.category] : null;

  const update = (next: VendorApplication, text: string) =>
    saveVendorApp({ ...next, events: [...next.events, { at: stamp(), text }] });
  const setCheck = (id: CheckId, state: CheckState, note: string, text: string) =>
    update({ ...app, checks: { ...app.checks, [id]: { state, note } } }, text);

  const autoPending = (['identity', 'business', 'bank'] as const).some((k) => app.checks[k].state === 'waiting');
  const refsPending = !autoPending && status === 'in_review' && app.checks.references.state === 'waiting';

  return (
    <Screen>
      <Card style={{ alignItems: 'center', paddingVertical: S.xl }}>
        <IconBubble
          icon={s.icon}
          size={64}
          bg={status === 'verified' ? C.greenSoft : status === 'changes_requested' ? C.redSoft : C.goldSoft}
          color={status === 'verified' ? C.green : status === 'changes_requested' ? C.red : C.goldDark}
        />
        <T size={20} bold center style={{ marginTop: S.md }}>
          {s.title}
        </T>
        <T size={13} color={C.sub} center style={{ marginTop: 4 }}>
          {s.body}
        </T>
        <View style={{ flexDirection: 'row', marginTop: S.md }}>
          <Pill label={d.business.name} icon={cat?.icon} tone="brand" />
        </View>
      </Card>

      {/* Next action, simulated like the booking flow */}
      {autoPending && (
        <Card style={styles.action}>
          <T bold>Automatic checks queued</T>
          <T size={13} color={C.sub} style={{ marginTop: 2, marginBottom: S.md }}>
            NIMC, CAC and your bank are asked to confirm your details.
          </T>
          <Button
            label="Run automatic checks (simulated)"
            kind="secondary"
            icon="flash-outline"
            onPress={() => update(runAutomaticChecks(app), 'Automatic checks finished.')}
          />
        </Card>
      )}
      {refsPending && (
        <Card style={styles.action}>
          <T bold>Calling your references</T>
          <T size={13} color={C.sub} style={{ marginTop: 2, marginBottom: S.md }}>
            {d.offer.references.map((r) => r.name).join(' and ')} will get a short call.
          </T>
          <Button
            label="Simulate: both confirmed"
            kind="secondary"
            onPress={() => setCheck('references', 'passed', 'Both clients confirmed your work', 'References confirmed.')}
          />
          <View style={{ height: S.sm }} />
          <Button
            label="Simulate: a client did not confirm"
            kind="ghost"
            onPress={() =>
              setCheck('references', 'failed', `${d.offer.references[1]?.name || 'A reference'} could not be reached. Add another past client.`, 'A reference could not be confirmed.')
            }
          />
        </Card>
      )}
      {status === 'inspection' && (
        <Card style={styles.action}>
          <T bold>{app.inspectionDate ? `Inspection on ${formatDateLong(app.inspectionDate)}` : 'Pick a day for your inspection'}</T>
          <T size={13} color={C.sub} style={{ marginTop: 2, marginBottom: S.sm }}>
            {d.business.category === 'venue'
              ? 'We walk the venue, test the generator and changeover, check capacity and take photos.'
              : 'We count a sample of your stock against your listing, check condition and take photos.'}
          </T>
          {app.inspectionDate ? (
            <>
              <Button
                label="Simulate: inspection passed"
                icon="checkmark-circle"
                onPress={() => setCheck('inspection', 'passed', 'Stock and photos match the listing', 'Inspection passed. Verified.')}
              />
              <View style={{ height: S.sm }} />
              <Button
                label="Simulate: stock did not match"
                kind="ghost"
                onPress={() =>
                  setCheck('inspection', 'failed', 'Fewer items on site than listed. Update your quantities.', 'Inspection found a stock mismatch.')
                }
              />
            </>
          ) : (
            <>
              <DatePicker value={inspectOn} onChange={setInspectOn} />
              <View style={{ height: S.md }} />
              <Button
                label="Book inspection"
                disabled={!inspectOn}
                onPress={() => inspectOn && update({ ...app, inspectionDate: inspectOn }, `Inspection booked for ${formatDateLong(inspectOn)}.`)}
              />
            </>
          )}
        </Card>
      )}
      {status === 'verified' && (
        <Notice tone="good" title="Probation: your first 3 bookings">
          Payouts are released 24 hours after each event, and we check in with the host. After that, payouts follow
          your normal terms.
        </Notice>
      )}

      <SectionHeader title="Checks" style={{ marginTop: S.sm }} />
      <Card style={{ paddingVertical: S.sm }}>
        {CHECKS.map((c, i) => {
          const st = app.checks[c.id];
          const look = STATE_ICON[st.state];
          return (
            <View key={c.id}>
              {i > 0 && <Divider />}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: S.xs }}>
                <Ionicons name={look.icon} size={22} color={look.color} style={{ marginTop: 1 }} />
                <View style={{ flex: 1, marginLeft: S.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <T size={14} semi>
                      {c.title}
                    </T>
                    <T size={12} semi color={look.color}>
                      {look.label}
                    </T>
                  </View>
                  <T size={12} color={st.state === 'failed' ? C.red : C.sub}>
                    {st.note ?? c.what}
                  </T>
                  {st.state === 'failed' && (
                    <View style={{ marginTop: S.sm, alignSelf: 'flex-start' }}>
                      <Button
                        label="Fix this"
                        compact
                        kind="secondary"
                        icon="create-outline"
                        onPress={() => router.push({ pathname: '/partner/apply', params: { step: String(c.fixStep) } })}
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </Card>

      <SectionHeader title="Your application" style={{ marginTop: S.md }} />
      <Card>
        {[
          ['Business', `${d.business.name}, ${d.business.area}, ${d.business.city}`],
          ['Category', cat?.label ?? '-'],
          ['Owner', d.owner.legalName],
          ['NIN', `•••• ${d.owner.ninLast4}`],
          ['CAC', d.registration.type === 'none' ? 'Not registered' : `${d.registration.type} ${d.registration.number.replace(/^(BN|RC)\s*/i, '')}`],
          ['Payouts', `${d.payout.bank} •••• ${d.payout.accountLast4}`],
          ['Cancellation', POLICIES[d.payout.policy].label],
          ['Items listed', String(d.offer.items.length)],
        ].map(([k, v]) => (
          <View key={k} style={styles.kv}>
            <T size={13} color={C.sub}>
              {k}
            </T>
            <T size={13} semi style={{ flexShrink: 1, textAlign: 'right', marginLeft: S.md }}>
              {v}
            </T>
          </View>
        ))}
      </Card>

      <SectionHeader title="Timeline" style={{ marginTop: S.md }} />
      <Card>
        {[...app.events].reverse().map((e, i) => (
          <View key={i} style={{ marginBottom: i < app.events.length - 1 ? S.md : 0 }}>
            <T size={13} semi={i === 0}>
              {e.text}
            </T>
            <T size={11} color={C.faint}>
              {formatStamp(e.at)}
            </T>
          </View>
        ))}
      </Card>

      <Button label="Withdraw application" kind="ghost" icon="trash-outline" onPress={() => saveVendorApp(null)} />
    </Screen>
  );
}

export default function Partner() {
  const { vendorApp, vendorDraft } = useStore();
  return vendorApp ? <Status app={vendorApp} /> : <Landing hasDraft={!!vendorDraft} />;
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: C.brand,
    borderRadius: R.xl,
    padding: S.xl,
    marginBottom: S.xl,
    overflow: 'hidden',
    ...shadow.brand,
  },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(201, 162, 75, 0.16)' },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: { flex: 1, width: 2, backgroundColor: C.line, marginVertical: 2 },
  action: { borderWidth: 1.5, borderColor: C.goldSoft },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
});
