# TubigWatch PH — Development Plan

**Version:** 1.0  
**Approach:** Incremental, test-first where practical, AI-assisted implementation  
**Target:** A secure MVP pilot in one Philippine municipality

## 1. Development Principles

1. Inspect before changing: if a repository already exists, review it before proposing edits.
2. Build in small phases with a clear completion gate.
3. Keep the map and accurate price comparison as the core product.
4. Do not implement payments, delivery dispatch, or forecasting in the MVP.
5. Use real data only when obtained from legitimate sources; label all demo data clearly.
6. Never expose secrets in source code or browser bundles.
7. Enforce permissions on the server and database.
8. Preserve price history and distinguish reported from verified data.
9. Test each phase before moving forward.
10. Keep costs and external service limits visible.

## 2. Suggested Architecture

### Frontend
- Next.js + TypeScript.
- Tailwind CSS for responsive styling.
- Leaflet for map interaction.
- Reusable components for map markers, store cards, product filters, price badges, and forms.
- Separate public pages from protected administration pages.

### Backend and data
- Supabase PostgreSQL for structured data.
- Supabase Auth if its current plan and requirements fit the project.
- Supabase Storage or another secured storage service for photos.
- Server-side API routes/actions for operations that need validation, moderation, privileged access, or secret credentials.
- Row-level security and least-privilege database policies.

### Mapping
- Leaflet renders the map and markers.
- Select an OpenStreetMap-compatible tile provider and follow its current terms, attribution, caching, and traffic policies.
- Use a configurable geocoding provider for address search; do not assume public Nominatim supports autocomplete or unrestricted production traffic.
- Use external direction links initially instead of building a routing engine.

### Deployment
- Use environment variables for database, auth, storage, and provider configuration.
- Maintain separate local/development and production settings.
- Apply database migrations deliberately.
- Confirm free-tier limits, backups, and usage monitoring before public launch.

## 3. Proposed Repository Structure

Adapt this to the actual framework and repository after inspection.

```text
tubigwatch-ph/
  app/
    (public)/
      page.tsx
      map/
      stores/
      products/
      compare/
      contribute/
    admin/
      review-queue/
      stores/
      reports/
    api/
  components/
    map/
    stores/
    products/
    forms/
    layout/
    feedback/
  lib/
    auth/
    database/
    validation/
    maps/
    pricing/
    moderation/
  types/
  public/
  supabase/
    migrations/
    seed.sql
  tests/
    unit/
    integration/
    e2e/
  docs/
    ProjectRequirementsPlan.md
    Developmentplan.md
    Todo.md
    ArchitectureDecisionRecord.md
    EnvironmentVariables.md
  .env.example
  README.md
```

The coding agent may adjust naming to match the selected framework version. Do not create unnecessary layers just to match this example.

## 4. Phase-by-Phase Plan

### Phase 0 — Discovery and decisions

**Objective:** Confirm requirements and implementation constraints before coding.

Tasks:
- Inspect repository and current project structure, if any.
- Identify existing stack, dependencies, code quality, and deployment setup.
- Confirm pilot municipality and initial product categories.
- Select database, map tile, geocoding, image storage, and hosting providers.
- Verify current service pricing and usage policies.
- Record assumptions and risks.
- Confirm whether users can submit anonymously or need accounts.

Deliverables:
- Repository assessment.
- Architecture decision record.
- Initial data model.
- Environment-variable list.
- Phase implementation plan.

**Gate:** No implementation starts until the architecture, scope, and required accounts/keys are documented. Do not request secrets in chat or commit them.

### Phase 1 — Project foundation

**Objective:** Create a maintainable application shell.

Tasks:
- Initialize or clean up the application.
- Configure TypeScript, linting, formatting, and environment validation.
- Add global responsive layout and navigation.
- Add reusable loading, empty, error, and not-found states.
- Add `.env.example` with placeholder names only.
- Set up automated build and test commands.
- Document local setup.

Deliverables:
- Application boots locally.
- Responsive base layout.
- Build/lint/test scripts.
- Setup documentation.

**Gate:** Clean install, successful build, and basic automated checks pass.

### Phase 2 — Database and security foundation

**Objective:** Create the schema and enforce safe data access.

Tasks:
- Create migrations for profiles, stores, products, listings, reports, history, photos, and moderation actions.
- Add foreign keys, indexes, timestamps, constraints, and appropriate unique rules.
- Define listing, verification, and review statuses.
- Configure authentication if required.
- Define row-level security policies.
- Separate public approved read access from protected writes.
- Implement server-side validation.
- Add test fixtures using clearly fictional data.

Deliverables:
- Repeatable migrations.
- Documented schema.
- Authorization policy tests.
- Safe development seed data.

**Gate:** Unauthenticated and unauthorized access tests demonstrate that protected records cannot be modified or exposed improperly.

### Phase 3 — Store and product management

**Objective:** Establish correct store and product records before building comparison.

Tasks:
- Implement store creation and editing for authorized roles.
- Implement product catalog and category management.
- Implement multiple product listings per store.
- Validate coordinates, addresses, prices, capacity, and stock status.
- Add duplicate detection based on normalized names and nearby coordinates.
- Add photo upload validation and safe storage paths.
- Keep community submissions pending until review.

Deliverables:
- Store and product forms.
- Server-side validation.
- Duplicate warnings.
- Basic administration of stores/products.

**Gate:** Tests cover valid and invalid store/product records, duplicate detection, and photo upload validation.

### Phase 4 — Interactive map

**Objective:** Make the map the main discovery experience.

Tasks:
- Integrate Leaflet and a compliant tile provider.
- Add map attribution.
- Render approved store markers.
- Add marker previews and store detail links.
- Add zoom, pan, and recenter controls.
- Add optional browser geolocation with explicit user action.
- Add manual search or navigation fallback when geolocation is denied.
- Add mobile map/list toggle.
- Load markers based on the visible area or paginated query when scale requires it.
- Handle tile or geocoding failure gracefully.

Deliverables:
- Interactive map page.
- Store marker previews.
- Mobile-friendly list/map experience.
- Location permission and error handling.

**Gate:** Users can browse without granting location permission; markers open correct records; mobile and desktop checks pass.

### Phase 5 — Add a store using a map pin

**Objective:** Allow community members to contribute store locations.

Tasks:
- Build the guided Add Store flow.
- Support address search when configured.
- Allow manual map pin placement and adjustment.
- Capture coordinates and show the selected address when available.
- Collect store details and optional photo.
- Validate required fields.
- Submit to a pending-review queue.
- Prevent public visibility before approval.
- Add success and error feedback.

Deliverables:
- Complete store submission workflow.
- Pending status and review queue integration.
- Tests for coordinates, required fields, and permissions.

**Gate:** A valid submission is stored with the intended coordinates and is not publicly visible until approved.

### Phase 6 — Price submissions and history

**Objective:** Collect useful prices without losing historical context.

Tasks:
- Build product-price entry and update flows.
- Capture price in PHP, stock status, source, and submission time.
- Accept optional evidence photos.
- Keep submitted reports separate from accepted current prices.
- Record approved changes in price history.
- Define configurable freshness rules.
- Label data as community-reported, store-confirmed, or admin-verified.
- Flag stale listings clearly.

Deliverables:
- Price update form.
- Review workflow.
- Price history records.
- Freshness labels.

**Gate:** Price changes preserve history and the UI never presents stale reports as guaranteed current inventory.

### Phase 7 — Search, filters, and price comparison

**Objective:** Help users find affordable comparable products.

Tasks:
- Implement search by product, store, and location.
- Add category, capacity, brand, price, and stock filters.
- Add sort by lowest price, distance when location is available, and latest confirmation.
- Match products using important specifications.
- Show comparable store prices and potential savings.
- Display distance only when calculated reliably.
- State clearly whether delivery or travel costs are included.
- Add empty states when no comparable listings exist.

Deliverables:
- Search results.
- Filters and sorting.
- Product comparison view.
- Clear freshness and verification labels.

**Gate:** Automated tests confirm sorting, filtering, comparable-product rules, and savings calculations.

### Phase 8 — Admin moderation and trust

**Objective:** Keep listings useful and reduce abuse.

Tasks:
- Build a protected moderation queue.
- Approve/reject stores and price reports.
- Review reports of inaccurate data.
- Merge duplicates while preserving history.
- Add store-ownership verification workflow if included.
- Record moderation actions and reasons.
- Add basic rate limits and abuse protection.
- Make public verification labels understandable.

Deliverables:
- Admin dashboard.
- Moderation audit trail.
- Duplicate merge flow.
- Abuse reporting.

**Gate:** Only authorized moderators can approve content; all material moderation actions are auditable.

### Phase 9 — Quality, accessibility, and performance

**Objective:** Prepare for real users and slower devices/connections.

Tasks:
- Unit-test pricing and comparison logic.
- Integration-test data access and authorization.
- End-to-end test search, map, submission, and moderation.
- Test mobile layouts, touch targets, keyboard navigation, and contrast.
- Test location denial, invalid data, missing images, stale listings, and service failures.
- Optimize image sizes and result pagination.
- Check dependencies and exposed environment variables.
- Add error logging that avoids sensitive data.

Deliverables:
- Test report.
- Fixed critical defects.
- Accessibility and performance review.
- Security checklist.

**Gate:** No known critical security issue; build and required tests pass.

### Phase 10 — Pilot deployment

**Objective:** Launch safely in one municipality.

Tasks:
- Configure production environment variables.
- Apply reviewed migrations.
- Create the first administrator securely.
- Configure storage and map providers.
- Set up backups or export procedures suitable for the selected plan.
- Verify domain, HTTPS, and access controls.
- Publish privacy notice, terms for submissions, and community guidelines.
- Recruit initial stores and seed approved listings with permission.
- Verify sample prices with suppliers.
- Monitor service quotas and error rates.

Deliverables:
- Production deployment.
- Admin access instructions.
- Operations and recovery notes.
- Pilot launch checklist.

**Gate:** Run a production smoke test using non-destructive actions and verify the core user journey end to end.

### Phase 11 — Pilot feedback and iteration

**Objective:** Validate real-world usefulness before expanding.

Tasks:
- Collect feedback from residents and suppliers.
- Measure listing freshness and completeness.
- Review incorrect-price and duplicate reports.
- Improve confusing flows.
- Identify areas with low store coverage.
- Review hosting, storage, map, and geocoding usage.
- Prioritize only improvements supported by observed needs.

Deliverables:
- Pilot findings.
- Prioritized backlog.
- Cost/usage review.
- Decision to continue, revise, or expand.

**Gate:** Expand only when the local listing coverage and information quality are sufficient to help users.

## 5. Testing Strategy

### Unit tests
- Price validation and currency formatting.
- Product comparability rules.
- Sorting and filtering.
- Stale-listing calculations.
- Potential savings calculation.
- Coordinate validation.

### Integration tests
- Store submission and approval.
- Price report and history creation.
- Database authorization.
- Photo upload validation.
- Duplicate detection and merge.
- Moderation audit records.

### End-to-end tests
1. Browse without signing in.
2. Search for a product.
3. View map marker and store details.
4. Submit a store pin.
5. Confirm it is pending and not public.
6. Approve it as an administrator.
7. Confirm it appears on map and list.
8. Submit a price update.
9. Confirm the accepted price and history are correct.
10. Attempt unauthorized approval and verify denial.

## 6. Suggested Build Order for AI Coding Agents

For each phase, ask the agent to:
1. Inspect relevant existing code and tests.
2. Explain planned files and data changes.
3. Implement only the current phase.
4. Add or update tests.
5. Run build, lint, and relevant tests.
6. Review security and regressions.
7. Report files changed, commands run, test results, known issues, and manual verification steps.
8. Stop at the phase gate and wait for review before starting the next phase.

Do not ask the agent to implement all phases in one run. Keep the requirements and development plan as source-of-truth documents.

## 7. Deployment and Cost Notes

- Check current provider terms and free-tier quotas before committing to a provider.
- Free tiers may have sleep, bandwidth, database, storage, or request limits.
- Public map tiles and geocoding endpoints are not automatically free for unlimited production use.
- Add basic usage monitoring before sharing the app widely.
- Do not put service-role keys or other privileged secrets in client-side variables.
- Keep the initial product free of checkout and delivery dispatch to reduce complexity.

## 8. Definition of Done for Every Phase

A phase is complete only when:
- Requirements for that phase are implemented.
- Tests are added or updated.
- Build and relevant checks pass.
- Authorization and validation are reviewed.
- Documentation is updated.
- No unrelated business rules are changed.
- Remaining issues and manual checks are recorded.
- The phase report is reviewed before moving on.
