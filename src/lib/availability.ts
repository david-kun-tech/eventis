import { parseISO } from './format';
import type { Booking, BookingStatus, Vendor, VendorItem } from './types';

export const ACTIVE_STATUSES: BookingStatus[] = [
  'requested',
  'accepted',
  'deposit_paid',
  'fully_paid',
  'delivered',
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/**
 * Demo data standing in for other customers' bookings. Deterministic, and busier on
 * Saturdays (wedding day) so the "fully booked" state shows up naturally.
 */
function bookedByOthers(vendorId: string, item: VendorItem, iso: string, isNew?: boolean) {
  // A brand-new listing has no other customers yet.
  if (isNew) return 0;
  const dow = parseISO(iso).getDay();
  let f = 0.1 + 0.45 * hash(vendorId + item.id + iso);
  if (dow === 6) f += 0.4;
  else if (dow === 5 || dow === 0) f += 0.15;
  return Math.min(item.stock, Math.round(item.stock * Math.min(f, 1)));
}

function bookedByMe(bookings: Booking[], vendorId: string, itemId: string, iso: string) {
  return bookings
    .filter((b) => b.vendorId === vendorId && b.dateISO === iso && ACTIVE_STATUSES.includes(b.status))
    .flatMap((b) => b.lines)
    .filter((l) => l.itemId === itemId)
    .reduce((s, l) => s + l.qty, 0);
}

/** Quantity-aware availability: the fix for double-booking and "500 chairs, 3 customers". */
export function unitsLeft(vendor: Vendor, item: VendorItem, iso: string, bookings: Booking[]) {
  return Math.max(
    0,
    item.stock - bookedByOthers(vendor.id, item, iso, vendor.isNew) - bookedByMe(bookings, vendor.id, item.id, iso)
  );
}

/**
 * Whether a vendor can take a booking on a date. A venue is only free when the space
 * itself is: spare chairs don't help if the hall is already booked.
 */
export function vendorAvailableOn(vendor: Vendor, iso: string, bookings: Booking[]) {
  const spaces = vendor.items.filter((it) => it.kind === 'venue');
  const pool = spaces.length ? spaces : vendor.items;
  return pool.some((it) => unitsLeft(vendor, it, iso, bookings) > 0);
}

/** Bookings need this many days' notice (matches the date strips, which start 3 days out). */
export const LEAD_DAYS = 3;

export type DayStatus = 'past' | 'soon' | 'mine' | 'booked' | 'free';

const dayNumber = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

/** What a host sees for one calendar day at this vendor. */
export function dayStatus(vendor: Vendor, iso: string, bookings: Booking[], today = new Date()): DayStatus {
  const ahead = dayNumber(parseISO(iso)) - dayNumber(today);
  if (ahead < 0) return 'past';
  const mine = bookings.some((b) => b.vendorId === vendor.id && b.dateISO === iso && ACTIVE_STATUSES.includes(b.status));
  if (mine) return 'mine';
  if (ahead < LEAD_DAYS) return 'soon';
  return vendorAvailableOn(vendor, iso, bookings) ? 'free' : 'booked';
}

/** ISO dates for a month view, Monday first, padded with nulls to whole weeks. */
export function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}
