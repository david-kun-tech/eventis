export type Category = 'venue' | 'rental' | 'decor' | 'planner';
export type City = 'Abuja' | 'Lagos' | 'Port Harcourt';
export type ItemKind =
  | 'venue'
  | 'chair'
  | 'table'
  | 'tent'
  | 'toilet'
  | 'sound'
  | 'generator'
  | 'tableware'
  | 'decor'
  | 'addon'
  | 'planning';
export type PolicyId = 'flexible' | 'moderate' | 'strict';

export interface VendorItem {
  id: string;
  name: string;
  kind: ItemKind;
  unit: string;
  price: number;
  /** Units the vendor owns / can serve on one day. */
  stock: number;
  /** Guests one unit covers (e.g. a round table seats 8). Used by the planner. */
  capacityPerUnit?: number;
  /** What the vendor charges if the item is lost. Damaged items are charged at 50%. */
  replacement?: number;
  /** Whether the item physically comes back (needs a return check). */
  returnable: boolean;
  /** Generators only: output per unit, and whether the day rate includes diesel. */
  kva?: number;
  fuelIncluded?: boolean;
}

export interface Review {
  id: string;
  author: string;
  stars: number;
  text: string;
  date: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: Category;
  city: City;
  area: string;
  tagline: string;
  /** Unsplash photo id (e.g. 'photo-123-abc'); see photoUrl(). */
  photo?: string;
  /** A newly verified listing: no ratings or job history yet. */
  isNew?: boolean;
  rating: number;
  ratingCount: number;
  sub: { punctuality: number; asDescribed: number; value: number; communication: number };
  reliability: { completed: number; onTimePct: number; cancelledPct: number; responseMins: number };
  policy: PolicyId;
  arrival: string;
  deliveryFee: number;
  /** Refundable caution deposit as a % of the items subtotal. */
  cautionPct: number;
  capacity?: number;
  outdoor?: boolean;
  power?: { kva: number; autoChangeover: boolean; fuelIncluded: boolean; fuelFee?: number };
  items: VendorItem[];
  reviews: Review[];
}

export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'deposit_paid'
  | 'fully_paid'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'vendor_no_show';

export interface BookingLine {
  itemId: string;
  qty: number;
}

export interface BookingEvent {
  at: string;
  text: string;
}

export interface BreakdownLine {
  itemId: string;
  name: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface Breakdown {
  lines: BreakdownLine[];
  subtotal: number;
  delivery: number;
  fuel: number;
  caution: number;
  /** subtotal + delivery + fuel: what the vendor keeps. */
  nonRefundable: number;
  /** Total the customer pays in all (non-refundable part + caution). */
  total: number;
  deposit: number;
  /** Due 3 days before the event: rest of the non-refundable part + caution. */
  balance: number;
}

export interface Booking {
  id: string;
  vendorId: string;
  dateISO: string;
  lines: BookingLine[];
  outdoor: boolean;
  notes: string;
  breakdown: Breakdown;
  policy: PolicyId;
  status: BookingStatus;
  createdAt: string;
  events: BookingEvent[];
  delivery?: Record<string, { received: number; ok: boolean }>;
  returned?: Record<string, { returned: number; damaged: number }>;
  settlement?: { deduction: number; refund: number; details: string[] };
  cancellation?: { pct: number; refund: number; forfeited: number };
  review?: { stars: number; punctuality: number; asDescribed: number; text: string };
}
