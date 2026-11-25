import { describe, expect, it } from 'vitest';

import { getVendor } from '@/data/vendors';
import { unitsLeft } from '@/lib/availability';
import { refundPctFor } from '@/lib/policies';
import { buildBreakdown, previewCancellation, settleReturn } from '@/lib/pricing';
import { addDays, toISO } from '@/lib/format';
import type { Booking } from '@/lib/types';

const chairs = getVendor('v5')!;
const hall = getVendor('v2')!;

function booking(partial: Partial<Booking>): Booking {
  const bd = buildBreakdown(chairs, { chair: 200, round: 25 });
  return {
    id: 'T1',
    vendorId: 'v5',
    dateISO: toISO(addDays(new Date(), 20)),
    lines: [
      { itemId: 'chair', qty: 200 },
      { itemId: 'round', qty: 25 },
    ],
    outdoor: false,
    notes: '',
    breakdown: bd,
    policy: 'flexible',
    status: 'deposit_paid',
    createdAt: new Date().toISOString(),
    events: [],
    ...partial,
  };
}

describe('price breakdown', () => {
  it('adds up and splits into deposit and balance', () => {
    const bd = buildBreakdown(chairs, { chair: 200, round: 25 });
    expect(bd.subtotal).toBe(200 * 450 + 25 * 3500);
    expect(bd.total).toBe(bd.nonRefundable + bd.caution);
    expect(bd.deposit + bd.balance).toBe(bd.total);
  });

  it('adds generator fuel when the venue does not include it', () => {
    const bd = buildBreakdown(hall, { hall: 1 });
    expect(bd.fuel).toBe(60000);
  });

  it('charges nothing for an empty basket', () => {
    expect(buildBreakdown(chairs, {}).total).toBe(0);
  });
});

describe('cancellation policies', () => {
  it('applies tiers by days before the event', () => {
    expect(refundPctFor('flexible', 8)).toBe(100);
    expect(refundPctFor('flexible', 4)).toBe(50);
    expect(refundPctFor('flexible', 1)).toBe(0);
    expect(refundPctFor('strict', 40)).toBe(50);
    expect(refundPctFor('strict', 10)).toBe(0);
  });

  it('refunds the deposit in full 20 days out on a flexible policy', () => {
    const b = booking({});
    expect(previewCancellation(b).refund).toBe(b.breakdown.deposit);
  });
});

describe('return settlement', () => {
  it('deducts missing items at replacement value and damaged at 50%', () => {
    const b = booking({ status: 'delivered' });
    const r = settleReturn(chairs, b, {
      chair: { returned: 198, damaged: 2 },
      round: { returned: 25, damaged: 0 },
    });
    // 2 missing × 8500 + 2 damaged × 8500 × 0.5
    expect(r.deduction).toBe(2 * 8500 + 2 * 4250);
    expect(r.refund).toBe(b.breakdown.caution - r.deduction);
  });

  it('never deducts more than the caution deposit', () => {
    const b = booking({ status: 'delivered' });
    const r = settleReturn(chairs, b, { chair: { returned: 0, damaged: 0 }, round: { returned: 0, damaged: 0 } });
    expect(r.deduction).toBe(b.breakdown.caution);
    expect(r.refund).toBe(0);
  });
});

describe('availability', () => {
  it('reduces stock when the customer already has an active booking', () => {
    const item = chairs.items.find((i) => i.id === 'chair')!;
    const date = toISO(addDays(new Date(), 10));
    const before = unitsLeft(chairs, item, date, []);
    const mine = booking({ dateISO: date, status: 'accepted', lines: [{ itemId: 'chair', qty: 50 }] });
    expect(unitsLeft(chairs, item, date, [mine])).toBe(Math.max(0, before - 50));
  });

  it('frees the stock again after a cancellation', () => {
    const item = chairs.items.find((i) => i.id === 'chair')!;
    const date = toISO(addDays(new Date(), 10));
    const gone = booking({ dateISO: date, status: 'cancelled', lines: [{ itemId: 'chair', qty: 50 }] });
    expect(unitsLeft(chairs, item, date, [gone])).toBe(unitsLeft(chairs, item, date, []));
  });
});

describe('powerPlan', () => {
  it('turns 150 guests into a medium generator with ACs and a fuel estimate', async () => {
    const { powerPlan } = await import('@/lib/power');
    const p = powerPlan(150, 6);
    expect(p.kva).toBe(60);
    expect(p.size).toBe('Medium');
    expect(p.acs).toBe(16); // (60 - 10 base) / 3 kVA per AC
    expect(p.litresPerHour).toBe(9);
    expect(p.fuelLitres).toBe(54);
    expect(p.fuelCost).toBe(65000); // 54 L at ₦1,200, rounded to ₦1,000
  });

  it('picks enough rental generators to cover the load', async () => {
    const { powerPlan } = await import('@/lib/power');
    const p = powerPlan(400, 6); // 160 kVA
    expect(p.rental?.item.kva).toBe(60);
    expect(p.rental?.units).toBe(3);
    expect(p.rental?.cost).toBe(3 * p.rental!.item.price);
  });

  it('only suggests venues with enough power that also seat everyone', async () => {
    const { powerPlan } = await import('@/lib/power');
    const p = powerPlan(300, 6); // 120 kVA
    for (const v of [...p.venues.fuelIncluded, ...p.venues.fuelExtra]) {
      expect(v.power!.kva).toBeGreaterThanOrEqual(120);
      expect(v.capacity!).toBeGreaterThanOrEqual(300);
    }
  });

  it('says plainly when a small crowd needs no AC', async () => {
    const { powerPlan } = await import('@/lib/power');
    expect(powerPlan(20, 4).runs).toMatch(/no air-conditioning/);
  });
});

describe('vendor verification', () => {
  it('validates Nigerian identifiers', async () => {
    const v = await import('@/lib/verification');
    expect(v.ninValid('12345678901')).toBe(true);
    expect(v.ninValid('1234567890')).toBe(false);
    expect(v.ninValid('1234567890a')).toBe(false);
    expect(v.nubanValid('0123456789')).toBe(true);
    expect(v.nubanValid('012345678')).toBe(false);
    expect(v.phoneValid('0803 123 4567')).toBe(true);
    expect(v.phoneValid('+2348031234567')).toBe(true);
    expect(v.phoneValid('0603 123 4567')).toBe(false);
    expect(v.cacValid('BN', 'BN 1234567')).toBe(true);
    expect(v.cacValid('RC', '123456')).toBe(true);
    expect(v.cacValid('RC', 'BN 1234567')).toBe(false);
  });

  it('matches names regardless of order, case and middle names', async () => {
    const { namesMatch } = await import('@/lib/verification');
    expect(namesMatch('OBI AMAKA CHIDINMA', 'Amaka Obi')).toBe(true);
    expect(namesMatch('Amaka Obi', 'Amaka Okafor')).toBe(false);
    expect(namesMatch('Amaka', 'Amaka Obi')).toBe(false);
  });

  function app(overrides: Partial<{ accountName: string; cac: 'BN' | 'none' }> = {}) {
    return import('@/lib/verification').then((v) => {
      const d = v.emptyDraft();
      d.business.name = 'Seamless Events';
      d.owner = { legalName: 'Amaka Obi', ninLast4: '8901', selfie: true };
      d.registration = { type: overrides.cac ?? 'BN', number: 'BN 1234567' };
      d.payout = { ...d.payout, bank: 'GTBank', accountLast4: '6789', accountName: overrides.accountName ?? 'OBI AMAKA' };
      return { v, a: { draft: d, submittedAt: '', checks: v.freshChecks(d), inspectionDate: null, events: [] } };
    });
  }

  it('passes automatic checks when the bank name matches, then waits on people checks', async () => {
    const { v, a } = await app();
    const r = v.runAutomaticChecks(a);
    expect(r.checks.identity.state).toBe('passed');
    expect(r.checks.business.state).toBe('passed');
    expect(r.checks.bank.state).toBe('passed');
    expect(v.statusOf(r)).toBe('in_review');
    r.checks.references = { state: 'passed' };
    expect(v.statusOf(r)).toBe('inspection');
    r.checks.inspection = { state: 'passed' };
    expect(v.statusOf(r)).toBe('verified');
  });

  it('requests changes when the payout account is in someone else\'s name', async () => {
    const { v, a } = await app({ accountName: 'Chidi Eze' });
    const r = v.runAutomaticChecks(a);
    expect(r.checks.bank.state).toBe('failed');
    expect(v.statusOf(r)).toBe('changes_requested');
  });

  it('accepts a payout account in the business name, and skips CAC for unregistered vendors', async () => {
    const { v, a } = await app({ accountName: 'SEAMLESS EVENTS', cac: 'none' });
    const r = v.runAutomaticChecks(a);
    expect(r.checks.bank.state).toBe('passed');
    expect(r.checks.business.state).toBe('skipped');
  });

  it('blocks each step until its required fields are valid', async () => {
    const v = await import('@/lib/verification');
    const d = v.emptyDraft();
    expect(v.stepProblems(d, 0)).toContain('Business name');
    d.business = { name: 'Eko Chairs', category: 'rental', city: 'Lagos', area: 'Ikeja', phone: '08031234567', about: '' };
    expect(v.stepProblems(d, 0)).toEqual([]);
    expect(v.stepProblems(d, 3)).toContain('Two past clients we can call');
  });
});

describe('venue calendar', () => {
  it('treats a venue as booked when the hall is taken, even if chairs are left', async () => {
    const { unitsLeft: left, vendorAvailableOn } = await import('@/lib/availability');
    const { toISO: iso, addDays: add } = await import('@/lib/format');
    const pavilion = getVendor('v1')!;
    // Find a date where the hall is gone but chairs remain.
    let date = '';
    for (let i = 3; i < 120 && !date; i++) {
      const d = iso(add(new Date(), i));
      const hall = pavilion.items.find((x) => x.kind === 'venue')!;
      const chairs = pavilion.items.find((x) => x.id === 'chairs')!;
      if (left(pavilion, hall, d, []) === 0 && left(pavilion, chairs, d, []) > 0) date = d;
    }
    expect(date).not.toBe('');
    expect(vendorAvailableOn(pavilion, date, [])).toBe(false);
  });

  it('labels days as past, too soon, mine, booked or free', async () => {
    const { dayStatus } = await import('@/lib/availability');
    const pavilion = getVendor('v1')!;
    const today = new Date(2027, 0, 4); // a Monday
    expect(dayStatus(pavilion, '2027-01-03', [], today)).toBe('past');
    expect(dayStatus(pavilion, '2027-01-05', [], today)).toBe('soon');
    expect(dayStatus(pavilion, '2027-01-09', [], today)).toBe('booked'); // Saturdays are the busy wedding day
    const mine = booking({ vendorId: 'v1', dateISO: '2027-01-05', status: 'deposit_paid' });
    expect(dayStatus(pavilion, '2027-01-05', [mine], today)).toBe('mine');
    const statuses = Array.from({ length: 14 }, (_, i) => dayStatus(pavilion, toISO(addDays(today, 3 + i)), [], today));
    expect(statuses).toContain('free');
  });

  it('lays out a month Monday-first in whole weeks', async () => {
    const { monthGrid } = await import('@/lib/availability');
    const feb = monthGrid(2027, 1); // 1 Feb 2027 is a Monday
    expect(feb[0]).toBe('2027-02-01');
    expect(feb.length % 7).toBe(0);
    const dec = monthGrid(2026, 11); // 1 Dec 2026 is a Tuesday
    expect(dec[0]).toBeNull();
    expect(dec[1]).toBe('2026-12-01');
    expect(dec.filter(Boolean)).toHaveLength(31);
  });
});
