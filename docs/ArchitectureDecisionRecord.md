# TubigWatch PH — Architecture Decision Record

**Document type:** Architecture Decision Record (ADR)  
**Version:** 1.0  
**Phase:** 0 — Decisions and setup  
**Status:** Approved — ready for Phase 1

---

## ADR-01: Pilot Municipality

**Decision:** Pilot location is a placeholder municipality pending final confirmation from the project owner.  
**Rationale:** A specific municipality must be confirmed before real store data is seeded. All development will use clearly labelled fictional data until then.  
**Action required:** Replace this placeholder with the confirmed municipality name before Phase 10 (pilot deployment).

---

## ADR-02: Anonymous Submissions

**Decision:** Anonymous users (no account required) may submit store locations and price reports.  
**Rationale:** Lowering the barrier to contribution maximizes community participation in a low-engagement early pilot.  
**Constraints:**
- Rate limiting must be applied to anonymous submission endpoints.
- All anonymous submissions go to the pending review queue; no auto-approval for anonymous users.
- No personal location history is stored for anonymous users.
- If spam becomes a problem, this policy can be changed to require sign-in without breaking the data model.

---

## ADR-03: Price-Report Moderation Policy

**Decision:** Trusted contributors' price reports are auto-accepted; reports from untrusted or anonymous users go to the moderation review queue.  
**Rationale:** Reduces moderator workload while maintaining quality for unknown submitters.  
**Implementation notes:**
- The `profiles` table must include a `trusted` flag (or equivalent role field).
- Auto-accepted reports must still be recorded in `price_history` with `source = 'community_reported'`.
- Moderators can revoke trust and reverse accepted reports.
- The trust level is configurable and should not be hardcoded.

---

## ADR-04: Listing Freshness Period

**Decision:** 7 days.  
**Rationale:** A week is a reasonable cycle for price and stock changes in a local market context. Short enough to be meaningful; long enough to not require constant re-confirmation.  
**Implementation notes:**
- Listings where `last_confirmed` is older than 7 days are labelled **Stale**.
- The freshness period must be a configurable value (environment variable or database setting), not a hardcoded constant.
- "Last confirmed" refers to the last time a price was admin-verified or store-confirmed, not merely reported.

---

## ADR-05: Photo File-Size and Retention Policy

**Decision:**
- Maximum upload size: **5 MB** per photo.
- Allowed file types: JPEG, PNG, WebP.
- **Retention policy for rejected uploads:** Photos associated with rejected submissions are deleted from storage within **30 days** of rejection. Photos associated with approved submissions are retained indefinitely unless the listing is deleted.
- Abusive or policy-violating uploads are deleted immediately upon moderation action.

**Implementation notes:**
- File type and size are validated server-side; client-side validation is a convenience only.
- Storage paths use generated UUIDs, never the original filename.
- Deletion must be triggered by the moderation action, not handled manually.

---

## ADR-06: Admin Account Creation Procedure

**Decision:** The first administrator account is created via a **one-time secure setup script** executed on the server after the first deployment.  
**Rationale:** Avoids exposing admin creation to the public UI and prevents privilege escalation by early users.  
**Procedure:**
1. Deploy the application to production.
2. Run the setup script with appropriate server credentials (not committed to source control).
3. The script sets the admin role directly in the `profiles` table using the Supabase service-role key, which is available only in the server environment.
4. The service-role key is never exposed to the browser or committed to source control.
5. After the admin account is created, the setup script must not be re-runnable without explicit confirmation (idempotent guard).

---

## ADR-07: Map Tile Provider

**Decision:** [Stadia Maps](https://stadiamaps.com/)  
**Rationale:** OSM-compatible, no API key required for low-traffic use, clean appearance suitable for mobile, free tier adequate for a local pilot.  
**Constraints:**
- Attribution to Stadia Maps and OpenStreetMap must be displayed on every map view (required by terms).
- If traffic exceeds free-tier limits, an API key must be obtained and stored in an environment variable.
- The provider is configurable via environment variable so it can be swapped without code changes.

**Attribution string required:**
```
© Stadia Maps © OpenStreetMap contributors
```

---

## ADR-08: Geocoding Provider

**Decision:** [Photon by Komoot](https://photon.komoot.io/)  
**Rationale:** Free to use for reasonable traffic, no API key required for basic use, OSM-based, and supports forward geocoding suitable for address search.  
**Constraints:**
- Photon does not guarantee SLA or uptime for the public endpoint. The implementation must handle graceful failures.
- Do not use Photon's public endpoint for autocomplete on every keystroke without debouncing (minimum 300 ms delay).
- If the public endpoint becomes unavailable or rate-limited, the configurable provider can be swapped for Geoapify or another provider.
- Attribution to OpenStreetMap contributors is required where results are displayed.

---

## ADR-09: Database and Authentication

**Decision:** [Supabase](https://supabase.com/) — PostgreSQL database, Supabase Auth, Supabase Storage.  
**Rationale:** Integrated stack reduces setup friction for the pilot; PostgreSQL provides strong typing, foreign keys, and row-level security; Supabase Auth supports anonymous and email sign-in; free tier is adequate for a pilot.  
**Constraints:**
- Free tier limits: 500 MB database, 1 GB file storage, 50,000 monthly active users.
- Supabase projects pause after 1 week of inactivity on the free plan — monitor this during pilot.
- Service-role key must remain server-side only and never be included in client bundles.
- Row-level security policies must be enabled on all tables.
- Review Supabase's current terms and free-tier limits before public launch.

---

## ADR-10: Hosting Provider

**Decision:** [Vercel](https://vercel.com/)  
**Rationale:** Optimized for Next.js, generous free tier (100 GB bandwidth, serverless functions, preview deployments), GitHub integration, automatic HTTPS.  
**Constraints:**
- Free tier serverless function execution is limited to 10-second timeout on Hobby plan.
- Environment variables are configured in the Vercel dashboard and never committed to source control.
- Production and preview environments use separate environment variable sets.
- Review Vercel's current fair-use policy before public launch.

---

## ADR-11: Product Categories (Initial)

**Decision:** Initial categories confirmed as:
- Buckets
- Water containers
- Drums
- Tanks

Additional categories can be added by administrators through the product categories management interface without a code deployment.

---

## Provider Cost and Quota Summary

| Provider | Service | Free Tier Limit | Key Required |
|---|---|---|---|
| Supabase | Database + Auth + Storage | 500 MB DB, 1 GB storage, 50K MAU | Yes (server-side only) |
| Stadia Maps | Map tiles | Reasonable traffic, no defined cap | No (low traffic) |
| Photon / Komoot | Geocoding | No defined limit; public endpoint | No |
| Vercel | Hosting | 100 GB bandwidth, 100K function invocations/day | No (GitHub deploy) |

> **Important:** Verify all limits against each provider's current terms before public launch. Free tiers change without notice.

---

## Risks Accepted in Phase 0

| Risk | Accepted Mitigation |
|---|---|
| Pilot municipality unconfirmed | Placeholder used; blocked before Phase 10 |
| Anonymous submissions may attract spam | Rate limiting, pending queue, revocable policy |
| Photon public endpoint has no SLA | Graceful failure handling; configurable provider |
| Supabase free tier project pausing | Monitor activity; upgrade if needed |
| Stadia Maps undocumented free cap | Monitor usage; configure API key if prompted |
