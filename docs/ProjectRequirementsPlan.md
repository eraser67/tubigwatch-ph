# TubigWatch PH — Project Requirements Plan

**Document type:** Product and software requirements  
**Version:** 1.0  
**Project status:** Planning  
**Target market:** Initial pilot in one Philippine municipality  
**Product type:** Mobile-first web application / Progressive Web App (PWA)

## 1. Project Overview

TubigWatch PH is a community-powered water supply and price finder. It helps residents locate stores selling water containers and related supplies, compare prices for equivalent products, check reported availability, and contribute store locations and price updates.

The central experience is an interactive map. Users can browse stores, search by product or location, tap a store pin to view details, and compare prices. A contributor can add a store by placing a pin on the map, entering store details, and submitting products and prices for review.

The product must encourage informed purchasing and reliable information. It must not encourage panic buying, hoarding, or unsupported accusations against businesses.

## 2. Problem Statement

During periods of high demand or water-supply concern, residents may struggle to find:
- Nearby stores selling suitable containers.
- Comparable prices for the same size and type of product.
- Current stock information.
- Store contact details, opening hours, and directions.
- A simple way to report a new store or an updated price.

TubigWatch PH addresses these problems by organizing community-submitted and store-confirmed information in one searchable map and price comparison experience.

## 3. Goals and Success Measures

### 3.1 Product goals
1. Help residents find nearby suppliers.
2. Make price comparison simple and fair by comparing equivalent products.
3. Allow users to pin a store location and submit store and product details.
4. Show how recent and trustworthy each listing is.
5. Provide moderation tools to reduce duplicate, inaccurate, or abusive submissions.
6. Work well on mobile phones and slower connections.
7. Keep the initial operating cost low and make paid services optional.

### 3.2 Pilot success measures
Measure these during the pilot:
- Number of approved stores.
- Number of products with comparable specifications.
- Percentage of listings confirmed within the configured freshness period.
- Number of successful searches and store-detail views.
- Number of useful price updates accepted.
- Duplicate and rejected submission rates.
- User-reported incorrect listings.
- Store participation and contributor retention.

Do not define success only by page views. The primary value is useful, sufficiently recent local information.

## 4. Scope

### 4.1 MVP — must have
- Responsive public website.
- Interactive map with store pins.
- Store list/map toggle.
- Manual location and product search.
- Optional use of the user's current location after permission.
- Add-store workflow with map pin placement and coordinate adjustment.
- Store details: name, address, barangay, municipality, province, contact details, hours, and optional photo.
- Product catalog for buckets, water containers, drums, tanks, and configurable additional categories.
- Product attributes such as capacity in liters, brand, material, dimensions, and description.
- Price in Philippine pesos (PHP).
- Stock status: Available, Limited, Sold Out, Unknown.
- Community submission of stores and price updates.
- Pending-review status and administrator approval.
- Price comparison and sorting by lowest reported price.
- Product-specification matching so different sizes are not treated as equivalent.
- Last-reported and last-confirmed timestamps.
- Clear source and verification labels.
- Store detail page with directions link and published contact details.
- Basic reporting of inaccurate listings.
- Protected administrator dashboard.
- Basic audit trail for moderation and price changes.
- Database access controls, input validation, upload limits, and rate limiting.
- Automated tests for core flows.
- Setup, deployment, and operating documentation.

### 4.2 Should have after core MVP
- Store owner accounts and store-claim workflow.
- Store-owner self-service updates after verification.
- Price history charts.
- Distance-based sorting.
- Optional delivery availability and delivery fee.
- Contributor accounts and contribution history.
- CSV export of approved listing data for administrators.
- Basic notification when a submission is approved or rejected.

### 4.3 Future / not required for initial MVP
- Online payments or checkout.
- Delivery dispatch and route optimization.
- Native iOS or Android apps.
- AI price forecasting.
- Automated accusations or public “price gouging” scores.
- Nationwide rollout before a local pilot succeeds.
- Paid business analytics.
- Complex loyalty, rewards, or advertising systems.

## 5. User Roles

### 5.1 Public visitor
- Browse approved stores and products.
- Search by product or area.
- View prices, stock status, freshness, and verification labels.
- Compare equivalent products.
- Open directions and contact a store.
- Report inaccurate information.
- Browse without creating an account.

### 5.2 Community contributor
- Submit a new store with map coordinates.
- Suggest products and prices for a store.
- Submit updates to existing listings.
- Upload optional evidence photos.
- View submission status if an account-based workflow is enabled.
- Must not be able to approve their own submissions.

### 5.3 Store owner
- Claim a store through an administrator-approved process.
- Update store details and product availability after verification.
- Submit price changes.
- View listing and moderation status.
- Must not change verification or moderation status directly.

### 5.4 Administrator / moderator
- Review, approve, reject, edit, or suspend listings.
- Review reports and evidence.
- Merge duplicates.
- Verify store ownership.
- View change history.
- Manage product categories and freshness rules.
- Export appropriate summary data.

## 6. Primary User Journeys

### Journey A — Find the lowest price
1. User opens TubigWatch PH.
2. User searches for a product, such as a 200-liter water drum.
3. User selects a municipality or allows location access.
4. The system displays matching approved listings on the map and in a list.
5. User sorts by lowest price or nearest store.
6. User opens a store card and checks product specifications, stock status, price source, and last-confirmed time.
7. User contacts the store or opens directions.
8. The interface reminds the user to confirm price and availability with the store when information is stale or unverified.

### Journey B — Add a store
1. User selects “Add a Store.”
2. User searches for an address, uses current location with permission, or navigates the map manually.
3. User taps to place a pin and can move it to correct the location.
4. User enters store name and available details.
5. User adds one or more products, their specifications, prices, and stock status.
6. User reviews the submission and submits it.
7. The system validates the submission and marks it Pending Review.
8. An administrator reviews the store, coordinates, and details.
9. Once approved, the listing becomes publicly searchable.

### Journey C — Update a price
1. User opens an existing store listing.
2. User chooses “Report a Price Update.”
3. User selects the existing product or requests a new product listing.
4. User enters price, stock status, and optional evidence photo.
5. The system records the report and timestamp.
6. The report is reviewed or accepted under configured trust rules.
7. The accepted price is shown as current, with its source and timestamp; older values remain in price history.

### Journey D — Moderate a report
1. Administrator opens the review queue.
2. Administrator checks the store, product, coordinates, submitted details, and evidence.
3. Administrator approves, rejects, edits with an audit entry, or requests correction.
4. The system records who made the decision and when.
5. The public listing changes only according to the approved moderation action.

## 7. Functional Requirements

### FR-01: Map browsing
- Display approved stores as interactive markers.
- Selecting a marker opens a store preview.
- Support zoom, pan, recenter, and map/list view.
- Map must remain usable on mobile.
- Store pins must not expose pending or rejected submissions publicly.
- Include map-data attribution and follow provider policies.

### FR-02: Location handling
- Ask for browser location permission only after the user selects a location-dependent action.
- Permit manual search and map browsing if permission is denied.
- Validate latitude and longitude ranges.
- Allow pin adjustment before submission.
- Store only the coordinates needed for a public business listing; do not retain a user's personal location history.

### FR-03: Store records
Each store record should support:
- Unique ID.
- Store name.
- Description (optional).
- Address fields.
- Latitude and longitude.
- Public contact number (optional).
- Opening hours (optional).
- Delivery availability and fee (optional).
- Photo reference (optional).
- Listing status.
- Verification status.
- Created and updated timestamps.
- Creator and, when claimed, owner references.

### FR-04: Product catalog and store listings
- Store products separately from stores.
- Support multiple products per store.
- Store capacity as a numeric value and unit, preferably liters for containers.
- Store brand, material, dimensions, and model where relevant.
- Record price in PHP using a suitable decimal type.
- Record stock status and when it was last checked.
- Maintain a stable product identity so comparable listings can be matched.

### FR-05: Price history
- Do not silently overwrite history.
- Record each accepted price update as a historical event.
- Track submitted price, accepted price, source, timestamps, and moderator decision where applicable.
- Display the latest accepted price as the current reported price.
- Clearly distinguish the date reported from the date verified.

### FR-06: Search, filters, and sorting
- Search products and locations.
- Filter by category, capacity, brand, price range, and stock status.
- Sort by lowest reported price, distance (when location is available), and latest confirmation.
- Compare products only when important specifications match.
- State whether delivery and transport costs are included in any “best value” calculation.

### FR-07: Submission and moderation
- Store submissions default to Pending Review.
- Community price reports follow a configurable review policy.
- Provide validation feedback and submission confirmation.
- Prevent a contributor from approving their own content.
- Allow reporting of incorrect or stale data.
- Keep an audit trail for moderation actions.

### FR-08: Authentication and authorization
- Public browsing does not require an account.
- Protected operations require appropriate authentication.
- Store-owner claims require review.
- Enforce authorization on the server and database, not only in the UI.
- Never trust a client-provided role or verification flag.

### FR-09: Photos and uploads
- Support optional storefront, product, and price-evidence photos.
- Enforce allowed file types and size limits on the server.
- Use generated storage names rather than trusting uploaded filenames.
- Do not expose privileged storage credentials in the browser.
- Define retention and removal rules for rejected or abusive uploads.

### FR-10: Administration
- Secure admin access.
- Review queue with filters.
- Approve/reject/edit and merge duplicate records.
- Review reports and verify ownership.
- Display submission and price-change history.
- Manage categories and freshness rules.
- Record administrator actions.

### FR-11: Freshness and trust labels
- Show last reported and last confirmed timestamps.
- Define a configurable freshness period.
- Mark old information as Stale rather than implying it is current.
- Use labels such as Community Reported, Store Confirmed, and Admin Verified.
- Do not claim live inventory unless a reliable live integration exists.

### FR-12: Accessibility and performance
- Responsive layouts for mobile, tablet, and desktop.
- Accessible form labels, keyboard navigation, and contrast.
- Lightweight images and sensible loading states.
- Graceful error states for unavailable map tiles, geocoding, or database requests.
- Do not block all browsing when geolocation is unavailable.

## 8. Non-Functional Requirements

- **Security:** least-privilege access, server-side validation, secure secrets, and database policies.
- **Privacy:** collect only necessary user data and explain how public listing data is used.
- **Reliability:** useful error handling and backups appropriate to the hosting tier.
- **Performance:** paginate long result lists and avoid loading every store at once.
- **Maintainability:** documented modules, migrations, tests, and environment variables.
- **Portability:** keep map/geocoding providers configurable.
- **Cost control:** use free tiers where suitable, monitor quotas, and document limits.
- **Integrity:** use database constraints and transactions for related updates.

## 9. Suggested Data Model

The implementation agent should validate and refine this model before migration.

- `profiles`: user profile and application role reference.
- `stores`: name, address, coordinates, contact details, hours, status, verification status, creator, timestamps.
- `store_ownership_claims`: store, claimant, evidence/status, reviewer, timestamps. *(Post-MVP — see §4.2)*
- `products`: normalized product identity, category, name, brand, capacity, material, dimensions.
- `store_product_listings`: store, product, current accepted price, stock status, listing status, last reported/confirmed timestamps.
- `price_reports`: listing, submitted price, stock status, reporter, source, evidence photo, review status, timestamps.
- `price_history`: accepted price, effective timestamp, source report, moderator/verification metadata.
- `store_photos`: store, storage path, photo type, review status.
- `product_photos`: product/listing, storage path, review status.
- `content_reports`: target record, reason, reporter (optional), status, resolution.
- `moderation_actions`: actor, action, target, previous/new status where appropriate, reason, timestamp.
- `product_categories`: configurable category list.

Use foreign keys, indexes, timestamps, appropriate unique constraints, and row-level security policies where supported. Avoid storing duplicate address and product fields unnecessarily. The final schema must match actual query patterns and authorization rules.

## 10. Proposed Technology

Recommended default:
- Frontend: Next.js, React, TypeScript, and Tailwind CSS.
- Map UI: Leaflet.
- Map tiles: a compliant OpenStreetMap-compatible tile provider.
- Database/authentication: Supabase with PostgreSQL.
- File storage: Supabase Storage or another appropriately secured object store.
- Hosting: a suitable free or low-cost deployment service for the pilot.
- Directions: external mapping links initially.

Before implementation, verify current pricing, free-tier limits, regional availability, and terms. OpenStreetMap data attribution is required, and public tile/geocoding services have their own usage policies. Do not assume a free public endpoint supports production autocomplete or unlimited traffic.

## 11. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Incorrect or outdated prices | Show timestamps, freshness labels, reports, and verification sources. |
| Fake stores or duplicate pins | Moderation, duplicate detection, location/name checks, and merge tools. |
| Misleading product comparison | Normalize capacity and specifications; compare like-for-like products. |
| Malicious uploads or spam | File validation, rate limits, moderation, and safe storage. |
| Unauthorized edits | Server-side authorization and database policies. |
| Map/geocoding quotas or outages | Configurable providers, graceful fallback, and usage monitoring. |
| Low initial coverage | Pilot in one municipality and recruit participating stores and contributors. |
| Price claims causing disputes | Use neutral, factual reporting and avoid unsupported accusations. |
| Unexpected service charges | Check quotas and pricing before deployment; set alerts where available. |

## 12. MVP Acceptance Criteria

The MVP is acceptable when:
1. A visitor can browse approved stores without an account.
2. A visitor can search a product and location.
3. Approved stores appear on a map and in a list.
4. A map marker opens the correct store details.
5. A contributor can pin a location and submit a store.
6. A store can contain multiple product listings.
7. A price report includes a timestamp and source.
8. New store submissions remain hidden until approved.
9. Administrators can review, approve, reject, and merge duplicates.
10. The product comparison does not treat materially different capacities as equivalent.
11. Stale information is visibly marked.
12. Unauthorized users cannot perform protected actions.
13. Core workflows have automated tests.
14. The production build passes and deployment instructions are documented.
15. No real store prices or stock levels are fabricated in seed data.

## 13. Decisions Required Before Coding

Confirm or document:
- Pilot municipality and launch coverage.
- Exact initial product categories.
- Whether price updates require moderator approval or can be accepted from trusted contributors.
- Whether contributors must sign in to submit.
- Photo file-size limits and retention policy.
- Listing freshness period.
- Map tile and geocoding provider.
- Hosting and database plan.
- Admin account creation procedure.
- Privacy notice and terms for user submissions.

If not specified, use conservative defaults, document assumptions, and keep them configurable.
