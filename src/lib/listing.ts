import { getVendor, VENDORS } from '@/data/vendors';
import type { Category, ItemKind, Vendor, VendorItem } from './types';
import { statusOf, type VendorApplication } from './verification';

/** The one listing this device can own: the user's verified vendor application. */
export const MY_LISTING_ID = 'my-listing';

const DEFAULT_KIND: Record<Category, ItemKind> = { venue: 'venue', rental: 'addon', decor: 'decor', planner: 'planning' };

/** Best guess at an item's kind from its name, so price comparisons and the planner still work. */
function kindFor(name: string, category: Category): ItemKind {
  const n = name.toLowerCase();
  if (/chair|seat/.test(n)) return 'chair';
  if (/table/.test(n)) return 'table';
  if (/tent|canopy|marquee/.test(n)) return 'tent';
  if (/toilet/.test(n)) return 'toilet';
  if (/generator|kva/.test(n)) return 'generator';
  if (/sound|speaker|\bpa\b|dj|mic/.test(n)) return 'sound';
  if (/plate|cutlery|glass|cup|tableware/.test(n)) return 'tableware';
  return DEFAULT_KIND[category];
}

/** A verified application as a bookable listing; null until every check has passed. */
export function listingFromApplication(app: VendorApplication | null): Vendor | null {
  if (!app || statusOf(app) !== 'verified' || !app.draft.business.category || !app.draft.business.city) return null;
  const d = app.draft;
  const category = d.business.category!;
  const items: VendorItem[] = d.offer.items
    .filter((i) => i.name.trim() && i.price > 0 && i.stock > 0)
    .map((i, idx) => ({
      id: i.id,
      name: i.name.trim(),
      // A venue's first item is the space itself, which is what venue availability checks.
      kind: category === 'venue' && idx === 0 ? 'venue' : kindFor(i.name, category),
      unit: i.unit || 'piece',
      price: i.price,
      stock: i.stock,
      returnable: category === 'rental',
      replacement: category === 'rental' ? i.price * 10 : undefined,
      capacityPerUnit: category === 'venue' && idx === 0 ? d.offer.capacity ?? undefined : undefined,
    }));
  return {
    id: MY_LISTING_ID,
    name: d.business.name.trim(),
    category,
    city: d.business.city!,
    area: d.business.area.trim(),
    tagline: d.business.about.trim() || `Newly verified ${category} in ${d.business.area.trim()}, ${d.business.city}`,
    isNew: true,
    rating: 0,
    ratingCount: 0,
    sub: { punctuality: 0, asDescribed: 0, value: 0, communication: 0 },
    reliability: { completed: 0, onTimePct: 0, cancelledPct: 0, responseMins: 0 },
    policy: d.payout.policy,
    arrival: 'Arrival time is confirmed when you book',
    deliveryFee: 0,
    cautionPct: d.payout.cautionPct,
    capacity: category === 'venue' ? d.offer.capacity ?? undefined : undefined,
    power: category === 'venue' && d.offer.kva ? { kva: d.offer.kva, autoChangeover: d.offer.autoChangeover, fuelIncluded: d.offer.fuelIncluded } : undefined,
    items,
    reviews: [],
  };
}

/** Sample vendors plus the user's own listing once it is verified. */
export function allVendors(app: VendorApplication | null): Vendor[] {
  const mine = listingFromApplication(app);
  return mine ? [...VENDORS, mine] : VENDORS;
}

export function findVendor(id: string, app: VendorApplication | null): Vendor | undefined {
  return id === MY_LISTING_ID ? listingFromApplication(app) ?? undefined : getVendor(id);
}
