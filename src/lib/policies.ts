import type { PolicyId } from './types';

interface Policy {
  label: string;
  depositPct: number;
  /** Highest minDays first. Refund % applies to the non-refundable amount already paid. */
  tiers: { minDays: number; refundPct: number }[];
  summary: string;
}

/**
 * Illustrative cancellation policies for the demo. A 40-50% deposit is the common
 * range for event vendors; the tiers below are a proposal, not legal terms.
 */
export const POLICIES: Record<PolicyId, Policy> = {
  flexible: {
    label: 'Flexible',
    depositPct: 30,
    tiers: [
      { minDays: 7, refundPct: 100 },
      { minDays: 3, refundPct: 50 },
      { minDays: 0, refundPct: 0 },
    ],
    summary: 'Full refund up to 7 days before, 50% from 3 to 6 days before, none after.',
  },
  moderate: {
    label: 'Moderate',
    depositPct: 40,
    tiers: [
      { minDays: 14, refundPct: 100 },
      { minDays: 7, refundPct: 50 },
      { minDays: 0, refundPct: 0 },
    ],
    summary: 'Full refund up to 14 days before, 50% from 7 to 13 days before, none after.',
  },
  strict: {
    label: 'Strict',
    depositPct: 50,
    tiers: [
      { minDays: 30, refundPct: 50 },
      { minDays: 0, refundPct: 0 },
    ],
    summary: '50% refund up to 30 days before, none after.',
  },
};

export function refundPctFor(policy: PolicyId, daysBefore: number) {
  for (const t of POLICIES[policy].tiers) {
    if (daysBefore >= t.minDays) return t.refundPct;
  }
  return 0;
}
