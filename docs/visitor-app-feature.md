# Visitor App Feature

## Scope and implementation status

This feature adds the five requested mobile-first screens and navigable bottom bar using the existing plain HTML/CSS/JavaScript frontend.

| Screen | Available in the UI now | Requires a backend before production |
|---|---|---|
| Home | Quick links to passes and QR; clearly marked sample partner-attraction cards. | Published partner catalog records, current pass eligibility, approved imagery, and accurate accessibility/location details. |
| Buy | Clearly marked sample passes, add/remove quantity, locally persisted demo cart, subtotal, and a safe checkout explanation. | Published pass records, server-owned cart/order, inventory/eligibility, payment-provider checkout, and order status. |
| My QR | QR API loading/error states; short-lived QR caching/display support; expiry countdown; offline-risk warning and local cache removal. | Authentication, pass eligibility, unpredictable short-lived QR issuance/rotation, scanner validation, and server-side single-use redemption. |
| History | Loading, empty, and unavailable states; renders a validated history response. | Authenticated, paginated, server-owned usage records and retention/privacy rules. |
| Profile | Email/password and Google/Apple sign-in presentation; create-account form; distinct draft-notice acknowledgement and optional marketing choice; account/privacy-management preview. | Secure account APIs, OAuth configuration/callbacks, password policy and recovery, published notices, privacy rights, and authoritative consent records. |

The backend now provides read-only SQL-backed public catalog endpoints. The catalog tables start empty and unpublished; no sample pass or partner is seeded or presented as real inventory. No payment, account, consent, redemption, or order is created by the current preview. The frontend still renders clearly labeled sample listings and does not yet consume these endpoints. Do not treat the browser's cart or cached QR data as authoritative.

## Navigation and usability

- The bottom navigation exposes Home, Buy, My QR, History, and Profile and identifies the active page.
- Home has quick access to buying and the pass QR, followed by sample partner attractions.
- The visitor UI uses responsive layouts, large touch controls, visible focus states, reduced-motion preferences, and safe-area spacing for mobile devices.
- Loading, empty, offline, and unconfigured API states should remain explicit as live integrations are added.
- The QR screen never reports a redemption as confirmed from local state.

## Offline model and duplicate-scan risk

The service worker caches only the visitor app shell and static assets. It does not cache API responses. Increment the app-shell cache version (`CACHE_NAME` in `FrontEnd/sw.js`) when deploying changed cached assets so returning installations refresh the shell. A QR credential returned by the future authenticated QR endpoint is kept separately in IndexedDB, keyed by an opaque account identifier; the visitor can remove that cached record on this device.

The user has chosen to allow venues to accept offline QR codes and reconcile later, accepting temporary duplicate-redemption risk. That policy **cannot provide a global one-time guarantee while scanners are disconnected**. Two offline scanners may both accept the same credential before either synchronizes. The offline screen must disclose this limitation; venue workflows must record offline acceptance and later synchronization must flag duplicate attempts for review rather than silently overwriting one record.

The web platform cannot reliably block screenshots. A screenshot may be copied to another device or shown later. Mitigations belong in credential design and scanner validation:

- Use a cryptographically unpredictable, short-lived, account/pass-bound credential. Never encode personal information or payment secrets in the QR.
- Display only the QR payload issued by the backend; rotate or expire it according to the approved product policy.
- Validate payment/pass eligibility, expiry, and redemption state at the scanner.
- When online, redeem with an atomic conditional database update so only one request wins.
- When offline, bind every accepted event to a venue/scanner and local sequence, timestamp it, and synchronize idempotently. Preserve evidence of conflicting use for investigation. Do not promise duplicate prevention before synchronization.
- Set and communicate a concrete offline credential lifetime and clock-tolerance policy before issuing production credentials.

## Frontend API contract expected

Catalog endpoints below are implemented. Other endpoints remain proposed contracts. Keep the UI's sample data behind a repository/client module when transitioning to live API responses.

### Public catalog

- `GET /api/v1/catalog/passes` returns published pass IDs, display names, descriptions, price in integer minor units, currency, validity description, and availability. Unpublished passes are not returned; a published but temporarily unavailable pass is returned with `available: false`.
- `GET /api/v1/catalog/attractions` returns published partner ID, public name, location, category, approved image URL, accessibility information, and current pass eligibility.
- The API response is authoritative for price and availability; never accept client-supplied totals as payment amounts.
- `BackEnd/src/main/resources/db/migration/V2__create_public_catalog.sql` creates the backing SQL Server tables. Records are unpublished by default; an approved catalog-management process must populate and publish real partner/pass data before the endpoints return listings.

### Orders and payment

- `POST /api/v1/me/orders` accepts pass IDs and quantities plus an idempotency key; the server recalculates prices and returns an order ID, line items, currency, and server-calculated total.
- `POST /api/v1/me/orders/{orderId}/payment` starts payment through the configured provider and returns a provider-safe continuation detail and pending status.
- `GET /api/v1/me/orders/{orderId}` returns the backend-owned order/payment state.
- Payment success is confirmed by provider-verified server processing, not by a front-end redirect.

### QR issuance and history

- `GET /api/v1/me/qr` requires authentication and returns a JSON object with `accountId` (opaque, non-PII cache key), `passName`, `expiresAt` (ISO-8601), and `qrImageDataUrl` (PNG data URL containing the opaque signed credential). A production API may instead return a dedicated QR payload field rendered by a maintained QR library; never let the browser construct authorization tokens.
- The frontend accepts cached QR data only for its previously active account, checks expiry locally for display, and sends no cached credential to another account. Expiry displayed in the browser is a usability hint, not a security control.
- `GET /api/v1/me/usage-history` requires authentication and returns paginated entries containing `attractionName`, `passName`, and `usedAt` (ISO-8601), plus stable entry IDs for future pagination.
- Actual scanner redemption uses a separate authenticated venue API, for example `POST /api/v1/venue/redemptions`, with the credential and an idempotency key. Venue authentication/authorization must be distinct from visitor authentication. Online processing must be atomic. Offline synchronization must preserve the original event and detect conflicts.

All authenticated endpoints should return a consistent `401` when the visitor session is absent/expired; the frontend should clear account-scoped cached QR data on a connected `401`, account change, or sign-out, and must not show a stale cached QR to a signed-out account. Apply appropriate `Cache-Control: no-store` headers to identity, payment, and QR API responses.

## Profile, consent, and PDPA implementation boundary

- Email/password authentication should be implemented by the backend using a vetted password-hashing approach, rate limiting, secure session/token handling, verification, and account recovery. Never store a password or token in the demo cart or QR cache.
- Google and Apple sign-in require provider app configuration, server-verified authorization responses, state/nonce validation, and backend account-linking policy. The current buttons only explain that sign-in is not configured.
- Publish a clear privacy notice before enabling registration. It should identify the data controller/contact, purposes, data categories, legal basis per purpose, recipients/processors, retention, data-subject rights/request channel, and cross-border transfers where relevant. Obtain qualified legal/privacy review; this template does not claim PDPA compliance.
- Distinguish notice acknowledgement from consent. Do not make optional marketing consent a condition of purchasing or using a pass. Record consent only where consent is the selected legal basis, with purpose, notice/version, choice, and timestamp. Support withdrawal and retain appropriate evidence.
- `POST /api/v1/me/privacy-preferences` should accept purpose-scoped choices and notice version; the backend must validate and persist an auditable record. Do not infer consent from a prechecked checkbox, silence, or the browser's `localStorage`.
- Provide a way to request account/data access or correction and account deletion/retention review through a properly authenticated backend process.

The profile screen's current notice and choices are explicitly a non-functional draft preview, not a privacy notice, consent collection, or compliance claim. Do not enable registration or ask users for real personal information until the reviewed notice and backend storage/withdrawal process are in place.

## Acceptance checks

- Navigate through all five destinations using the bottom bar and Home quick links; confirm active navigation and keyboard focus are clear.
- Add, remove, and reload pass quantities; ensure the cart persists only as sample data on that browser and enforces its quantity cap.
- Verify checkout states clearly that no order/payment was created until an API exists.
- Verify the QR screen's pending, service-unavailable, offline-without-cache, cached/unexpired, expired, and clear-cache states. A cached image must not be displayed past expiry.
- Verify the service worker serves the app shell offline and does not cache `/api/` or cross-origin responses.
- Verify History handles loading, empty, malformed, and API failure responses without fabricating records.
- Verify registration separates required privacy-notice acknowledgement from optional marketing preference; sign-in/OAuth controls must not imply a successful authentication.
- At venues, test simultaneous online redemptions and the offline reconciliation conflict policy separately. Screenshot blocking is not an acceptance criterion because browsers cannot guarantee it.
