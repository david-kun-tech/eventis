import type { Category, City, ItemKind, PolicyId, Review, Vendor, VendorItem } from '@/lib/types';

/**
 * All vendors, prices and reviews are fictional sample data for the portfolio demo.
 * Prices are plausible Naira figures, not quotes from real businesses.
 * Photos are free-licence images from Unsplash (https://unsplash.com/license), hotlinked
 * from images.unsplash.com; they illustrate the category, not the fictional vendor.
 */

const it = (
  id: string,
  name: string,
  kind: ItemKind,
  unit: string,
  price: number,
  stock: number,
  o: Partial<VendorItem> = {}
): VendorItem => ({ id, name, kind, unit, price, stock, returnable: false, ...o });

const rv = (id: string, author: string, stars: number, text: string, date: string): Review => ({
  id,
  author,
  stars,
  text,
  date,
});

interface Seed {
  id: string;
  name: string;
  category: Category;
  city: City;
  area: string;
  tagline: string;
  photo?: string;
  rating: number;
  ratingCount: number;
  sub: [number, number, number, number];
  rel: [number, number, number, number];
  policy: PolicyId;
  arrival: string;
  deliveryFee: number;
  cautionPct: number;
  capacity?: number;
  outdoor?: boolean;
  power?: Vendor['power'];
  items: VendorItem[];
  reviews: Review[];
}

const mk = (s: Seed): Vendor => ({
  id: s.id,
  name: s.name,
  category: s.category,
  city: s.city,
  area: s.area,
  tagline: s.tagline,
  photo: s.photo,
  rating: s.rating,
  ratingCount: s.ratingCount,
  sub: { punctuality: s.sub[0], asDescribed: s.sub[1], value: s.sub[2], communication: s.sub[3] },
  reliability: {
    completed: s.rel[0],
    onTimePct: s.rel[1],
    cancelledPct: s.rel[2],
    responseMins: s.rel[3],
  },
  policy: s.policy,
  arrival: s.arrival,
  deliveryFee: s.deliveryFee,
  cautionPct: s.cautionPct,
  capacity: s.capacity,
  outdoor: s.outdoor,
  power: s.power,
  items: s.items,
  reviews: s.reviews,
});

export const VENDORS: Vendor[] = [
  mk({
    id: 'v1',
    photo: 'photo-1738550902573-5964f8a2b723',
    name: 'Jabi Lake Pavilion',
    category: 'venue',
    city: 'Abuja',
    area: 'Jabi',
    tagline: 'Lakeside hall with in-house power and parking for 120 cars',
    rating: 4.8,
    ratingCount: 112,
    sub: [4.9, 4.7, 4.5, 4.8],
    rel: [214, 98, 1, 12],
    policy: 'moderate',
    arrival: 'Hall open from 8am on event day',
    deliveryFee: 0,
    cautionPct: 10,
    capacity: 400,
    outdoor: false,
    power: { kva: 250, autoChangeover: true, fuelIncluded: true },
    items: [
      it('hall', 'Main hall (full day)', 'venue', 'day', 650000, 1, { capacityPerUnit: 400 }),
      it('ac', 'Air-conditioning package', 'addon', 'day', 80000, 1),
      it('chairs', 'Banquet chairs', 'chair', 'chair', 600, 450, { replacement: 9000, returnable: true }),
    ],
    reviews: [
      rv('r1', 'Ngozi A.', 5, 'Light never blinked during our reception. Generator switched over on its own.', '2026-09-12'),
      rv('r2', 'Tunde B.', 4, 'Lovely hall. Parking was tight once guests exceeded 300.', '2026-08-02'),
    ],
  }),
  mk({
    id: 'v2',
    photo: 'photo-1780542900375-0cf459e38fbb',
    name: 'Maitama Grand Events Centre',
    category: 'venue',
    city: 'Abuja',
    area: 'Maitama',
    tagline: 'Indoor ballroom for up to 600 guests',
    rating: 4.5,
    ratingCount: 86,
    sub: [4.4, 4.6, 4.1, 4.5],
    rel: [160, 94, 3, 30],
    policy: 'strict',
    arrival: 'Setup access from noon the day before',
    deliveryFee: 0,
    cautionPct: 12,
    capacity: 600,
    outdoor: false,
    power: { kva: 200, autoChangeover: false, fuelIncluded: false, fuelFee: 60000 },
    items: [
      it('hall', 'Grand ballroom (full day)', 'venue', 'day', 900000, 1, { capacityPerUnit: 600 }),
      it('sound', 'House PA system', 'sound', 'day', 120000, 1, { replacement: 1500000, returnable: true }),
    ],
    reviews: [
      rv('r1', 'Amina S.', 5, 'Beautiful space and the manager answered every question before booking.', '2026-10-01'),
      rv('r2', 'Chidi O.', 3, 'Generator fuel was an extra charge we only learned about at the end.', '2026-07-19'),
    ],
  }),
  mk({
    id: 'v3',
    photo: 'photo-1533120921505-7f40f5237ee1',
    name: 'Garki Garden Terrace',
    category: 'venue',
    city: 'Abuja',
    area: 'Garki',
    tagline: 'Open-air garden, best for dry-season weddings and birthdays',
    rating: 4.3,
    ratingCount: 41,
    sub: [4.2, 4.5, 4.4, 4.1],
    rel: [74, 91, 4, 45],
    policy: 'flexible',
    arrival: 'Garden access from 9am',
    deliveryFee: 0,
    cautionPct: 8,
    capacity: 250,
    outdoor: true,
    power: { kva: 60, autoChangeover: false, fuelIncluded: false, fuelFee: 35000 },
    items: [
      it('garden', 'Garden (full day)', 'venue', 'day', 280000, 1, { capacityPerUnit: 250 }),
      it('tent', 'Rain-cover marquee', 'tent', 'marquee', 150000, 2, { capacityPerUnit: 125, replacement: 1800000, returnable: true }),
    ],
    reviews: [
      rv('r1', 'Hauwa M.', 4, 'Gorgeous setting. The rain-cover tent saved our afternoon.', '2026-06-21'),
    ],
  }),
  mk({
    id: 'v4',
    photo: 'photo-1511578314322-379afb476865',
    name: 'Lekki Skyline Hall',
    category: 'venue',
    city: 'Lagos',
    area: 'Lekki',
    tagline: 'Modern hall, backup power and valet',
    rating: 4.7,
    ratingCount: 95,
    sub: [4.7, 4.8, 4.2, 4.7],
    rel: [188, 97, 2, 15],
    policy: 'moderate',
    arrival: 'Hall open from 7am',
    deliveryFee: 0,
    cautionPct: 10,
    capacity: 500,
    outdoor: false,
    power: { kva: 300, autoChangeover: true, fuelIncluded: true },
    items: [
      it('hall', 'Skyline hall (full day)', 'venue', 'day', 1200000, 1, { capacityPerUnit: 500 }),
      it('valet', 'Valet parking team', 'addon', 'day', 90000, 1),
    ],
    reviews: [
      rv('r1', 'Kemi F.', 5, 'Everything was ready before we arrived. Staff were calm and quick.', '2026-10-10'),
    ],
  }),
  mk({
    id: 'v5',
    photo: 'photo-1620735692151-26a7e0748429',
    name: 'Wuse Chair & Table Hire',
    category: 'rental',
    city: 'Abuja',
    area: 'Wuse 2',
    tagline: 'Chairs, tables and cutlery, counted and checked at drop-off',
    rating: 4.6,
    ratingCount: 158,
    sub: [4.7, 4.7, 4.6, 4.4],
    rel: [402, 96, 2, 10],
    policy: 'flexible',
    arrival: 'Delivery 3 hours before your event start',
    deliveryFee: 15000,
    cautionPct: 15,
    items: [
      it('chair', 'Chiavari chair', 'chair', 'chair', 450, 800, { replacement: 8500, returnable: true }),
      it('plastic', 'Plastic chair', 'chair', 'chair', 150, 1500, { replacement: 3500, returnable: true }),
      it('round', 'Round table (seats 8)', 'table', 'table', 3500, 120, { capacityPerUnit: 8, replacement: 45000, returnable: true }),
      it('plate', 'Plate and cutlery set', 'tableware', 'set', 350, 900, { replacement: 3000, returnable: true }),
    ],
    reviews: [
      rv('r1', 'Bola K.', 5, 'They counted every chair with me on delivery and again on pickup. No arguments.', '2026-10-04'),
      rv('r2', 'Emeka N.', 4, 'Two chairs had scuffs but they were already noted on the checklist.', '2026-09-02'),
    ],
  }),
  mk({
    id: 'v6',
    photo: 'photo-1675376616537-c8aa9ddc9977',
    name: 'Kubwa Tents & Canopies',
    category: 'rental',
    city: 'Abuja',
    area: 'Kubwa',
    tagline: 'Canopies, marquees and portable toilets for outdoor events',
    rating: 4.2,
    ratingCount: 63,
    sub: [4.0, 4.4, 4.5, 4.0],
    rel: [133, 90, 5, 40],
    policy: 'moderate',
    arrival: 'Setup crew arrives the evening before',
    deliveryFee: 25000,
    cautionPct: 20,
    items: [
      it('canopy', 'Canopy (50 guests)', 'tent', 'canopy', 45000, 20, { capacityPerUnit: 50, replacement: 600000, returnable: true }),
      it('marquee', 'Marquee (150 guests)', 'tent', 'marquee', 140000, 6, { capacityPerUnit: 150, replacement: 1800000, returnable: true }),
      it('toilet', 'Portable toilet', 'toilet', 'unit', 18000, 12, { capacityPerUnit: 50, replacement: 250000, returnable: true }),
    ],
    reviews: [
      rv('r1', 'Idris Y.', 4, 'Tent went up on time and held through the wind.', '2026-08-30'),
    ],
  }),
  mk({
    id: 'v7',
    photo: 'photo-1571266028243-d220c6a7edbf',
    name: 'VoltBox Power & Sound',
    category: 'rental',
    city: 'Abuja',
    area: 'Gwarinpa',
    tagline: 'Silent generators with fuel included, plus PA and DJ gear',
    rating: 4.7,
    ratingCount: 71,
    sub: [4.8, 4.7, 4.3, 4.8],
    rel: [189, 98, 1, 8],
    policy: 'moderate',
    arrival: 'Tested on site 2 hours before guests arrive',
    deliveryFee: 20000,
    cautionPct: 25,
    items: [
      it('gen', '60 kVA silent generator + fuel', 'generator', 'unit', 95000, 6, { replacement: 4500000, returnable: true, kva: 60, fuelIncluded: true }),
      it('pa', 'PA system (up to 300 guests)', 'sound', 'set', 70000, 5, { replacement: 900000, returnable: true }),
      it('mic', 'Wireless microphone', 'sound', 'mic', 8000, 20, { replacement: 60000, returnable: true }),
    ],
    reviews: [
      rv('r1', 'Seyi D.', 5, 'The technician stayed all night and refuelled without us asking.', '2026-10-18'),
    ],
  }),
  mk({
    id: 'v8',
    photo: 'photo-1790774888574-5278c7daa1ab',
    name: 'Ikeja Party Rentals',
    category: 'rental',
    city: 'Lagos',
    area: 'Ikeja',
    tagline: 'Chairs, tables and linen across Lagos mainland',
    rating: 4.4,
    ratingCount: 120,
    sub: [4.3, 4.5, 4.4, 4.3],
    rel: [310, 93, 3, 22],
    policy: 'flexible',
    arrival: 'Delivery the day before or morning of',
    deliveryFee: 30000,
    cautionPct: 15,
    items: [
      it('chair', 'Chiavari chair', 'chair', 'chair', 550, 1000, { replacement: 9000, returnable: true }),
      it('round', 'Round table (seats 8)', 'table', 'table', 4000, 150, { capacityPerUnit: 8, replacement: 50000, returnable: true }),
      it('linen', 'Table linen set', 'decor', 'set', 1500, 200, { replacement: 12000, returnable: true }),
    ],
    reviews: [
      rv('r1', 'Funmi T.', 4, 'Good stock and honest counting.', '2026-09-27'),
    ],
  }),
  mk({
    id: 'v9',
    photo: 'photo-1469371670807-013ccf25f16a',
    name: 'Petal & Plume Decor',
    category: 'decor',
    city: 'Abuja',
    area: 'Wuse 2',
    tagline: 'Floral wedding and birthday styling with a design mock-up before you pay',
    rating: 4.9,
    ratingCount: 54,
    sub: [4.9, 4.9, 4.6, 4.9],
    rel: [97, 99, 0, 6],
    policy: 'strict',
    arrival: 'Styling crew on site 6 hours before start',
    deliveryFee: 20000,
    cautionPct: 0,
    items: [
      it('stage', 'Stage backdrop styling', 'decor', 'package', 220000, 3),
      it('centre', 'Table centrepieces', 'decor', 'table', 6500, 100),
      it('aisle', 'Aisle and entrance florals', 'decor', 'package', 90000, 3),
    ],
    reviews: [
      rv('r1', 'Zainab L.', 5, 'They sent the mock-up first and delivered exactly that.', '2026-10-09'),
    ],
  }),
  mk({
    id: 'v10',
    photo: 'photo-1783314863884-be035ed5ed5c',
    name: 'Crown Interiors by Lade',
    category: 'decor',
    city: 'Lagos',
    area: 'Victoria Island',
    tagline: 'Luxury draping and lighting for large receptions',
    rating: 4.6,
    ratingCount: 49,
    sub: [4.5, 4.7, 4.2, 4.6],
    rel: [88, 95, 2, 18],
    policy: 'strict',
    arrival: 'Crew on site 8 hours before start',
    deliveryFee: 40000,
    cautionPct: 0,
    items: [
      it('drape', 'Ceiling draping', 'decor', 'hall', 350000, 2),
      it('light', 'Uplighting (20 units)', 'decor', 'package', 120000, 3),
    ],
    reviews: [
      rv('r1', 'Ada E.', 5, 'The hall looked transformed.', '2026-08-15'),
    ],
  }),
  mk({
    id: 'v11',
    photo: 'photo-1511795409834-ef04bbd61622',
    name: 'Seamless Events by Amaka',
    category: 'planner',
    city: 'Abuja',
    area: 'Asokoro',
    tagline: 'Wedding and corporate planning with a named backup coordinator',
    rating: 4.8,
    ratingCount: 38,
    sub: [4.9, 4.8, 4.6, 4.9],
    rel: [61, 99, 0, 9],
    policy: 'moderate',
    arrival: 'Coordinator on site from setup to close',
    deliveryFee: 0,
    cautionPct: 0,
    items: [
      it('day', 'Day-of coordination', 'planning', 'event', 150000, 2),
      it('full', 'Full planning package', 'planning', 'event', 450000, 1),
    ],
    reviews: [
      rv('r1', 'Maryam G.', 5, 'Her backup coordinator took over seamlessly when she had a flight delay.', '2026-09-20'),
    ],
  }),
  mk({
    id: 'v12',
    photo: 'photo-1741969494307-55394e3e4071',
    name: 'Eko Moments Planning',
    category: 'planner',
    city: 'Lagos',
    area: 'Yaba',
    tagline: 'Budget-friendly planning for birthdays and naming ceremonies',
    rating: 4.1,
    ratingCount: 29,
    sub: [3.9, 4.3, 4.6, 3.9],
    rel: [44, 88, 6, 55],
    policy: 'flexible',
    arrival: 'Coordinator on site 2 hours before start',
    deliveryFee: 0,
    cautionPct: 0,
    items: [
      it('day', 'Day-of coordination', 'planning', 'event', 90000, 4),
      it('half', 'Partial planning', 'planning', 'event', 200000, 3),
    ],
    reviews: [
      rv('r1', 'Segun R.', 4, 'Great value. Replies could be quicker.', '2026-07-30'),
    ],
  }),
];

export const getVendor = (id: string) => VENDORS.find((v) => v.id === id);

export const CATEGORY_LABEL: Record<Category, string> = {
  venue: 'Venues',
  rental: 'Rentals',
  decor: 'Decor',
  planner: 'Planners',
};

/**
 * Rough market-average unit prices per item kind, used for the "vs average" tag.
 * Demo figures derived from the sample vendors above.
 */
export const MARKET_AVG: Partial<Record<ItemKind, number>> = {
  chair: 500,
  table: 3750,
  tableware: 350,
  tent: 95000,
  generator: 95000,
  sound: 70000,
};

/** Rule-of-thumb guest planner. Approximate; ratios vary by event style. */
export const PLANNER_RULES = {
  guestsPerTable: 8,
  guestsPerToilet: 50,
  guestsPerCanopy: 50,
  kvaPerGuests: 100 / 40, // ~1 kVA for every ~2.5 guests with AC and sound
  /** Power budget for lighting and a PA system before any air-conditioning. */
  baseKva: 10,
  /** One standing AC (about 3 HP), allowing for its start-up surge. */
  kvaPerAc: 3,
  /** Diesel burned per kVA per hour at a typical event load (about 70%). */
  litresPerKvaHour: 0.15,
  /** Assumed diesel pump price in naira. Prices move often: update this. */
  dieselPerLitre: 1200,
};
