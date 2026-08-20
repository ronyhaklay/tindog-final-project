# TinDog 🐾

TinDog is a full-stack dog-adoption web application that connects **people who want to adopt a dog** with **animal shelters and rescue organizations**.

The adopter experience is swipe-based and visual: users discover dogs, open rich dog profiles, save favorites, send adoption interest, and continue to a chat after the shelter approves the request. Shelter representatives manage dog listings and incoming adoption requests from a dedicated shelter flow.

Final project for **Internet Technologies — RUNI CS 2026**.

- **Repository**: https://github.com/ronyhaklay/tindog-final-project
- **Live app**: https://tindog-final-project-m9ac.vercel.app
- **Stack**: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 + shadcn/ui · Supabase (Postgres, Auth, Storage, Realtime) · Vercel

## Project documents

| Document | File |
|---|---|
| Product specification | [docs/product-spec.md](docs/product-spec.md) |
| Technical design | [docs/technical-design.md](docs/technical-design.md) |
| Test specification | [docs/test-spec.md](docs/test-spec.md) |
| Basic scale | [docs/scale.md](docs/scale.md) |
| Basic security | [docs/security.md](docs/security.md) |
| Presentation outline | [docs/presentation.md](docs/presentation.md) |

## Demo accounts

Password for all demo accounts: **`Demo1234!`**

| Account | Role / organization |
|---|---|
| `maya@demo.tindog.app` | Shelter representative — תנו לחיות לחיות |
| `daniel@demo.tindog.app` | Shelter representative — יד4 |
| `noa@demo.tindog.app` | Shelter representative — צער בעלי חיים |
| `max@demo.tindog.app` | Shelter representative — אס.או.אס |
| `alex@demo.tindog.app` | Adopter |

The demo accounts allow the evaluator to inspect both sides of the product: the adopter flow and the shelter-management flow.

## Running locally

### 1. Prerequisites

- Node.js 20+
- npm
- Docker Desktop if using the local Supabase stack
- Supabase CLI

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public `anon` / publishable key |
| `NEXT_PUBLIC_SITE_URL` | Base URL of the app; use `http://localhost:3000` locally |

Never expose or commit a Supabase `service_role` key. It is privileged and is used only for trusted server-side or seed operations when required.

### 4. Database

#### Option A — local Supabase

Start the local stack:

```bash
npx supabase start
```

Apply all migrations:

```bash
npx supabase migration up
```

#### Option B — Supabase Cloud

Link the project once:

```bash
npx supabase link --project-ref <your-project-ref>
```

Then apply the repository migrations:

```bash
npx supabase db push
```

### 5. Start the application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Tests

### Unit + component tests

```bash
npm test
```

Current verified result:

```text
Test Files  5 passed (5)
Tests       37 passed (37)
```

The suite uses **Vitest + React Testing Library** and covers validation, deck logic, authentication error UI, dog cards, and adoption-request components.

### End-to-end tests

Install the Playwright browser once if necessary:

```bash
npx playwright install chromium
```

Run:

```bash
npm run e2e
```

Current verified result:

```text
6 passed
```

The Playwright flow checks the core business process end-to-end:

1. Private-route protection and role-based routing
2. Shelter representative publishes a dog
3. Adopter completes the required profile and sends adoption interest
4. Invalid dog input is rejected
5. Shelter approves the adoption request and a match is created
6. The approved adopter and shelter can chat

The E2E tests use the seeded Maya shelter account and Alex adopter account so that the core flow does not depend on external email delivery during the test run.

## Deployment

The production application is deployed on Vercel and uses Supabase Cloud for authentication and data.

For a new deployment:

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
4. In Supabase Authentication → URL Configuration, configure the production Site URL and callback/redirect URL.
5. Deploy.

## Main scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit + component tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run e2e` | Playwright end-to-end tests |
| `npm run seed` | Demo-data seed script |
