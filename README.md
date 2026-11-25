# Eventis

An event marketplace for Nigeria, built with Expo (React Native) and TypeScript. Book event centres, rent chairs, tents and generators, and hire decorators and planners, with prices, terms and track records visible **before** you pay.

Runs on Android and the web from one codebase. A static web demo deploys free to GitHub Pages.

> **Demo status.** Vendors, prices, reviews and "other customers' bookings" are fictional sample data. Payments, vendor replies and refunds are simulated, and no money moves. The cancellation tiers and the damage-deduction rule are an illustrative proposal, not legal terms.

## The problem it tackles

Event booking in Nigeria often runs on WhatsApp and phone calls. Common failure points include vendors who do not show up, double-booked stock, hidden extras such as generator fuel, disputes over damaged or missing rentals, and reviews that cannot be trusted. Eventis turns each into a product feature.

| Gap in the market | What Eventis does | Where in the code |
| --- | --- | --- |
| Double-booking; "available" means nothing for stock items | Vendors list units owned. Availability is computed per item, per date; held stock drops when you book | `src/lib/availability.ts` |
| Surprise charges (fuel, delivery, "caution") | One all-in breakdown: items, delivery, fuel, refundable caution deposit, deposit and balance | `src/lib/pricing.ts` |
| Unclear refunds and vendor no-shows | Three cancellation policies with published refund tiers. A vendor no-show refunds everything paid | `src/lib/policies.ts`, `src/lib/store.tsx` |
| Damage and missing-item disputes on rentals | Count at delivery, check at return. Missing items are charged at replacement value, damaged at 50%, capped at the caution deposit | `settleReturn` in `src/lib/pricing.ts` |
| Power failures at venues | Generator size, auto-changeover and fuel terms on every venue page, with warnings at booking | `src/app/vendor/[id].tsx`, `src/app/book/[id].tsx` |
| Outdoor events and rain | Outdoor toggle that prompts for a rain-cover plan | `src/app/book/[id].tsx` |
| Hard to know what to hire | Guest-count planner (chairs, tables, toilets, generator size, canopies) | `src/app/(tabs)/plan.tsx` |
| Fake or unhelpful reviews | Reviews only after a completed booking, with punctuality scored separately, plus a reliability record (on-time %, vendor cancellations, response time) | `src/app/vendor/[id].tsx` |
| Price comparison is guesswork | "Above / below average" tag on comparable items | `MARKET_AVG` in `src/data/vendors.ts` |

## Booking flow

`requested → accepted → deposit paid → balance paid → delivered (count) → completed (return check) → review`

At any point before delivery you can cancel; the refund is computed from the vendor's policy and the days remaining. On the day, you can report a vendor no-show.

## Run it

```bash
npm install
npm start          # then press w for web, or scan the QR code with Expo Go on Android
npm test           # vitest: pricing, policies, settlement, availability
npm run typecheck
npm run build:web  # static export to dist/
```

State is saved on-device with AsyncStorage. "Clear demo data" on the Bookings tab resets it.

## Deploy the web demo (free)

1. Create a GitHub repo named `eventis` and push this project to `main`.
2. In **Settings → Pages**, set the source to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` runs typecheck and tests, builds, and publishes.

The site is served from `/eventis`, set by `experiments.baseUrl` in `app.json`. If you name the repo differently, change it there.

## Android build

```bash
npx eas-cli@latest build --platform android --profile preview   # installable APK
```

iOS needs an Apple Developer account and a real iPhone or TestFlight, because the iOS simulator only runs on macOS. EAS can build in the cloud without a Mac.

## Structure

```
src/app/            Expo Router screens: (tabs) home/explore/plan/bookings, vendor, book, booking
src/components/     UI kit, vendor card, date picker
src/data/vendors.ts Sample vendors, market averages, planner ratios
src/lib/            pricing, policies, availability, store (context + AsyncStorage), types
tests/              vitest suite
```

## Known limits and next steps

- No backend: a real version needs auth, vendor accounts, real payments held in escrow, and vendor-side calendars. Supabase would fit.
- Planner ratios are rules of thumb. Vendors and venues should confirm quantities.
- Photos are not included yet; vendor profiles are text only.
- iOS is untested.

## License

MIT
