# TubigWatch PH — Project Todo

Use this file as the implementation checklist. Complete tasks in order unless a dependency requires a documented change. Do not mark an item complete until it has been implemented and verified.

Legend:
- [ ] Not started
- [x] Completed and verified
- [!] Blocked or requires a decision

## Phase 0 — Decisions and setup

> Decisions documented in [ArchitectureDecisionRecord.md](ArchitectureDecisionRecord.md) and [EnvironmentVariables.md](EnvironmentVariables.md).

- [!] Choose the initial pilot municipality. — *Placeholder in use; confirm before Phase 10.*
- [x] Confirm initial categories: buckets, containers, drums, and tanks. — *ADR-11*
- [x] Decide whether anonymous users may submit store/price reports. — *Yes — ADR-02*
- [x] Decide the initial price-report moderation policy. — *Trusted-contributor auto-accept — ADR-03*
- [x] Define the initial listing freshness period. — *7 days — ADR-04*
- [x] Review and approve the Project Requirements Plan.
- [x] Review and approve the Development Plan.
- [x] Choose the map tile provider and confirm its terms, attribution, and quotas. — *Stadia Maps — ADR-07*
- [x] Choose a geocoding provider and confirm whether the intended search pattern is allowed. — *Photon by Komoot — ADR-08*
- [x] Choose database/authentication and photo-storage services. — *Supabase — ADR-09*
- [x] Choose a hosting provider and check current free-tier limits. — *Vercel — ADR-10*
- [x] Create required accounts privately; do not paste secrets into prompts or source control.
- [x] Define photo file-size limits and retention/removal policy for rejected or abusive uploads. — *5 MB / 30-day retention — ADR-05*
- [x] Decide and document the admin account creation procedure. — *Server setup script — ADR-06*
- [x] Record decisions and provider costs in project documentation. — *See ADR and EnvironmentVariables docs*

## Phase 1 — Repository and foundation

- [ ] Inspect repository and current code before modifying it.
- [ ] Record the current stack, folder structure, and existing deployment approach.
- [ ] Create or refine the application structure.
- [ ] Configure TypeScript and linting/formatting.
- [ ] Add environment-variable validation.
- [ ] Add `.env.example` with placeholder names only.
- [ ] Create responsive site layout and navigation.
- [ ] Add loading, empty, error, and not-found states.
- [ ] Configure build, lint, and test scripts.
- [ ] Document local setup.
- [ ] Update README with project description and setup instructions.
- [ ] Verify clean install and successful build.

## Phase 2 — Database and access control

- [ ] Finalize normalized data model.
- [ ] Create migrations for profiles and roles.
- [ ] Create stores table.
- [ ] Create product categories and products tables.
- [ ] Create store-product listings table.
- [ ] Create price reports and price history tables.
- [ ] Create photo metadata tables or references.
- [ ] Create content reports and moderation action tables.
- [!] Create store_ownership_claims table — deferred to post-MVP (see §4.2 of Requirements).
- [ ] Add foreign keys, indexes, constraints, and timestamps.
- [ ] Define store listing, verification, and review statuses.
- [ ] Configure authentication if required.
- [ ] Implement database access policies.
- [ ] Implement server-side authorization.
- [ ] Add fictional development-only seed data with clear labels.
- [ ] Test unauthorized reads and writes.
- [ ] Verify migrations can be applied reproducibly.

## Phase 3 — Store and product management

- [ ] Implement store data validation.
- [ ] Implement product and category data validation.
- [ ] Support multiple products per store.
- [ ] Validate PHP prices, capacity, dimensions, and stock status.
- [ ] Implement duplicate-store warnings.
- [ ] Implement optional storefront/product/evidence photo upload.
- [ ] Enforce file type and size limits server-side.
- [ ] Implement retention and removal rules for rejected or abusive photo uploads.
- [ ] Use safe generated upload names.
- [ ] Create basic protected store/product administration.
- [ ] Test invalid, duplicate, and unauthorized submissions.

## Phase 4 — Interactive map

- [ ] Integrate Leaflet.
- [ ] Configure a compliant map tile provider.
- [ ] Add required map attribution.
- [ ] Display approved store markers.
- [ ] Add store preview on marker selection.
- [ ] Link markers to store detail pages.
- [ ] Add zoom and pan controls.
- [ ] Add recenter-map control.
- [ ] Implement “Use My Location” after explicit user action.
- [ ] Implement manual browsing when location permission is denied.
- [ ] Add mobile map/list toggle.
- [ ] Add loading and map-service failure states.
- [ ] Test on mobile and desktop.
- [ ] Verify pending/rejected stores are not publicly displayed.

## Phase 5 — Add a store using a pin

- [ ] Create Add Store entry point.
- [ ] Implement location search if supported by selected provider.
- [ ] Allow map tapping to place a pin.
- [ ] Allow pin movement/correction.
- [ ] Capture and validate latitude/longitude.
- [ ] Collect store name and address.
- [ ] Collect optional contact number and opening hours.
- [ ] Collect optional delivery details.
- [ ] Collect optional storefront photo.
- [ ] Allow one or more products to be added during submission.
- [ ] Validate the form on client and server.
- [ ] Save submission as Pending Review.
- [ ] Display clear submission confirmation.
- [ ] Test that pending stores remain hidden publicly.

## Phase 6 — Price updates and freshness

- [ ] Create Report Price Update workflow.
- [ ] Allow selection of an existing product listing.
- [ ] Capture price in PHP.
- [ ] Capture stock status.
- [ ] Capture report source and timestamp.
- [ ] Support optional evidence photo.
- [ ] Separate submitted reports from accepted current prices.
- [ ] Record accepted changes in price history.
- [ ] Define configurable stale/fresh rules.
- [ ] Show last-reported and last-confirmed times.
- [ ] Add community-reported/store-confirmed/admin-verified labels.
- [ ] Test history preservation and stale listing behavior.

## Phase 7 — Search and comparison

- [ ] Add product search.
- [ ] Add store and location search.
- [ ] Add category filter.
- [ ] Add capacity and brand filters.
- [ ] Add price range filter.
- [ ] Add stock-status filter.
- [ ] Add lowest-price sorting.
- [ ] Add latest-confirmation sorting.
- [ ] Add distance sorting when a valid user-selected location exists.
- [ ] Define rules for equivalent-product matching.
- [ ] Display comparable store prices.
- [ ] Calculate potential savings correctly.
- [ ] Clarify whether transport/delivery costs are included.
- [ ] Add no-results and no-comparable-product states.
- [ ] Test filters, sorting, and calculations.

## Phase 8 — Administration and moderation

- [ ] Create protected admin route and authorization.
- [ ] Create pending store review queue.
- [ ] Create pending price report queue.
- [ ] Implement approve/reject actions.
- [ ] Record moderation decisions and reasons.
- [ ] Implement inaccurate listing reports.
- [ ] Implement duplicate-store review and merge.
- [ ] Preserve price history during edits and merges.
- [ ] Add store-owner claim verification if in MVP scope.
- [ ] Add submission rate limits and abuse protection.
- [ ] Test that contributors cannot approve their own submissions.
- [ ] Test audit history for moderation actions.

## Phase 9 — Quality and security

- [ ] Add unit tests for price and product comparison logic.
- [ ] Add tests for coordinate validation.
- [ ] Add tests for stale listing rules.
- [ ] Add integration tests for store approval.
- [ ] Add integration tests for price history.
- [ ] Add authorization and database-policy tests.
- [ ] Add end-to-end tests for search and map browsing.
- [ ] Add end-to-end tests for store submission and moderation.
- [ ] Test denied location permission.
- [ ] Test unavailable map tiles and geocoding.
- [ ] Test missing images and invalid uploads.
- [ ] Test mobile layouts and touch targets.
- [ ] Review accessibility and keyboard navigation.
- [ ] Review environment variables and client bundles for leaked secrets.
- [ ] Review dependency vulnerabilities.
- [ ] Optimize images and paginate results.
- [ ] Run build, lint, and all required tests.
- [ ] Document unresolved issues and manual checks.

## Phase 10 — Pilot deployment

- [ ] Configure production environment variables.
- [ ] Review and apply production database migrations.
- [ ] Create the first administrator securely.
- [ ] Configure photo storage permissions.
- [ ] Configure map/geocoding provider settings.
- [ ] Verify HTTPS and domain settings.
- [ ] Configure suitable backup/export process.
- [ ] Publish privacy notice and submission/community guidelines.
- [ ] Add a small set of approved, permissioned real store listings.
- [ ] Confirm initial prices and availability with suppliers.
- [ ] Set up basic error and usage logging that avoids capturing personal data.
- [ ] Run production smoke tests.
- [ ] Check service usage limits and cost alerts where available.
- [ ] Document deployment and recovery steps.

## Phase 11 — Pilot review

- [ ] Recruit initial stores and contributors.
- [ ] Collect resident feedback.
- [ ] Measure approved store coverage.
- [ ] Measure listing freshness.
- [ ] Review incorrect-price reports and duplicates.
- [ ] Identify areas/products with insufficient data.
- [ ] Review hosting, storage, map, and geocoding usage.
- [ ] Prioritize fixes based on observed user needs.
- [ ] Decide whether to continue, revise, or expand the pilot.

## Release checklist

- [ ] Core user journeys work on mobile and desktop.
- [ ] No known critical security defects.
- [ ] All public prices have source and freshness information.
- [ ] Pending listings are not publicly visible.
- [ ] Product comparisons respect capacity and key specifications.
- [ ] Admin actions are protected and auditable.
- [ ] Build and required tests pass.
- [ ] Environment setup and deployment are documented.
- [ ] Real listings are not fabricated.
- [ ] Provider terms and usage limits have been reviewed.
