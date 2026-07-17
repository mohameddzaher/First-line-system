# First Line — Logistics ERP & Website

A full bilingual (Arabic/English, RTL-aware) ERP and public website for **First Line**, a
Saudi last-mile logistics company. Built with Next.js 16 (App Router), MongoDB Atlas
(Mongoose), and Tailwind CSS v4.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI and AUTH_SECRET
npm run seed                 # creates the super admin + reference data
npm run dev
```

Then sign in at `/login`.

- **Super admin:** `admin@firstline.com` / `Admin@12345` (change after first sign-in).
- **Public website:** `/` (home, services, about, articles, careers, contact, privacy, terms).

`.env.local`:

```
MONGODB_URI="mongodb+srv://…/firstline"
AUTH_SECRET="<openssl rand -hex 32>"
```

## What's inside

**Internal system** (`/dashboard` and module routes, permission-gated):

| Module | Highlights |
|---|---|
| Executive Overview | Live aggregate of every module |
| Human Resources | Employees + full profile (8 tabs), contracts, leaves (day-by-day accrual balance), custody, licenses, requests, tasks, complaints, dashboard, self-service |
| Vehicles & Fleet | Vehicles, authorize/transfer/revoke — **each authorization creates HR custody for the driver**, accidents, dashboard |
| Operations | Projects + third-party platform accounts; one account can carry multiple riders per shift; assigning a rider transfers them off their previous account |
| Procurement | Warehouses, inventory, purchase orders — **receiving a PO increments warehouse stock** |
| CRM | Companies (customer/vendor), contacts, deals with pipeline |
| Sales | Targets and attainment against won deals |
| Administration | Users (linked to HR employee profiles), roles & permissions, audit log |
| Website CMS | Edit all public content, manage articles/jobs/client logos, submissions inbox, SEO |

**Cross-module links are enforced in code** (fleet↔custody, PO↔inventory, ops account transfers,
leave approval↔employee status) and every mutation writes to the audit log.

## Architecture

- **Auth** — signed JWT session cookie (httpOnly), re-validated against the DB on every request
  so a revoked role / deactivated account / changed password takes effect immediately. Edge
  `proxy.ts` blocks unauthenticated traffic; `requirePermission` is the authoritative gate.
- **RBAC** — central registry in `src/lib/rbac.ts`; the sidebar and every API route derive
  access from it.
- **i18n** — `src/i18n/` (Arabic default, RTL). UI chrome is translated; business data stays as
  entered. Theme (light/dark/system) has no-flash SSR.
- **Reusable engine** — `DataTable` (URL-driven search/filter/sort/paginate), `ResourceManager`
  + `ResourceForm` (schema-driven CRUD), `crudFactory`/`exportFactory` (API + Excel), so every
  list page behaves identically and exports inherit the active filters.
- **Models** — `src/models/*`, all registered via `src/models/registry.ts` (loaded by
  `connectDB`) so cross-model `.populate()` always resolves.

## Scripts

- `npm run dev` — dev server
- `npm run build` / `npm run start` — production
- `npm run seed` — super admin + leave types + departments + projects
