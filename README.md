# StockFlow

A lightweight SaaS inventory management system built with Next.js and Turso (libsql). Track products, monitor stock levels, get low-stock alerts, and manage your organization's inventory — all from a clean, responsive UI.

🔗 **Live Demo:** [https://stock-flow-taupe-kappa.vercel.app](https://stock-flow-taupe-kappa.vercel.app)

---

## Features

- **Auth** — Signup, login, logout with JWT sessions (httpOnly cookies)
- **Multi-tenant** — Each organization has its own isolated data
- **Product CRUD** — Create, edit, delete products with SKU, quantity, cost & selling price
- **Stock Adjustment** — Inline +/- stock adjustments with delta tracking
- **Low Stock Alerts** — Per-product or org-level threshold, highlighted on dashboard
- **Search** — Debounced auto-search (1 second) by product name or SKU
- **Pagination** — 10 products per page, URL-driven
- **Settings** — Configure org-level default low-stock threshold
- **Collapsible Sidebar** — Icon-rail mode when collapsed, full labels when expanded

---

## Architecture Overview

StockFlow follows a **server-first architecture** powered by Next.js App Router. The application is split into two route groups — `(auth)` for public pages and `(app)` for session-protected pages — with a shared middleware layer enforcing JWT-based authentication.

```
┌──────────────────────────────────────────────────────────┐
│                        Browser                           │
│                                                          │
│   ┌──────────────┐        ┌─────────────────────┐        │
│   │  Auth Pages   │        │   Protected Pages   │        │
│   │ login/signup  │        │ dashboard/products  │        │
│   └──────┬───────┘        └──────────┬──────────┘        │
└──────────┼───────────────────────────┼───────────────────┘
           │                           │
           ▼                           ▼
┌──────────────────────────────────────────────────────────┐
│                    Next.js Server                        │
│                                                          │
│   ┌───────────────────────────────────────────────┐      │
│   │              middleware.ts                     │      │
│   │         (JWT route guard)                      │      │
│   └───────────────────────────────────────────────┘      │
│                                                          │
│   ┌──────────────────┐    ┌───────────────────────┐      │
│   │  Server Components│    │    API Routes          │      │
│   │  (page reads)     │    │    (mutations)         │      │
│   │                   │    │                        │      │
│   │  lib/data.ts ─────┤    │  app/api/auth/*        │      │
│   │  (direct queries) │    │  app/api/products/*    │      │
│   └────────┬─────────┘    │  app/api/settings/*    │      │
│            │               └───────────┬───────────┘      │
│            │                           │                  │
│            ▼                           ▼                  │
│   ┌───────────────────────────────────────────────┐      │
│   │               lib/db.ts                       │      │
│   │          (Turso/libsql client)                 │      │
│   └───────────────────┬───────────────────────────┘      │
└───────────────────────┼──────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   Turso (libsql) │
              │  Serverless SQLite│
              └──────────────────┘
```

### Project Structure

```
stock-flow/
├── app/
│   ├── (auth)/                  # Public auth pages
│   │   ├── layout.tsx           # Minimal layout for auth views
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/                   # Protected app pages (layout guards session)
│   │   ├── layout.tsx           # Server component — fetches session + org name
│   │   ├── AppShell.tsx         # Client component — collapsible sidebar + nav
│   │   ├── LogoutButton.tsx     # Client component — handles logout action
│   │   ├── dashboard/page.tsx   # Stats cards + low-stock table
│   │   ├── products/
│   │   │   ├── page.tsx         # Product list with pagination (server component)
│   │   │   ├── new/page.tsx     # Add product form
│   │   │   ├── [id]/edit/       # Edit product form
│   │   │   ├── ProductForm.tsx  # Shared create/edit form (client component)
│   │   │   ├── SearchInput.tsx  # Debounced search input (client component)
│   │   │   ├── AdjustStockForm.tsx
│   │   │   └── DeleteButton.tsx
│   │   └── settings/page.tsx
│   └── api/                     # REST API route handlers (all mutations)
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── signup/route.ts
│       │   └── logout/route.ts
│       ├── products/
│       │   ├── route.ts         # GET list, POST create
│       │   └── [id]/
│       │       ├── route.ts     # PUT update, DELETE
│       │       └── adjust/route.ts  # POST stock delta
│       └── settings/route.ts    # GET/PUT org threshold
├── lib/
│   ├── db.ts                    # Turso (libsql) client singleton + schema init
│   ├── auth.ts                  # JWT helpers, session cookie management
│   └── data.ts                  # Read-only DB queries for server components
├── middleware.ts                 # JWT route guard — protects all non-public routes
└── public/                      # Static assets (favicon, etc.)
```

### Key Design Decisions

| Concern | Approach |
|---|---|
| Database | [Turso](https://turso.tech) (libsql) — serverless SQLite, works on Vercel |
| Auth | JWT via `jose`, stored in httpOnly cookie `stockflow_session` |
| Mutations | All writes go through REST API routes (`app/api/`) |
| Reads | Server components call `lib/data.ts` directly (no API round-trip) |
| Serialization | `toPlain<T>()` converts libsql Row objects to plain JSON for Server→Client passing |
| Navigation | `window.location.href` for post-auth redirects (ensures cookie is sent on next request) |
| Multi-tenancy | Every DB query is scoped by `organization_id` from the JWT session |

### Data Flow

```
Browser
  │
  ├─ Page load (GET)
  │    └─ Next.js Server Component
  │         ├─ middleware.ts  →  verifies JWT cookie
  │         └─ lib/data.ts   →  queries Turso directly
  │
  └─ User action (mutation)
       └─ fetch() → API Route (app/api/...)
            ├─ verifies session
            └─ lib/db.ts → Turso (libsql)
```

### Database Schema

```sql
organizations  (id, name, default_low_stock_threshold)
users          (id, organization_id, email, password_hash)
products       (id, organization_id, name, sku, description,
                quantity, cost_price, selling_price, low_stock_threshold)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Database | Turso / libsql (`@libsql/client`) |
| Auth | `jose` (JWT) + `bcryptjs` |
| Deployment | Vercel |

---

## Local Development

### Prerequisites

- Node.js 18+
- A [Turso](https://turso.tech) account (free tier works)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd stock-flow
npm install

# 2. Create a Turso database
turso db create stockflow
turso db show stockflow       # copy the URL
turso db tokens create stockflow  # copy the token

# 3. Configure environment
cp .env.example .env
# Fill in:
#   TURSO_DATABASE_URL=libsql://your-db.turso.io
#   TURSO_AUTH_TOKEN=your-token
#   JWT_SECRET=any-random-secret-string

# 4. (Optional) Seed sample data
turso db shell stockflow < seed.sql

# 5. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up for an account.

---

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `JWT_SECRET`
4. Deploy — the schema is auto-initialized on first request

🔗 **Deployed at:** [https://stock-flow-taupe-kappa.vercel.app](https://stock-flow-taupe-kappa.vercel.app)

---

## License

MIT
