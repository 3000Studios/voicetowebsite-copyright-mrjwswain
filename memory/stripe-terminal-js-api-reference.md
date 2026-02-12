# JavaScript API Reference (Stripe Terminal SDK)

Source: https://docs.stripe.com/terminal/references/api/js-sdk.md

Saved on: 2026-02-12

## API Methods

- `StripeTerminal.create()`
- `discoverReaders()`
- `connectReader()`
- `disconnectReader()`
- `getConnectionStatus()`
- `getPaymentStatus()`
- `clearCachedCredentials()`
- `collectPaymentMethod()`
- `cancelCollectPaymentMethod()`
- `processPayment()`
- `cancelProcessPayment()`
- `collectSetupIntentPaymentMethod()`
- `cancelCollectSetupIntentPaymentMethod()`
- `confirmSetupIntent()`
- `cancelConfirmSetupIntent()`
- `readReusableCard()`
- `cancelReadReusableCard()`
- `setReaderDisplay()`
- `clearReaderDisplay()`
- `setSimulatorConfiguration()`
- `getSimulatorConfiguration()`
- `collectRefundPaymentMethod()`
- `cancelCollectRefundPaymentMethod()`
- `processRefund()`
- `cancelProcessRefund()`
- `collectInputs()`
- `cancelCollectInputs()`
- `print()`

## Key Status Values

- `ConnectionStatus`: `connecting`, `connected`, `not_connected`
- `PaymentStatus`: `not_ready`, `ready`, `waiting_for_input`, `processing`

## Common Error Codes

- `no_established_connection`
- `no_active_collect_payment_method_attempt`
- `no_active_read_reusable_card_attempt`
- `canceled`
- `cancelable_already_completed`
- `cancelable_already_canceled`
- `network_error`
- `network_timeout`
- `already_connected`
- `failed_fetch_connection_token`
- `discovery_too_many_readers`
- `invalid_reader_version`
- `reader_error`
- `command_already_in_progress`
- `printer_busy`
- `printer_paperjam`
- `printer_cover_open`
- `printer_out_of_paper`
- `printer_absent`
- `printer_unavailable`
- `printer_error`

## Notes From This Reference

- `allowCustomerCancel` in `readerBehavior` is not broadly available.
- `print()` is only available on Verifone V660p.
- `readReusableCard()` is for online reuse flows and does not get standard in-person Terminal liability shift/pricing benefits.
- `collectPaymentMethod()` and `processPayment()` both support `config_override`.
- Cancellation APIs exist for collection/processing flows (`cancelCollect*`, `cancelProcess*`, `cancelConfirm*`).

## Changelog Items Included In Your Paste

- `2025-10-30`: Added surcharge consent support in `processPayment` (custom message up to 220 chars).
- `2025-10-06`: Preview `print` support on Verifone V660p.
- `2025-06-02`: Simulated reader support for input collection, plus cancellable `processPayment`, `confirmSetupIntent`, `processRefund`.

## Canonical Docs

- API reference: https://docs.stripe.com/terminal/references/api/js-sdk.md
- Setup integration: https://docs.stripe.com/terminal/payments/setup-integration.md?terminal-sdk-platform=js
- Collect card payment: https://docs.stripe.com/terminal/payments/collect-card-payment.md
- Testing/simulated readers: https://docs.stripe.com/terminal/references/testing.md
- Migration guide: https://docs.stripe.com/terminal/references/sdk-migration-guide.md
