---
layout: post
title: "Closing the Loop on Local Influence, Storytime Demo"
date: 2026-11-16 12:21:24 -0500
date_has_time: true
author: Lalith Uriti
permalink: /blog/storytime/
---

Storytime connects local businesses with creators who visit and share their experiences. My core idea is to follow what happens next: **a follower engages with a recommendation, visits the business, and makes a purchase that can be matched back to the offer.**

Then use that feedback to help merchants fill quiet periods with discounts shared by creators they approve.

[Try the interactive demo]({{ '/demo/storytime/' | relative_url }}) — no signup or installation. All purchases are simulated.

## From engagement to a confirmed purchase

Storytime already describes creator matching, verified visits, posts, and campaign reporting in its [product overview](https://storytime.io/about). Its [August 2026 Ana Luisa case study](https://storytime.io/brands/success-stories/ana-luisa-30-percent-foot-traffic-increase) reports 30% higher foot traffic using door counts from two weeks before and after launch. That comparison doesn't establish end-to-end customer purchase attribution or incremental revenue. Storytime may already measure more internally.

I'd explore one explicit chain:

1. A creator shares a merchant-approved offer through a link, QR code, or post containing a code.
2. A follower opens the offer and visits the business.
3. Staff record the creator code on the customer's order.
4. A payment-provider or POS event confirms the transaction; the merchant sees the creator, offer, time, paid amount, and any refund together.

<img src="{{ '/assets/images/storytime/purchase-verification.svg' | relative_url }}" alt="Proposed purchase attribution flow from a creator offer through an observed customer engagement and code redemption to a confirmed POS transaction." style="display: block; max-width: 100%; height: auto; margin: 1.5rem auto;">

Here, engagement means an observed offer open, not every like or passive view. A code-only purchase can identify an offer without proving an earlier engagement. Shared codes and forwarded links also limit attribution. I'd keep those distinctions visible.

## Turn quiet hours into controlled offers

A café with spare afternoon capacity could approve selected creators to share a discount valid from 2–5 PM, capped at twenty redemptions. A restaurant could target a slow service; a spa could release unfilled appointments.

<img src="{{ '/assets/images/storytime/quiet-hour-offer.svg' | relative_url }}" alt="Merchant-controlled quiet-hour offers: select a time window, approve a creator, cap redemptions, and learn from matched purchases." style="display: block; max-width: 100%; height: auto; margin: 1.5rem auto;">

The goal is profitable use of spare capacity. More revenue isn't automatically better: discounts need to cover variable costs and avoid unnecessarily replacing full-price purchases. I'd compare matched sales, refunds, contribution margin, and redemption times, then test repeat visits and incremental impact against a comparison group.

## What I built, and what comes next

The [click-through prototype]({{ '/demo/storytime/' | relative_url }}) demonstrates merchant approval, time windows, creator links and QR codes, in-store code redemption, purchase matching, and refunds. It runs on GitHub Pages with sample events stored in the visitor's browser. It does not verify real payments.

A production version needs a backend: merchant-authorized POS access, campaign and order identifiers, verified provider events, duplicate protection, refund reconciliation, and a shared redemption cap. I'd start with one POS integration and retain only the attribution data customers and merchants authorize, consistent with the [privacy policy](https://storytime.io/legal/privacy-policy).

I want to work close to customers, help shape how people discover local businesses, and take responsibility for what I ship. I'd start with one merchant, one creator, and one traceable purchase before expanding the workflow.

## Interesting threads explored while researching Storytime

1. **Creator discovery & eligibility.** App Store reports about disappearing offers initially led me toward explainable matching and transparent ranking. I'd still validate those experiences with creators; they don't establish a cause or the current product's behavior.
2. **The Local Proof Loop.** The focus here is observed engagement → visit → matched purchase → repeat customer. Foot traffic is useful evidence, but the public case study doesn't establish that entire chain.
3. **Verifying purchases without friction.** I compared POS integrations, card-linked transactions, and permissioned email receipts with Hummingbirds' receipt-upload approach. Merchant coverage, consent, and matching quality decide whether manual uploads can disappear.
4. **Beyond influencer marketing.** Merchant-approved quiet-hour offers could connect merchants, creators, and consumers around spare capacity. Shopify's commerce tools and ClassPass's capacity model provide context; creator storefronts and broader discovery remain longer-term ideas to validate.
5. **Engineering exploration.** Local Proof now demonstrates the purchase-and-offer flow in a browser. The earlier Creator Compass eligibility engine remains a separate, unbuilt proposal. Real transaction verification requires a backend and a payment-provider integration.

Storytime sources: [Creator terms](https://storytime.io/legal/terms-creators) · [Brand terms](https://storytime.io/legal/terms-brands) · [Privacy](https://storytime.io/legal/privacy-policy) · [Data deletion](https://storytime.io/legal/data-deletion) · [Ana Luisa case study](https://storytime.io/brands/success-stories/ana-luisa-30-percent-foot-traffic-increase) · [Creator App Store](https://apps.apple.com/us/app/storytime-influencers/id6472387521) · [Signal](https://signal.storytime.io/pricing).

Purchase verification: [Square Orders API](https://developer.squareup.com/docs/orders-api/what-it-does) · [Toast Orders API](https://doc.toasttab.com/doc/devguide/portalOrdersApiOverview.html) · [Stripe email receipts](https://docs.stripe.com/receipts) · [Hummingbirds Offers](https://www.hummingbirds.com/solutions/offers).

Marketplace context: [Shopify local pickup](https://help.shopify.com/en/manual/fulfillment/setup/delivery-methods/pickup-in-store) · [ClassPass on filling unused spots](https://classpass.com/partners/blog/tips-add-revenue-studio-gym).

<a href="{{ '/assets/research/storytime/Storytime_Product_Diagnostic.pdf' | relative_url }}" download>Storytime — Product Diagnostic &amp; Creator Compass MVP (3-page PDF)</a>

The PDF records the earlier eligibility-focused research; the interactive demo now focuses on purchase attribution and quiet-hour offers.
