# TinDog 🐾

Tinder-style web app for dog owners: find a **forever home**, a **foster family**, or **playdate friends** for dogs. Swipe right to send a request, the dog's owner approves, and a realtime chat opens.

Final project for **Internet Technologies — RUNI CS 2026**.

- **Live app**: _add Vercel URL after deployment_
- **Stack**: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 + shadcn/ui · Supabase (Postgres, Auth, Storage, Realtime) · Vercel

## Project documents (Hebrew)

| Document | File |
|---|---|
| Product spec | [docs/product-spec.md](docs/product-spec.md) |
| Technical design | [docs/technical-design.md](docs/technical-design.md) |
| Test spec | [docs/test-spec.md](docs/test-spec.md) |
| Basic scale | [docs/scale.md](docs/scale.md) |
| Basic security | [docs/security.md](docs/security.md) |
| Presentation outline | [docs/presentation.md](docs/presentation.md) |

## Running locally

### 1. Prerequisites

- Node.js 20+
- A Supabase project ([supabase.com](https://supabase.com), free tier) — or Docker for a local stack

### 2. Set up Supabase

**Option A — cloud project (recommended for simplicity):**

1. Create a project at supabase.com.
2. Open the **SQL Editor** and run the whole contents of `supabase/migrations/0001_init.sql`.
3. In **Authentication → Sign In / Up → Email**, disable *Confirm email* (or keep it on and confirm manually).

**Option B — local stack (requires Docker):**

```bash
npx supabase start   # migration in supabase/migrations is applied automatically
```

### 3. Environment variables

```bash
cp .env.example .env.local
```

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (Dashboard → Settings → API, or `npx supabase status` locally) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The `anon` public API key. Safe to expose — everything it allows is enforced by Row Level Security |
| `NEXT_PUBLIC_SITE_URL` | App base URL, `http://localhost:3000` locally (used by e2e tests) |

The `service_role` key is **only** needed for the optional seed script and must never be put in client code or committed.

### 4. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### 5. (Optional) Seed demo data

```bash
SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<service-role-key> npm run seed
```

Creates 3 demo users (password `Demo1234!`) and 5 dogs across all listing types.

## Tests

```bash
npm test       # unit + component tests (Vitest + React Testing Library)
npm run e2e    # end-to-end tests (Playwright) — needs a running Supabase; starts the dev server itself
```

## Deployment

1. Push the repo to GitHub.
2. Import into [Vercel](https://vercel.com), add the two `NEXT_PUBLIC_SUPABASE_*` env vars, deploy.
3. In Supabase **Authentication → URL Configuration**, set the Site URL to the Vercel URL.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run e2e` | Playwright e2e |
| `npm run seed` | Demo data |
