import { PLANNER_RULES as P, VENDORS } from '@/data/vendors';
import type { Vendor, VendorItem } from './types';

export type GeneratorSize = 'Small' | 'Medium' | 'Large' | 'Very large';

export interface PowerPlan {
  kva: number;
  size: GeneratorSize;
  /** Plain-language summary of what that much power runs. */
  runs: string;
  acs: number;
  litresPerHour: number;
  fuelLitres: number;
  /** Rounded to the nearest ₦1,000. */
  fuelCost: number;
  /** Cheapest way to rent enough generators, if any rental vendor lists one. */
  rental: { vendor: Vendor; item: VendorItem; units: number; cost: number } | null;
  /** Venues that already have a big enough generator and seat the crowd. */
  venues: { fuelIncluded: Vendor[]; fuelExtra: Vendor[] };
}

function sizeFor(kva: number): GeneratorSize {
  if (kva <= 20) return 'Small';
  if (kva <= 100) return 'Medium';
  if (kva <= 250) return 'Large';
  return 'Very large';
}

/**
 * Turns a guest count into a power plan a first-time host can act on: generator size in
 * words, what it runs, fuel for the event, and where to get it. Rules of thumb only.
 */
export function powerPlan(guests: number, hours: number, vendors: Vendor[] = VENDORS): PowerPlan {
  const kva = Math.max(5, Math.ceil(guests / P.kvaPerGuests));
  const acs = Math.max(0, Math.floor((kva - P.baseKva) / P.kvaPerAc));
  const litresPerHour = Math.round(kva * P.litresPerKvaHour * 10) / 10;
  const fuelLitres = Math.ceil(litresPerHour * hours);
  const fuelCost = Math.round((fuelLitres * P.dieselPerLitre) / 1000) * 1000;

  const runs =
    acs > 0
      ? `Lights, sound and about ${acs} standing ${acs === 1 ? 'AC' : 'ACs'}`
      : 'Lights, fans and a sound system, but no air-conditioning';

  let rental: PowerPlan['rental'] = null;
  for (const vendor of vendors) {
    for (const item of vendor.items) {
      if (item.kind !== 'generator' || !item.kva) continue;
      const units = Math.ceil(kva / item.kva);
      const cost = units * item.price;
      if (!rental || cost < rental.cost) rental = { vendor, item, units, cost };
    }
  }

  const powered = vendors.filter(
    (v) => v.category === 'venue' && v.power && v.power.kva >= kva && (v.capacity ?? 0) >= guests
  );

  return {
    kva,
    size: sizeFor(kva),
    runs,
    acs,
    litresPerHour,
    fuelLitres,
    fuelCost,
    rental,
    venues: {
      fuelIncluded: powered.filter((v) => v.power!.fuelIncluded),
      fuelExtra: powered.filter((v) => !v.power!.fuelIncluded),
    },
  };
}
