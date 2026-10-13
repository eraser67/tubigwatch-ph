# TubigWatch PH — Environment Variables

**Document type:** Environment variable reference  
**Version:** 1.0  
**Phase:** 0 — Decisions and setup

All environment variables must be stored in the hosting provider's dashboard (Vercel) or a local `.env.local` file.  
**Never commit real values to source control.** The `.env.example` file contains placeholder names only.

---

## Supabase

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. Safe to expose to the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key. Safe to expose to the browser; subject to RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service-role key. **Server-side only. Never expose to the browser.** |

---

## Map and Geocoding

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_MAP_TILE_PROVIDER` | Yes | Tile URL template. Default: Stadia Maps Alidade Smooth Dark or equivalent. |
| `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION` | Yes | Attribution string displayed on the map. Required by tile provider terms. |
| `STADIA_MAPS_API_KEY` | No | Required only if Stadia Maps requests one for higher traffic. Leave empty for low-traffic use. |
| `NEXT_PUBLIC_GEOCODING_PROVIDER_URL` | Yes | Base URL for geocoding requests. Default: `https://photon.komoot.io`. |

---

## Application Settings

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Public base URL of the deployed app (e.g. `https://tubigwatch.vercel.app`). |
| `LISTING_FRESHNESS_DAYS` | Yes | Number of days before a listing is considered Stale. Default: `7`. |
| `PHOTO_MAX_SIZE_BYTES` | Yes | Maximum allowed photo upload size in bytes. Default: `5242880` (5 MB). |
| `PHOTO_ALLOWED_TYPES` | Yes | Comma-separated allowed MIME types. Default: `image/jpeg,image/png,image/webp`. |
| `PHOTO_REJECTION_RETENTION_DAYS` | Yes | Days to retain photos from rejected submissions before deletion. Default: `30`. |
| `ANONYMOUS_SUBMISSIONS_ENABLED` | Yes | `true` to allow anonymous store/price submissions. Default: `true`. |
| `TRUSTED_CONTRIBUTOR_AUTO_ACCEPT` | Yes | `true` to auto-accept price reports from trusted contributors. Default: `true`. |

---

## Rate Limiting

| Variable | Required | Description |
|---|---|---|
| `RATE_LIMIT_SUBMISSIONS_PER_HOUR` | Yes | Max anonymous submissions per IP per hour. Default: `10`. |
| `RATE_LIMIT_PRICE_REPORTS_PER_HOUR` | Yes | Max price reports per IP per hour. Default: `20`. |

---

## `.env.example` (copy this file, fill in real values in `.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Map tiles (Stadia Maps — no key needed for low traffic)
NEXT_PUBLIC_MAP_TILE_PROVIDER=https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png
NEXT_PUBLIC_MAP_TILE_ATTRIBUTION=© Stadia Maps © OpenStreetMap contributors
STADIA_MAPS_API_KEY=

# Geocoding (Photon by Komoot — no key needed)
NEXT_PUBLIC_GEOCODING_PROVIDER_URL=https://photon.komoot.io

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
LISTING_FRESHNESS_DAYS=7
PHOTO_MAX_SIZE_BYTES=5242880
PHOTO_ALLOWED_TYPES=image/jpeg,image/png,image/webp
PHOTO_REJECTION_RETENTION_DAYS=30
ANONYMOUS_SUBMISSIONS_ENABLED=true
TRUSTED_CONTRIBUTOR_AUTO_ACCEPT=true

# Rate limiting
RATE_LIMIT_SUBMISSIONS_PER_HOUR=10
RATE_LIMIT_PRICE_REPORTS_PER_HOUR=20
```

---

## Notes

- Variables prefixed `NEXT_PUBLIC_` are bundled into the client. **Never put secrets in `NEXT_PUBLIC_` variables.**
- `SUPABASE_SERVICE_ROLE_KEY` is used only in server-side API routes and the admin setup script.
- In Vercel, set `NEXT_PUBLIC_APP_URL` to the production domain after it is confirmed.
- Separate Vercel environment variable sets should be configured for Production, Preview, and Development.
