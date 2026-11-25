import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getVendor } from '@/data/vendors';
import { buildBreakdown, previewCancellation, settleReturn } from './pricing';
import type { Booking, BookingLine, BookingStatus } from './types';
import type { ApplicationDraft, VendorApplication } from './verification';
import { createAccount, signUpProblems, verifyLogin, type Account, type SignUpInput, type SignUpProblems } from './auth';
import { newId, randomHex, sha256 } from './crypto';

const KEY = 'eventis:v1';

interface Persisted {
  bookings: Booking[];
  eventDate: string | null;
  guests: number;
  saved: string[];
  /** Whether the welcome slides have been seen. */
  onboarded: boolean;
  /** "Become a vendor": an unfinished form, and the submitted application under review. */
  vendorDraft: ApplicationDraft | null;
  vendorApp: VendorApplication | null;
  /** Demo accounts on this device, and who is logged in. */
  accounts: Account[];
  sessionId: string | null;
}

interface Store extends Persisted {
  ready: boolean;
  setEventDate: (d: string) => void;
  setGuests: (n: number) => void;
  toggleSaved: (id: string) => void;
  finishOnboarding: () => void;
  saveVendorDraft: (d: ApplicationDraft | null) => void;
  /** The logged-in account, if any. */
  user: Account | null;
  signUp: (input: SignUpInput) => Promise<SignUpProblems>;
  logIn: (email: string, password: string) => Promise<boolean>;
  logOut: () => void;
  deleteAccount: () => void;
  saveVendorApp: (a: VendorApplication | null) => void;
  createBooking: (input: {
    vendorId: string;
    dateISO: string;
    lines: BookingLine[];
    outdoor: boolean;
    notes: string;
  }) => string;
  advance: (id: string, status: BookingStatus, text: string) => void;
  confirmDelivery: (id: string, delivery: Record<string, { received: number; ok: boolean }>) => void;
  completeReturn: (id: string, returned: Record<string, { returned: number; damaged: number }>) => void;
  cancel: (id: string) => void;
  reportNoShow: (id: string) => void;
  submitReview: (id: string, r: NonNullable<Booking['review']>) => void;
  reset: () => void;
}

const initial: Persisted = {
  bookings: [],
  eventDate: null,
  guests: 150,
  saved: [],
  onboarded: false,
  vendorDraft: null,
  vendorApp: null,
  accounts: [],
  sessionId: null,
};
const Ctx = createContext<Store | null>(null);

const stamp = () => new Date().toISOString();

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setState({ ...initial, ...JSON.parse(raw) });
      } catch {
        // First run or storage unavailable: start from defaults.
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const patchBooking = useCallback((id: string, fn: (b: Booking) => Booking) => {
    setState((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? fn(b) : b)) }));
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      ready,
      setEventDate: (d) => setState((s) => ({ ...s, eventDate: d })),
      setGuests: (n) => setState((s) => ({ ...s, guests: Math.max(10, Math.min(2000, n)) })),
      toggleSaved: (id) =>
        setState((s) => ({
          ...s,
          saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id],
        })),
      finishOnboarding: () => setState((s) => ({ ...s, onboarded: true })),
      saveVendorDraft: (d) => setState((s) => ({ ...s, vendorDraft: d })),
      user: state.accounts.find((a) => a.id === state.sessionId) ?? null,
      signUp: async (input) => {
        const problems = signUpProblems(input, state.accounts);
        if (Object.keys(problems).length) return problems;
        const acct = await createAccount(input, { id: newId(), salt: randomHex(), now: stamp() }, sha256);
        setState((s) => ({ ...s, accounts: [...s.accounts, acct], sessionId: acct.id, onboarded: true }));
        return {};
      },
      logIn: async (email, password) => {
        const acct = await verifyLogin(email, password, state.accounts, sha256);
        if (acct) setState((s) => ({ ...s, sessionId: acct.id, onboarded: true }));
        return !!acct;
      },
      logOut: () => setState((s) => ({ ...s, sessionId: null })),
      deleteAccount: () =>
        setState((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== s.sessionId), sessionId: null })),
      saveVendorApp: (a) => setState((s) => ({ ...s, vendorApp: a })),
      createBooking: ({ vendorId, dateISO, lines, outdoor, notes }) => {
        const vendor = getVendor(vendorId)!;
        const qty: Record<string, number> = {};
        lines.forEach((l) => (qty[l.itemId] = l.qty));
        const id = 'B' + Math.random().toString(36).slice(2, 8).toUpperCase();
        const booking: Booking = {
          id,
          vendorId,
          dateISO,
          lines,
          outdoor,
          notes,
          breakdown: buildBreakdown(vendor, qty),
          policy: vendor.policy,
          status: 'requested',
          createdAt: stamp(),
          events: [{ at: stamp(), text: 'Request sent with the full price and cancellation terms.' }],
        };
        setState((s) => ({ ...s, bookings: [booking, ...s.bookings] }));
        return id;
      },
      advance: (id, status, text) =>
        patchBooking(id, (b) => ({ ...b, status, events: [...b.events, { at: stamp(), text }] })),
      confirmDelivery: (id, delivery) =>
        patchBooking(id, (b) => ({
          ...b,
          status: 'delivered',
          delivery,
          events: [...b.events, { at: stamp(), text: 'Delivery counted and condition noted by you.' }],
        })),
      completeReturn: (id, returned) =>
        patchBooking(id, (b) => {
          const vendor = getVendor(b.vendorId)!;
          const settlement = settleReturn(vendor, b, returned);
          return {
            ...b,
            status: 'completed',
            returned,
            settlement,
            events: [
              ...b.events,
              {
                at: stamp(),
                text:
                  settlement.deduction > 0
                    ? 'Return checked. Deduction applied to the caution deposit.'
                    : 'Return checked. Full caution deposit released.',
              },
            ],
          };
        }),
      cancel: (id) =>
        patchBooking(id, (b) => {
          const p = previewCancellation(b);
          return {
            ...b,
            status: 'cancelled',
            cancellation: { pct: p.pct, refund: p.refund, forfeited: p.forfeited },
            events: [...b.events, { at: stamp(), text: `Cancelled ${p.days} days before the event.` }],
          };
        }),
      reportNoShow: (id) =>
        patchBooking(id, (b) => {
          const paid =
            b.status === 'deposit_paid'
              ? b.breakdown.deposit
              : b.status === 'fully_paid'
                ? b.breakdown.nonRefundable + b.breakdown.caution
                : 0;
          return {
            ...b,
            status: 'vendor_no_show',
            cancellation: { pct: 100, refund: paid, forfeited: 0 },
            events: [
              ...b.events,
              { at: stamp(), text: 'Vendor no-show reported. Everything paid is refunded in full.' },
            ],
          };
        }),
      submitReview: (id, r) =>
        patchBooking(id, (b) => ({
          ...b,
          review: r,
          events: [...b.events, { at: stamp(), text: 'Verified review posted.' }],
        })),
      // Clearing demo data keeps accounts and the session; it is about bookings and drafts.
      reset: () => setState((s) => ({ ...initial, onboarded: true, accounts: s.accounts, sessionId: s.sessionId })),
    }),
    [state, ready, patchBooking]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
