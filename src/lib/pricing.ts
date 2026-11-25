import { daysUntil } from './format';
import { POLICIES, refundPctFor } from './policies';
import type { Booking, Breakdown, Vendor } from './types';

const round100 = (n: number) => Math.round(n / 100) * 100;

/** All-in price: items + delivery + generator fuel + refundable caution, no surprises. */
export function buildBreakdown(vendor: Vendor, qtyByItem: Record<string, number>): Breakdown {
  const lines = vendor.items
    .filter((it) => (qtyByItem[it.id] ?? 0) > 0)
    .map((it) => {
      const qty = qtyByItem[it.id];
      return { itemId: it.id, name: it.name, qty, unitPrice: it.price, amount: it.price * qty };
    });
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const has = subtotal > 0;
  const delivery = has ? vendor.deliveryFee : 0;
  const fuel =
    has && vendor.category === 'venue' && vendor.power && !vendor.power.fuelIncluded
      ? vendor.power.fuelFee ?? 0
      : 0;
  const caution = has ? round100((subtotal * vendor.cautionPct) / 100) : 0;
  const nonRefundable = subtotal + delivery + fuel;
  const deposit = round100((nonRefundable * POLICIES[vendor.policy].depositPct) / 100);
  return {
    lines,
    subtotal,
    delivery,
    fuel,
    caution,
    nonRefundable,
    total: nonRefundable + caution,
    deposit,
    balance: nonRefundable - deposit + caution,
  };
}

/** What the customer has actually paid so far, split into vendor money and caution. */
export function paidSoFar(b: Booking) {
  const { deposit, nonRefundable, caution } = b.breakdown;
  switch (b.status) {
    case 'deposit_paid':
      return { vendorMoney: deposit, caution: 0 };
    case 'fully_paid':
    case 'delivered':
    case 'completed':
      return { vendorMoney: nonRefundable, caution };
    default:
      return { vendorMoney: 0, caution: 0 };
  }
}

export function previewCancellation(b: Booking) {
  const days = daysUntil(b.dateISO);
  const pct = refundPctFor(b.policy, days);
  const paid = paidSoFar(b);
  const refundVendorPart = Math.round((paid.vendorMoney * pct) / 100);
  return {
    days,
    pct,
    refund: refundVendorPart + paid.caution,
    forfeited: paid.vendorMoney - refundVendorPart,
  };
}

/** Return check: missing items at replacement value, damaged items at 50%. */
export function settleReturn(
  vendor: Vendor,
  b: Booking,
  returned: Record<string, { returned: number; damaged: number }>
) {
  let deduction = 0;
  const details: string[] = [];
  for (const line of b.lines) {
    const item = vendor.items.find((i) => i.id === line.itemId);
    if (!item || !item.returnable) continue;
    const r = returned[line.itemId] ?? { returned: line.qty, damaged: 0 };
    const missing = Math.max(0, line.qty - r.returned);
    const damaged = Math.min(r.damaged, r.returned);
    const unit = item.replacement ?? item.price * 10;
    const cost = missing * unit + Math.round(damaged * unit * 0.5);
    if (cost > 0) {
      deduction += cost;
      const parts = [];
      if (missing) parts.push(`${missing} missing`);
      if (damaged) parts.push(`${damaged} damaged`);
      details.push(`${item.name}: ${parts.join(', ')}`);
    }
  }
  deduction = Math.min(deduction, b.breakdown.caution);
  return { deduction, refund: b.breakdown.caution - deduction, details };
}
