import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  ConfirmDialog,
  CheckRow,
  Chip,
  ChipRow,
  Field,
  IconBubble,
  Notice,
  SectionHeader,
  Stepper,
  T,
} from '@/components/ui';
import { POLICIES } from '@/lib/policies';
import { useStore } from '@/lib/store';
import { C, CAT, R, S } from '@/lib/theme';
import type { Category, City, PolicyId } from '@/lib/types';
import {
  emptyDraft,
  freshChecks,
  ninValid,
  nubanValid,
  phoneValid,
  STEPS,
  stepProblems,
  type ApplicationDraft,
  type CacType,
  type StepIndex,
} from '@/lib/verification';

const CITIES: City[] = ['Abuja', 'Lagos', 'Port Harcourt'];
const BANKS = ['Access', 'GTBank', 'Zenith', 'First Bank', 'UBA', 'Opay', 'Moniepoint', 'Kuda'];
const CAC_OPTIONS: { id: CacType; title: string; body: string }[] = [
  { id: 'BN', title: 'Business name (BN)', body: 'Sole traders and partnerships' },
  { id: 'RC', title: 'Company (RC)', body: 'Limited companies' },
  { id: 'none', title: 'Not registered yet', body: 'You can still apply as an individual' },
];
const UNIT_HINT: Record<Category, string> = { venue: 'day', rental: 'piece', decor: 'event', planner: 'event' };

const stamp = () => new Date().toISOString();
const num = (s: string) => {
  const n = parseInt(s.replace(/\D/g, ''), 10);
  return Number.isNaN(n) ? 0 : n;
};

function Choice({
  title,
  body,
  active,
  onPress,
}: {
  title: string;
  body: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, active && styles.choiceOn, pressed && { opacity: 0.85 }]}>
      <View style={[styles.radio, active && { borderColor: C.brand }]}>{active ? <View style={styles.radioDot} /> : null}</View>
      <View style={{ flex: 1, marginLeft: S.md }}>
        <T size={14} semi>
          {title}
        </T>
        <T size={12} color={C.sub}>
          {body}
        </T>
      </View>
    </Pressable>
  );
}

export default function Apply() {
  const params = useLocalSearchParams<{ step?: string }>();
  const { vendorDraft, vendorApp, saveVendorDraft, saveVendorApp } = useStore();
  const editing = !!vendorApp;
  const [d, setD] = useState<ApplicationDraft>(() => vendorApp?.draft ?? vendorDraft ?? emptyDraft());

  // A new application saves as you type, so leaving any way keeps your progress.
  useEffect(() => {
    if (!editing) saveVendorDraft(d);
    // Only when the draft changes: the store rebuilds saveVendorDraft on every state
    // change, so listing it here would save in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, editing]);

  // Fixing a submitted application only counts once resubmitted, so leaving with
  // unsent changes asks first.
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const unsent = editing && JSON.stringify(d) !== JSON.stringify(vendorApp?.draft);
  const allowLeave = usePreventRemove(unsent, ({ repeat }) => setPendingLeave(() => repeat));
  const [step, setStep] = useState<StepIndex>(() => {
    const n = Number(params.step);
    return (n >= 0 && n <= 4 ? n : 0) as StepIndex;
  });
  // Full numbers live only in this screen's memory; the draft keeps the last 4 digits.
  const [nin, setNin] = useState('');
  const [account, setAccount] = useState('');
  const [tried, setTried] = useState(false);
  const scroller = useRef<ScrollViewInstance>(null);
  const insets = useSafeAreaInsets();

  const problems = stepProblems(d, step);
  const last = step === 4;
  const set = <K extends keyof ApplicationDraft>(k: K, v: Partial<ApplicationDraft[K]>) =>
    setD((x) => ({ ...x, [k]: { ...x[k], ...v } }));

  const go = (to: StepIndex) => {
    setStep(to);
    setTried(false);
    scroller.current?.scrollTo({ y: 0, animated: false });
  };

  const next = () => {
    if (problems.length) {
      setTried(true);
      return;
    }
    if (!last) {
      go((step + 1) as StepIndex);
      return;
    }
    const at = stamp();
    saveVendorApp({
      draft: d,
      submittedAt: vendorApp?.submittedAt ?? at,
      checks: freshChecks(d, vendorApp?.checks),
      inspectionDate: vendorApp?.inspectionDate ?? null,
      events: [
        ...(vendorApp?.events ?? []),
        { at, text: editing ? 'Changes submitted. Checks restarted.' : 'Application submitted for verification.' },
      ],
    });
    saveVendorDraft(null);
    allowLeave();
    // Return to the page that opened the form rather than stacking a second copy of it.
    if (router.canGoBack()) router.back();
    else router.replace('/partner');
  };

  const items = d.offer.items;
  const setItem = (id: string, patch: Partial<(typeof items)[number]>) =>
    set('offer', { items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const addItem = () =>
    set('offer', {
      items: [
        ...items,
        { id: Math.random().toString(36).slice(2, 8), name: '', unit: d.business.category ? UNIT_HINT[d.business.category] : 'piece', price: 0, stock: 1 },
      ],
    });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ConfirmDialog
        visible={!!pendingLeave}
        title="Leave without resubmitting?"
        body="Your changes won't be checked until you resubmit, and will be lost if you leave now."
        confirmLabel="Discard changes"
        onCancel={() => setPendingLeave(null)}
        onConfirm={() => {
          const leave = pendingLeave;
          setPendingLeave(null);
          allowLeave();
          leave?.();
        }}
      />
      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {STEPS.map((label, i) => (
            <View key={label} style={[styles.seg, i <= step && { backgroundColor: i === step ? C.gold : C.brand }]} />
          ))}
        </View>
        <T size={12} color={C.sub} style={{ marginTop: S.sm }}>
          Step {step + 1} of {STEPS.length} ·{' '}
          <T size={12} semi>
            {STEPS[step]}
          </T>
        </T>
      </View>

      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: S.lg, paddingBottom: S.xxl, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <>
            <T size={22} bold>
              Tell us about your business
            </T>
            <T size={13} color={C.sub} style={{ marginBottom: S.xl }}>
              This is what hosts see on your listing.
            </T>
            <Field label="Business name" value={d.business.name} onChangeText={(v) => set('business', { name: v })} placeholder="Eko Chairs and Canopies" autoCapitalize="words" />
            <T size={13} semi style={{ marginBottom: 6 }}>
              What do you offer?
            </T>
            <ChipRow>
              {(Object.keys(CAT) as Category[]).map((c) => (
                <Chip key={c} label={CAT[c].plural} icon={CAT[c].icon} active={d.business.category === c} onPress={() => set('business', { category: c })} />
              ))}
            </ChipRow>
            <View style={{ height: S.lg }} />
            <T size={13} semi style={{ marginBottom: 6 }}>
              City
            </T>
            <ChipRow>
              {CITIES.map((c) => (
                <Chip key={c} label={c} active={d.business.city === c} onPress={() => set('business', { city: c })} />
              ))}
            </ChipRow>
            <View style={{ height: S.lg }} />
            <Field label="Area" value={d.business.area} onChangeText={(v) => set('business', { area: v })} placeholder="Ikeja" autoCapitalize="words" />
            <Field
              label="Business phone"
              value={d.business.phone}
              onChangeText={(v) => set('business', { phone: v })}
              placeholder="0803 123 4567"
              keyboardType="phone-pad"
              error={tried && !phoneValid(d.business.phone) && 'Use a Nigerian mobile number, like 0803 123 4567'}
              hint="Hosts never see this. We use it for booking alerts."
            />
            <Field label="About your business" optional value={d.business.about} onChangeText={(v) => set('business', { about: v })} placeholder="What makes you reliable?" multiline />
          </>
        )}

        {step === 1 && (
          <>
            <T size={22} bold>
              Confirm who you are
            </T>
            <T size={13} color={C.sub} style={{ marginBottom: S.lg }}>
              Hosts pay deposits weeks ahead. Checking every owner&apos;s ID keeps fake listings off Eventis.
            </T>
            <Field
              label="Full legal name"
              value={d.owner.legalName}
              onChangeText={(v) => set('owner', { legalName: v })}
              placeholder="As it appears on your NIN slip"
              autoCapitalize="words"
            />
            <Field
              label="NIN"
              value={nin}
              onChangeText={(v) => {
                const t = v.replace(/\D/g, '');
                setNin(t);
                set('owner', { ninLast4: ninValid(t) ? t.slice(-4) : editing ? d.owner.ninLast4 : null });
              }}
              placeholder={d.owner.ninLast4 ? `•••• ${d.owner.ninLast4} (type again to change)` : '11 digits'}
              keyboardType="number-pad"
              maxLength={11}
              error={nin.length > 0 && !ninValid(nin) && `${nin.length} of 11 digits`}
              hint={d.owner.ninLast4 ? `Saved as •••• ${d.owner.ninLast4}. We keep only the last 4 digits.` : 'Dial *346# on your registered line to see it.'}
            />
            <T size={13} semi style={{ marginBottom: 6 }}>
              Selfie
            </T>
            <Pressable
              accessibilityRole="button"
              onPress={() => set('owner', { selfie: !d.owner.selfie })}
              style={({ pressed }) => [styles.selfie, d.owner.selfie && { borderColor: C.green, borderStyle: 'solid' }, pressed && { opacity: 0.85 }]}>
              <IconBubble
                icon={d.owner.selfie ? 'checkmark' : 'camera-outline'}
                size={48}
                bg={d.owner.selfie ? C.greenSoft : C.goldSoft}
                color={d.owner.selfie ? C.green : C.goldDark}
              />
              <View style={{ flex: 1, marginLeft: S.md }}>
                <T semi>{d.owner.selfie ? 'Selfie taken' : 'Take a selfie'}</T>
                <T size={12} color={C.sub}>
                  {d.owner.selfie ? 'Tap to retake. Simulated in the demo.' : 'We match it to your NIN photo. Simulated in the demo.'}
                </T>
              </View>
            </Pressable>
          </>
        )}

        {step === 2 && (
          <>
            <T size={22} bold>
              Business registration
            </T>
            <T size={13} color={C.sub} style={{ marginBottom: S.lg }}>
              Registered businesses get a &quot;CAC registered&quot; tag on their listing.
            </T>
            {CAC_OPTIONS.map((o) => (
              <Choice key={o.id} title={o.title} body={o.body} active={d.registration.type === o.id} onPress={() => set('registration', { type: o.id })} />
            ))}
            <View style={{ height: S.md }} />
            {(d.registration.type === 'BN' || d.registration.type === 'RC') && (
              <Field
                label={d.registration.type === 'BN' ? 'BN number' : 'RC number'}
                value={d.registration.number}
                onChangeText={(v) => set('registration', { number: v.toUpperCase() })}
                placeholder={d.registration.type === 'BN' ? 'BN 1234567' : 'RC 123456'}
                autoCapitalize="characters"
                error={tried && problems.length > 0 && problems[0]}
                hint="On your CAC certificate. We look it up on the public register."
              />
            )}
            {d.registration.type === 'none' && (
              <Notice tone="warn" title="You'll be listed as an individual">
                Hosts see &quot;Individual vendor&quot; until you add a CAC number. Your payout account must be in your own name.
              </Notice>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <T size={22} bold>
              What you offer
            </T>
            <T size={13} color={C.sub} style={{ marginBottom: S.lg }}>
              List real quantities. We count a sample at your inspection, and hosts can only book what you have.
            </T>
            {items.map((it, i) => (
              <Card key={it.id} style={{ padding: S.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm }}>
                  <T size={13} semi color={C.sub}>
                    ITEM {i + 1}
                  </T>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove item ${i + 1}`}
                    hitSlop={8}
                    onPress={() => set('offer', { items: items.filter((x) => x.id !== it.id) })}>
                    <Ionicons name="trash-outline" size={18} color={C.red} />
                  </Pressable>
                </View>
                <Field label="Name" value={it.name} onChangeText={(v) => setItem(it.id, { name: v })} placeholder="Chiavari chair (gold)" />
                <View style={{ flexDirection: 'row', gap: S.md }}>
                  <View style={{ flex: 1 }}>
                    <Field label="Price (₦)" value={it.price ? String(it.price) : ''} onChangeText={(v) => setItem(it.id, { price: num(v) })} placeholder="500" keyboardType="number-pad" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Per" value={it.unit} onChangeText={(v) => setItem(it.id, { unit: v })} placeholder="piece" />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <T size={13} semi>
                    How many do you own?
                  </T>
                  <Stepper value={it.stock} min={1} max={5000} editable label={`${it.name || 'item'} quantity`} onChange={(n) => setItem(it.id, { stock: n })} />
                </View>
              </Card>
            ))}
            <Button label={items.length ? 'Add another item' : 'Add your first item'} kind="secondary" icon="add" onPress={addItem} />

            {d.business.category === 'venue' && (
              <>
                <SectionHeader title="Venue details" style={{ marginTop: S.xl }} />
                <Field
                  label="Seated capacity"
                  value={d.offer.capacity ? String(d.offer.capacity) : ''}
                  onChangeText={(v) => set('offer', { capacity: num(v) || null })}
                  placeholder="400"
                  keyboardType="number-pad"
                />
                <Field
                  label="Generator size (kVA)"
                  optional
                  value={d.offer.kva ? String(d.offer.kva) : ''}
                  onChangeText={(v) => set('offer', { kva: num(v) || null })}
                  placeholder="250"
                  keyboardType="number-pad"
                  hint="Tested at your inspection."
                />
                <View style={styles.switchRow}>
                  <T style={{ flex: 1 }}>Fuel included in the hall price</T>
                  <Switch value={d.offer.fuelIncluded} onValueChange={(v) => set('offer', { fuelIncluded: v })} trackColor={{ true: C.brand, false: C.line }} thumbColor="#fff" />
                </View>
                <View style={styles.switchRow}>
                  <T style={{ flex: 1 }}>Automatic changeover when mains drops</T>
                  <Switch value={d.offer.autoChangeover} onValueChange={(v) => set('offer', { autoChangeover: v })} trackColor={{ true: C.brand, false: C.line }} thumbColor="#fff" />
                </View>
              </>
            )}

            <SectionHeader title="Two past clients" style={{ marginTop: S.xl, marginBottom: S.xs }} />
            <T size={12} color={C.sub} style={{ marginBottom: S.md }}>
              We call them to confirm you delivered. Use clients from the last 12 months.
            </T>
            {d.offer.references.map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: S.md }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label={`Client ${i + 1}`}
                    value={r.name}
                    onChangeText={(v) => set('offer', { references: d.offer.references.map((x, j) => (j === i ? { ...x, name: v } : x)) })}
                    placeholder="Name"
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Phone"
                    value={r.phone}
                    onChangeText={(v) => set('offer', { references: d.offer.references.map((x, j) => (j === i ? { ...x, phone: v } : x)) })}
                    placeholder="0803 123 4567"
                    keyboardType="phone-pad"
                    error={tried && r.phone.length > 0 && !phoneValid(r.phone) && 'Check the number'}
                  />
                </View>
              </View>
            ))}
          </>
        )}

        {step === 4 && (
          <>
            <T size={22} bold>
              Payouts and policies
            </T>
            <T size={13} color={C.sub} style={{ marginBottom: S.lg }}>
              The account name must match your ID or your registered business name.
            </T>
            <T size={13} semi style={{ marginBottom: 6 }}>
              Bank
            </T>
            <ChipRow>
              {BANKS.map((b) => (
                <Chip key={b} label={b} active={d.payout.bank === b} onPress={() => set('payout', { bank: b })} />
              ))}
            </ChipRow>
            <View style={{ height: S.lg }} />
            <Field
              label="Account number"
              value={account}
              onChangeText={(v) => {
                const t = v.replace(/\D/g, '');
                setAccount(t);
                set('payout', { accountLast4: nubanValid(t) ? t.slice(-4) : editing ? d.payout.accountLast4 : null });
              }}
              placeholder={d.payout.accountLast4 ? `•••• ${d.payout.accountLast4} (type again to change)` : '10 digits'}
              keyboardType="number-pad"
              maxLength={10}
              error={account.length > 0 && !nubanValid(account) && `${account.length} of 10 digits`}
            />
            <Field
              label="Account name"
              value={d.payout.accountName}
              onChangeText={(v) => set('payout', { accountName: v })}
              placeholder="As your bank app shows it"
              autoCapitalize="characters"
              hint={`Must match "${d.owner.legalName || 'your legal name'}"${d.business.name ? ` or "${d.business.name}"` : ''}.`}
            />

            <SectionHeader title="Cancellation policy" style={{ marginBottom: S.sm }} />
            {(Object.keys(POLICIES) as PolicyId[]).map((p) => (
              <Choice
                key={p}
                title={`${POLICIES[p].label} · ${POLICIES[p].depositPct}% deposit`}
                body={POLICIES[p].summary}
                active={d.payout.policy === p}
                onPress={() => set('payout', { policy: p })}
              />
            ))}
            <View style={[styles.switchRow, { marginTop: S.md }]}>
              <View style={{ flex: 1 }}>
                <T semi>Refundable caution deposit</T>
                <T size={12} color={C.sub}>
                  Covers damage or missing items. Returned after the return check.
                </T>
              </View>
              <Stepper value={d.payout.cautionPct} min={0} max={30} step={5} suffix="%" label="caution deposit percent" onChange={(n) => set('payout', { cautionPct: n })} />
            </View>

            <SectionHeader title="Your pledges" style={{ marginTop: S.xl, marginBottom: S.xs }} />
            <CheckRow
              label="If I don't show up, the host gets a full refund and it goes on my record."
              checked={d.pledges.showUp}
              onToggle={() => set('pledges', { showUp: !d.pledges.showUp })}
            />
            <CheckRow
              label="My stock counts are accurate, and I'll update them when items are lost or damaged."
              checked={d.pledges.accurateStock}
              onToggle={() => set('pledges', { accurateStock: !d.pledges.accurateStock })}
            />
            <CheckRow
              label="I won't ask hosts to pay outside Eventis or post fake reviews."
              checked={d.pledges.honestReviews}
              onToggle={() => set('pledges', { honestReviews: !d.pledges.honestReviews })}
            />
          </>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, S.lg) }]}>
        <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center' }}>
          {tried && problems.length > 0 && (
            <T size={12} color={C.red} style={{ marginBottom: S.sm }}>
              Still needed: {problems.join(', ')}
            </T>
          )}
          <View style={{ flexDirection: 'row', gap: S.sm }}>
            {step > 0 && (
              <View style={{ flex: 1 }}>
                <Button label="Back" kind="secondary" onPress={() => go((step - 1) as StepIndex)} />
              </View>
            )}
            <View style={{ flex: 2 }}>
              <Button
                label={last ? (editing ? 'Resubmit' : 'Submit') : 'Next'}
                icon={last ? 'shield-checkmark-outline' : undefined}
                onPress={next}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressWrap: { paddingHorizontal: S.lg, paddingTop: S.sm, paddingBottom: S.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.line },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: R.md,
    borderWidth: 1.5,
    borderColor: C.line,
    padding: S.md,
    marginBottom: S.sm,
  },
  choiceOn: { borderColor: C.brand, backgroundColor: '#FBFAF6' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.brand },
  selfie: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: C.gold,
    borderRadius: R.md,
    padding: S.md,
    backgroundColor: C.card,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.sm, gap: S.md },
  footer: {
    backgroundColor: C.card,
    paddingHorizontal: S.lg,
    paddingTop: S.md,
    paddingBottom: S.lg,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    boxShadow: '0px -6px 24px rgba(20, 22, 40, 0.08)',
  },
});
