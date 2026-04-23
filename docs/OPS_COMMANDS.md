# Ops Commands (Instant Integrations)

This repo includes a small CLI so you can say “add a payment link” and it updates the right env keys safely.

## Run it

```bash
npm run ops -- help
```

## Initialize `.env` (free-first local AI)

Creates `.env` from `.env.example` if missing and sets free-first defaults.

```bash
npm run ops -- env:init
```

## Add a Stripe payment link for an offer

```bash
npm run ops -- stripe:payment-link --offer operator-os --url "https://buy.stripe.com/XXXXX"
```

This writes:

```text
STRIPE_PAYMENT_LINK_OPERATOR_OS=...
```

## Add a PayPal payment link for an offer

```bash
npm run ops -- paypal:payment-link --offer operator-os --url "https://www.paypal.com/ncp/payment/XXXXX"
```

This writes:

```text
PAYPAL_PAYMENT_LINK_OPERATOR_OS=...
```

## Set your AdSense publisher

```bash
npm run ops -- adsense:set-publisher --publisher ca-pub-1234567890123456
```

This writes:

```text
VITE_ADSENSE_PUBLISHER=ca-pub-...
VITE_ENABLE_ADS=true
```

## Security notes

- This CLI **does not** create or fetch secrets.
- Do **not** commit `.env`.
- Use Cloudflare/VS Code secrets for production tokens.
