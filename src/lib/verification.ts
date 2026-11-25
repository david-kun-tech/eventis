import type { Category, City, PolicyId } from './types';

/**
 * Vendor onboarding and verification rules.
 *
 * Privacy: the demo never stores a full NIN or account number. Forms validate the full
 * value, then keep only the last 4 digits, the way a real app would show "•••• 1234".
 */

export type CacType = 'BN' | 'RC' | 'none';

export interface OfferItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
}

export interface ApplicationDraft {
  business: { name: string; category: Category | null; city: City | null; area: string; phone: string; about: string };
  owner: { legalName: string; ninLast4: string | null; selfie: boolean };
  registration: { type: CacType | null; number: string };
  offer: {
    items: OfferItem[];
    capacity: number | null;
    kva: number | null;
    fuelIncluded: boolean;
    autoChangeover: boolean;
    references: { name: string; phone: string }[];
  };
  payout: { bank: string | null; accountLast4: string | null; accountName: string; policy: PolicyId; cautionPct: number };
  pledges: { showUp: boolean; accurateStock: boolean; honestReviews: boolean };
}

export const emptyDraft = (): ApplicationDraft => ({
  business: { name: '', category: null, city: null, area: '', phone: '', about: '' },
  owner: { legalName: '', ninLast4: null, selfie: false },
  registration: { type: null, number: '' },
  offer: {
    items: [],
    capacity: null,
    kva: null,
    fuelIncluded: false,
    autoChangeover: false,
    references: [
      { name: '', phone: '' },
      { name: '', phone: '' },
    ],
  },
  payout: { bank: null, accountLast4: null, accountName: '', policy: 'moderate', cautionPct: 10 },
  pledges: { showUp: false, accurateStock: false, honestReviews: false },
});

// ---------- Format checks ----------

/** National Identification Number: 11 digits. */
export const ninValid = (s: string) => /^\d{11}$/.test(s.replace(/\s/g, ''));

/** NUBAN bank account number: 10 digits. */
export const nubanValid = (s: string) => /^\d{10}$/.test(s.replace(/\s/g, ''));

/** Nigerian mobile: 0803 123 4567 or +234 803 123 4567. */
export function phoneValid(s: string) {
  const t = s.replace(/[\s-]/g, '');
  return /^(\+234|0)[789][01]\d{8}$/.test(t);
}

/** CAC: business names are BN + digits, companies RC + digits (the RC prefix is often left off). */
export function cacValid(type: CacType, s: string) {
  const t = s.replace(/\s/g, '').toUpperCase();
  if (type === 'BN') return /^(BN)?\d{6,8}$/.test(t);
  if (type === 'RC') return /^(RC)?\d{5,8}$/.test(t);
  return true;
}

const tokens = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

/**
 * Loose name match, as banks and NIMC order names differently ("OBI AMAKA C." vs
 * "Amaka Obi"): every word of the shorter name, at least two of them, must appear in the other.
 */
export function namesMatch(a: string, b: string) {
  const [x, y] = [tokens(a), tokens(b)].sort((p, q) => p.length - q.length);
  if (x.length < 2) return false;
  return x.every((w) => y.includes(w));
}

// ---------- Steps ----------

export const STEPS = ['Business', 'Identity', 'Registration', 'Your offer', 'Payouts'] as const;
export type StepIndex = 0 | 1 | 2 | 3 | 4;

/** What still blocks a step. Empty means the applicant can continue. */
export function stepProblems(d: ApplicationDraft, step: StepIndex): string[] {
  const p: string[] = [];
  if (step === 0) {
    if (d.business.name.trim().length < 3) p.push('Business name');
    if (!d.business.category) p.push('Category');
    if (!d.business.city) p.push('City');
    if (!d.business.area.trim()) p.push('Area');
    if (!phoneValid(d.business.phone)) p.push('A valid Nigerian phone number');
  }
  if (step === 1) {
    if (tokens(d.owner.legalName).length < 2) p.push('Your full legal name, as on your NIN');
    if (!d.owner.ninLast4) p.push('An 11-digit NIN');
    if (!d.owner.selfie) p.push('A selfie for the face match');
  }
  if (step === 2) {
    if (!d.registration.type) p.push('Whether you are registered with CAC');
    else if (d.registration.type !== 'none' && !cacValid(d.registration.type, d.registration.number))
      p.push(d.registration.type === 'BN' ? 'A BN number, like BN 1234567' : 'An RC number, like RC 123456');
  }
  if (step === 3) {
    const okItems = d.offer.items.filter((i) => i.name.trim() && i.price > 0 && i.stock > 0);
    if (okItems.length === 0) p.push('At least one item with a price and quantity');
    if (d.business.category === 'venue') {
      if (!d.offer.capacity || d.offer.capacity < 10) p.push('Venue capacity');
    }
    const refs = d.offer.references.filter((r) => r.name.trim() && phoneValid(r.phone));
    if (refs.length < 2) p.push('Two past clients we can call');
  }
  if (step === 4) {
    if (!d.payout.bank) p.push('Bank');
    if (!d.payout.accountLast4) p.push('A 10-digit account number');
    if (tokens(d.payout.accountName).length < 2) p.push('Account name, as your bank shows it');
    if (!d.pledges.showUp || !d.pledges.accurateStock || !d.pledges.honestReviews) p.push('All three pledges');
  }
  return p;
}

// ---------- Checks ----------

export type CheckId = 'identity' | 'business' | 'bank' | 'references' | 'inspection';
export type CheckState = 'waiting' | 'passed' | 'failed' | 'skipped';

export interface Check {
  state: CheckState;
  note?: string;
}

export const CHECKS: { id: CheckId; title: string; by: 'Automatic' | 'Our team'; what: string; fixStep: StepIndex }[] = [
  {
    id: 'identity',
    title: 'Identity',
    by: 'Automatic',
    what: 'Your NIN is checked against NIMC records and your selfie is matched to the NIN photo.',
    fixStep: 1,
  },
  {
    id: 'business',
    title: 'Business registration',
    by: 'Automatic',
    what: 'Your BN or RC number is looked up on the CAC register and the name compared.',
    fixStep: 2,
  },
  {
    id: 'bank',
    title: 'Payout account',
    by: 'Automatic',
    what: 'The account name your bank returns must match your ID or your registered business name.',
    fixStep: 4,
  },
  {
    id: 'references',
    title: 'References',
    by: 'Our team',
    what: 'We call two past clients to confirm you delivered what you promised.',
    fixStep: 3,
  },
  {
    id: 'inspection',
    title: 'Stock or venue inspection',
    by: 'Our team',
    what: 'A visit to count your stock or walk your venue, test the generator and take listing photos.',
    fixStep: 3,
  },
];

export interface VendorApplication {
  draft: ApplicationDraft;
  submittedAt: string;
  checks: Record<CheckId, Check>;
  inspectionDate: string | null;
  events: { at: string; text: string }[];
}

export type AppStatus = 'in_review' | 'changes_requested' | 'inspection' | 'verified';

const done = (c: Check) => c.state === 'passed' || c.state === 'skipped';

export function statusOf(app: VendorApplication): AppStatus {
  const c = app.checks;
  if (Object.values(c).some((x) => x.state === 'failed')) return 'changes_requested';
  if (done(c.identity) && done(c.business) && done(c.bank) && done(c.references)) {
    return done(c.inspection) ? 'verified' : 'inspection';
  }
  return 'in_review';
}

export function freshChecks(d: ApplicationDraft, keep?: Record<CheckId, Check>): Record<CheckId, Check> {
  return {
    identity: { state: 'waiting' },
    business: d.registration.type === 'none' ? { state: 'skipped', note: 'Not registered with CAC' } : { state: 'waiting' },
    bank: { state: 'waiting' },
    references: keep?.references.state === 'passed' ? keep.references : { state: 'waiting' },
    inspection: { state: 'waiting' },
  };
}

/**
 * Simulated results of the automatic checks. Identity and CAC pass when the formats were
 * valid (a real app would call NIMC and CAC here); the bank check really compares names,
 * so a mismatched account name fails the way it would in production.
 */
export function runAutomaticChecks(app: VendorApplication): VendorApplication {
  const d = app.draft;
  const checks = { ...app.checks };
  if (checks.identity.state === 'waiting') {
    checks.identity = d.owner.selfie && d.owner.ninLast4 ? { state: 'passed', note: `NIN ending ${d.owner.ninLast4} matched` } : { state: 'failed', note: 'NIN or selfie missing' };
  }
  if (checks.business.state === 'waiting') {
    checks.business = { state: 'passed', note: `${d.registration.type} ${d.registration.number.replace(/^(BN|RC)\s*/i, '')} found on the CAC register` };
  }
  if (checks.bank.state === 'waiting') {
    const ok = namesMatch(d.payout.accountName, d.owner.legalName) || namesMatch(d.payout.accountName, d.business.name);
    checks.bank = ok
      ? { state: 'passed', note: `${d.payout.bank} •••• ${d.payout.accountLast4} matches` }
      : { state: 'failed', note: `"${d.payout.accountName}" does not match your ID or business name` };
  }
  return { ...app, checks };
}

/** Who may still edit what: identity and payout details are locked once verified. */
export const canEdit = (app: VendorApplication | null) => !app || statusOf(app) !== 'verified';
