# TubigWatch PH

Community-powered water supply and price finder for Philippine municipalities.

TubigWatch PH helps residents locate stores selling water containers, compare prices for equivalent products, check reported availability, and contribute store locations and price updates.

## Status

🚧 **Phase 1 complete — Foundation** | Phase 2 next: Database and access control

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Map | Leaflet + Stadia Maps tiles |
| Geocoding | Photon by Komoot |
| Hosting | Vercel |

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com) project (free tier)

### 1. Clone and install

```bash
git clone https://github.com/eraser67/tubigwatch-ph.git
cd tubigwatch-ph
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your real values. See [`docs/EnvironmentVariables.md`](docs/EnvironmentVariables.md) for a full reference.

> ⚠️ **Never commit `.env.local` or any real secrets to source control.**

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Other commands

```bash
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier (write)
npm run format:check # Prettier (check only)
npm test             # Placeholder — tests added in Phase 9
```

## Project Documentation

| Document | Purpose |
|---|---|
| [`docs/ProjectRequirementsPlan.md`](docs/ProjectRequirementsPlan.md) | Product and software requirements |
| [`docs/Developmentplan.md`](docs/Developmentplan.md) | Phase-by-phase development plan |
| [`docs/Todo.md`](docs/Todo.md) | Implementation checklist |
| [`docs/ArchitectureDecisionRecord.md`](docs/ArchitectureDecisionRecord.md) | All architectural decisions (Phase 0) |
| [`docs/EnvironmentVariables.md`](docs/EnvironmentVariables.md) | Environment variable reference |

## Repository Structure

```
src/
  app/                  # Next.js App Router pages and layouts
    (public routes)     # map, stores, compare, contribute
    admin/              # Protected admin dashboard (Phase 8)
    api/                # Server-side API routes
  components/
    layout/             # SiteHeader, SiteFooter
    feedback/           # LoadingSpinner, ErrorState, EmptyState
    map/                # Map components (Phase 4)
    stores/             # Store cards and lists (Phase 3)
    forms/              # Submission forms (Phase 5–6)
  lib/
    env.ts              # Environment variable validation (Zod)
    constants.ts        # App-wide constants and enums
    auth/               # Auth helpers (Phase 2)
    database/           # Supabase client and queries (Phase 2)
    validation/         # Shared Zod schemas (Phase 2–)
docs/                   # Planning and reference documents
supabase/               # Migrations and seed data (Phase 2)
```

## Data Attribution

Map tiles by [Stadia Maps](https://stadiamaps.com/) · Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) · Geocoding by [Photon / Komoot](https://photon.komoot.io/)

## License

Private — pilot project. Not licensed for public redistribution.
