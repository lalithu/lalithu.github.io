# Storytime — Local Proof

An independent, interactive feature proposal by Lalith Uriti.

**Idea:** connect a creator's tracked offer engagement to an in-store code redemption and a matched purchase. Then help merchants fill quiet periods with time-limited offers shared by creators they approve.

- [Public walkthrough](https://lalithu.github.io/demo/storytime/)
- [Research post](https://lalithu.github.io/blog/storytime/)

## Run

Node.js 22.13+ and npm. From this folder, one command:

```sh
npm start
```

First run installs the locked dependencies. Open http://127.0.0.1:4317/demo/storytime/ . No credentials or services required. Run `PORT=4321 npm start` if that port is occupied. Stop with Ctrl+C.

## A one-minute demo

1. **Merchant:** select discount, quiet-hour window, and redemption cap. Approve Maya.
2. **Creator:** see the post, copy a link, or download a QR code. Open as a follower.
3. **Customer:** open the offer, visit the fictional café, and redeem Maya's code. Simulate POS confirmation.
4. **Merchant:** inspect observed engagement, code redemption, matched transaction, net sales, and assumed contribution. Optionally refund or replay an event.

Opening a link is the first measurable engagement in this prototype. Likes and passive views are not observed. Code-only attribution deliberately leaves the initial engagement unknown. Forwarded links and shared codes cannot establish causation.

The QR points to the public URL when opened on the public site. An encoded sample offer travels in its query string, so a new visitor or phone can start the offer without sharing a database. Every browser has its own sample state. A localhost QR requires a reachable local address for another device.

## Static simulation, not production verification

GitHub Pages hosts HTML, CSS, and JavaScript. **All transactions are simulated in the visitor's browser.** No actual payment provider, POS, private key, or customer identity is involved. The prototype stores only sample state in localStorage and sessionStorage. It is not a trustworthy payment or redemption system.

A real service needs an authenticated backend, merchant-authorized POS access, a campaign-to-order mapping, verified provider events, idempotency, refund reconciliation, a globally enforced cap, and consent/retention controls. A creator code alone cannot establish an earlier engagement or incremental impact.

The simulated cap includes pending, paid, and refunded redemptions for the campaign in this browser; failed payments release it. Changing campaign controls creates a separate offer and preserves earlier order snapshots. Redemption-time checks use an explicit demo clock, not the current time. Sample contribution assumes a $9 variable cost per two-matcha order and excludes fixed costs, fees, and displaced full-price orders.

## Build and test

```sh
npm test
npm run build
```

Thirteen tests cover dedicated visit routing and privacy preferences as well as approval, link validation, observed engagement, code-only attribution, duplicate visits/orders/events, time windows, code matching, caps, declines, refunds, and immutable purchase snapshots.

`web/model.ts` contains the pure TypeScript model. `web/app.js` provides the guided UI. The build bundles QR generation and the UI into `assets/storytime-demo/app.js`, copies CSS/SVG assets, and emits `pages/storytime-demo.html` with Jekyll front matter. It also creates an ignored standalone `dist/` for local use. No external runtime dependencies or CDN are needed.

The underscore-prefixed source directory is excluded from Jekyll's published files. Source and tests remain readable in the portfolio repository. Generated page and assets are committed alongside the sources so GitHub Pages needs only its existing Jekyll build.

## Dedicated demo visit tracking

The demo uses its own private Supabase table, `storytime_demo_visits`, and the `track-storytime-demo-visit` collector. The general portfolio tracker skips `/demo/storytime/`, so demo visits are not inserted into `portfolio_visits`.

Only the hosted demo loads `assets/js/storytime-demo-visits.js` in production when `storytime_demo_visit_tracking` is enabled. It honors Global Privacy Control and Do Not Track. Each full page load can record a visit; stepping through the SPA does not create additional visits. This is not a unique-person or CEO-identification system.

The collector fixes `page_path` to `/demo/storytime/` server-side and records the same IP, approximate country, device classification, and bounded user-agent fields as the existing portfolio tracker. No URL query, creator code, form content, or sample transaction data is sent. Local previews do not collect visits. The table has RLS and no anonymous/authenticated read or write grants; only the server-side service role can insert.

## Design

Berry pink, warm neutrals, rounded CTAs, and sans-serif typography reflect Storytime's public site. Local Proof has its own name and original SVG illustrations. It is not an official Storytime product.

Reference sources: [Storytime's flow](https://storytime.io/about), [Ana Luisa measurement](https://storytime.io/brands/success-stories/ana-luisa-30-percent-foot-traffic-increase), [Square Orders](https://developer.squareup.com/docs/orders-api/what-it-does), [Square Sandbox](https://developer.squareup.com/docs/devtools/sandbox/overview).
