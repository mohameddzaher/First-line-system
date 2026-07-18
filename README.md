<div align="center">

# First Line — Logistics ERP & Delivery Management System

**نظام تخطيط موارد المؤسسات وإدارة التوصيل — شركة الخط الأول**

A production-grade, bilingual (Arabic/English · full RTL) ERP and public website for
**First Line**, a Saudi last-mile logistics company operating a fleet of **900+ vehicles**
and **600+ riders** across the Kingdom.

Every number in every dashboard is computed live from MongoDB. No mock data.

</div>

---

## Table of contents

- [What this is](#what-this-is)
- [Screens & modules](#screens--modules)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Seeding & importing real data](#seeding--importing-real-data)
- [Authentication & security](#authentication--security)
- [Roles & permissions (RBAC)](#roles--permissions-rbac)
- [Cross-module workflows](#cross-module-workflows)
- [The reusable engine](#the-reusable-engine)
- [Internationalisation & theming](#internationalisation--theming)
- [Data model](#data-model)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Conventions for contributors](#conventions-for-contributors)

---

## What this is

Two applications behind one Next.js codebase:

1. **The internal system** (`/dashboard`, `/hr`, `/fleet`, …) — a permission-gated ERP covering
   people, fleet, delivery operations, procurement, finance, sales and CRM.
2. **The public website** (`/`) — a marketing site (home, services, about, articles, careers,
   contact, legal) whose **entire content is editable by the super admin** from the built-in CMS.

It is designed around how the business actually runs: platforms (Keeta, HungerStation, Ninja,
ToYou) hand us **user accounts**, we hand those accounts to **riders**, riders drive **company
vehicles** held as **custody**, and every one of those links is enforced in code — not left to
a spreadsheet.

---

## Screens & modules

| Module | Pages | Highlights |
|---|---|---|
| **Executive** | Overview · Reports & BI | Section-organised live dashboard; every card drills into its filtered page |
| **Human Resources** | Dashboard · Employees (+ 8-tab profile) · Contracts · Leaves · Requests · Custody · Licenses · Leave types · **Payroll** · **Attendance** · Tasks · Complaints | Day-by-day leave accrual, Saudi document/expiry tracking (iqama, visa, licence), custody handover trail |
| **Vehicles & Fleet** | Dashboard · Fleet & authorizations · Authorizations · **Maintenance** · Accidents · Vehicle profile | Authorize / transfer / revoke with full history; maintenance flips vehicle status automatically |
| **Operations** | Dashboard · **Orders** · Projects · Platform accounts (+ detail) | Order lifecycle with timeline & SLA breach flagging; one account can carry several riders across shifts; assigning a rider transfers them off their previous account |
| **Procurement & Warehouse** | Dashboard · Purchase orders · Inventory · **Stock movements** · Warehouses | Receiving a PO increments stock; movement ledger and on-hand quantity can never drift |
| **Finance** | Dashboard · Transactions | Revenue/expense ledger, P&L, 12-month trends |
| **CRM** | Dashboard · Companies (+ detail) · Contacts · Deals · **Pipeline board** | Drag-and-drop Kanban; company detail aggregates deals, contacts and POs |
| **Sales** | Dashboard · Targets | Attainment gauge against won deals |
| **Website CMS** | Content · Articles · Jobs · Client logos · Submissions · SEO | Super admin edits every public page; contact/newsletter submissions land in an inbox |
| **Administration** | Users · Roles & permissions · Audit log | Users link to HR employee profiles; every mutation is audited field-by-field |
| **Self service** | My profile · My leaves · My requests | Employees see their own contract, custody, balance and submit requests |

Every list page ships with **real full-text search, type + date-range filters, sorting,
server-side pagination and a filtered Excel export** — because they all share one engine.

---

## Architecture

A single **Next.js App Router** application. Server Components read MongoDB directly for page
loads; Route Handlers under `/api/**` serve mutations and exports.

```
Browser
  │
  ├── Server Components ───────────► Mongoose ──► MongoDB Atlas
  │     (page data, aggregations)
  │
  └── Route Handlers /api/** ──────► Mongoose ──► MongoDB Atlas
        (CRUD, workflows, Excel export)
        guarded by requirePermission()
```

**Why it holds up at scale**

- **Every list is server-side paginated and filtered** — a 936-vehicle or 600-employee table never
  ships more than one page of rows.
- **Dashboards use aggregation pipelines** (`$group` / `$lookup` / `$unwind`), never in-app counting.
- **Indexes** on the real query shapes: `idNumber`, `plateNumber`, `orderNumber`, `city`, `status`,
  plus compound indexes (`status + placedAt`, `project + status`, `employee + date`, `item + createdAt`).
- **Cross-reference search** resolves the referenced collection first, then matches by id — so
  "search leaves by employee name" works without a join per row.
- Lean queries throughout; exports are capped.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, Server Components, Route Handlers) |
| Language | **TypeScript** (strict) |
| Database | **MongoDB Atlas** via **Mongoose 9** |
| Styling | **Tailwind CSS v4** with a token-based design system |
| Auth | **jose** (JWT) + httpOnly cookie · **bcryptjs** |
| Validation | **zod** at every API boundary |
| Excel | **exceljs** (RTL-aware styled workbooks) |
| Charts | Custom dependency-free SVG kit (donut · bars · trend · gauge) |
| Icons | **lucide-react** |
| Fonts | IBM Plex Sans Arabic (one family, both scripts) |

---

## Quick start

**Prerequisites:** Node 20+ and a MongoDB connection string (Atlas or local `mongod`).

```bash
git clone https://github.com/mohameddzaher/First-line-system.git
cd First-line-system
npm install

cp .env.example .env.local     # then fill in MONGODB_URI and AUTH_SECRET
npm run seed                   # super admin + leave types + departments + projects
npm run dev                    # http://localhost:3000
```

Sign in at **`/login`**:

| Account | Password | Role |
|---|---|---|
| `admin@firstline.com` | `Admin@12345` | Super Admin (full access) |

> **Change this password after the first sign-in.** The seed is idempotent — re-running it
> updates the admin rather than creating duplicates.

The public marketing site is at **`/`** and needs no login.

---

## Environment variables

`.env.local` (never committed):

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string, e.g. `mongodb+srv://…/firstline` |
| `AUTH_SECRET` | ✅ | JWT signing secret — generate with `openssl rand -hex 32` |
| `SEED_ADMIN_EMAIL` | — | Override the seeded super-admin email |
| `SEED_ADMIN_PASSWORD` | — | Override the seeded super-admin password |

---

## Seeding & importing real data

### Reference seed — `npm run seed`
Creates the super admin plus the reference data every module expects: 10 leave types,
5 departments, 5 delivery projects.

### Demo seed — `npm run seed:demo`
Populates every module with realistic sample records so the system looks alive before real data
arrives. Wipe it with `npm run seed:demo -- --wipe-only`.

### Real fleet import — `npm run import:fleet`
Imports the production fleet workbook (`data/fleet-import.json`, exported from
`سيارات_محترف.xlsx`) and builds the **entire cross-module graph** in one pass:

```
 936 vehicles   ─┬─ 611 authorizations ──► 611 custody records ──► 606 driver profiles
                 └─ platform accounts  ──► 580 accounts with rider assignments
```

The importer normalises the messy realities of the source sheet: Arabic and Latin plates,
sponsorship type parsed from the contract text (كفالة → company, حر → freelancer), Saudi vs
resident inferred from the ID prefix (1 → national ID, 2 → iqama), work-status text mapped to
vehicle status (صيانة, بدون لوحة, محتجز, مسحوبة, مسروقة …), and a **strict platform whitelist**
so data-entry mistakes in the "التطبيق" column never become phantom projects.

> ⚠️ `data/*.json` is git-ignored — the real workbook contains names and national ID numbers
> and must never be committed. Place your file at `data/fleet-import.json` locally.

---

## Authentication & security

- **Session**: a signed JWT in an **httpOnly, SameSite=Lax** cookie (7-day expiry). The token
  is never readable from JavaScript.
- **Authoritative check on every request**: `getCurrentUser()` re-reads the user from MongoDB and
  compares a `sessionVersion` claim. Deactivating a user, changing their role, or changing their
  password takes effect on the **next request** — not at token expiry.
- **Edge gate**: `src/proxy.ts` rejects unauthenticated traffic before a server render happens.
- **Rate limiting** on login (8 attempts / 10 min per IP) and on the public contact form.
- **Identical responses** for unknown-email and wrong-password, so accounts can't be enumerated.
- **Security headers**: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Validation**: every API body is parsed by a zod schema before it reaches the database.
- **Audit log**: every create/update/delete/approve/export records actor, IP, user agent and a
  **field-level diff** — passwords are redacted.

---

## Roles & permissions (RBAC)

Permissions are `"<resource>:<action>"` strings — `hr.employees:read`, `fleet.vehicles:update`,
`ops.orders:create`. `*` means full access (super admin). The catalogue lives in
[`src/lib/rbac.ts`](src/lib/rbac.ts) and is the single source of truth for both the API guard and
the sidebar.

| Role | Scope |
|---|---|
| `super_admin` | Everything |
| `admin` | Users, website CMS, executive overview |
| `hr_manager` / `hr_officer` | Full / limited HR |
| `fleet_manager` | Vehicles, authorizations, maintenance, accidents |
| `ops_manager` | Orders, projects, platform accounts, reports |
| `procurement_manager` | Purchase orders, inventory, stock movements, warehouses |
| `finance_manager` | Finance ledger, payroll (read), reports |
| `crm_manager` / `sales_manager` | Companies, contacts, deals / targets |
| `employee` | Self-service only |

Enforcement is **server-side and authoritative** (`requirePermission`); the sidebar merely hides
what the user cannot open.

---

## Cross-module workflows

These links are enforced in code — this is what makes it an ERP rather than a set of tables:

| Action | Automatic consequence |
|---|---|
| Authorize a vehicle to a rider | Creates a **custody** record on that employee's HR profile; the vehicle's authorization history is appended |
| Transfer a vehicle | Closes the previous authorization (with end date), returns its custody to the warehouse, opens a new one |
| Assign a rider to a platform account | Frees them from any other account on the same shift — this *is* the transfer mechanism |
| Approve a leave | Flips the employee's status to **On Leave** (and back on rejection) |
| Receive a purchase order | Increments the linked inventory item's quantity |
| Record a stock movement | Applies a signed delta to on-hand quantity; over-draws are rejected |
| Start vehicle maintenance | Vehicle status → **In Maintenance**; completing it returns it to available/authorized |
| Deliver an order | Stamps `deliveredAt` and flags an **SLA breach** if past the due time |
| Link a user to an employee | Self-service instantly shows their contract, custody, leave balance and requests |

Every one of the above also writes an audit entry.

---

## The reusable engine

Four abstractions mean a new module is a few hundred lines, and every screen behaves identically:

| Piece | Responsibility |
|---|---|
| `DataTable` | URL-driven search · filters · date range · sort · pagination · export. State lives in the query string, so views are **shareable links** and survive refresh |
| `ResourceManager` + `ResourceForm` | Schema-driven list + create/edit dialog. Dropdowns with >8 options automatically become **searchable comboboxes** |
| `crudFactory` | `collectionRoute()` / `itemRoute()` — validated CRUD endpoints with audit built in |
| `exportFactory` | `exportRoute()` — a styled, RTL-aware Excel export that **inherits the table's active filters** |

Because the export reads the same `ListSpec` as the table, *what you filter is exactly what you
download* — no separate report code to drift.

---

## Internationalisation & theming

- **Arabic is the default**, with full RTL layout via CSS logical properties (`ps/pe`, `start/end`)
  — not a mirrored stylesheet.
- UI chrome is translated from [`src/i18n/dictionaries.ts`](src/i18n/dictionaries.ts) in **Modern
  Standard Arabic**; business data stays exactly as entered.
- Language and theme are cookie-backed and **server-rendered**, so there is no flash of the wrong
  direction or the wrong theme on first paint.
- Light / dark / system themes are driven by one set of design tokens, so the whole system —
  including charts and Excel headers — stays visually consistent.

---

## Data model

25+ Mongoose models, all registered centrally in
[`src/models/registry.ts`](src/models/registry.ts) (loaded by `connectDB`) so cross-model
`populate()` always resolves.

**People & HR** — `User`, `Employee`, `Contract`, `Leave`, `LeaveType`, `Attendance`, `Custody`,
`EmployeeRequest`, `License`, `Task`, `Department`
**Fleet** — `Vehicle` (with embedded authorization history), `Maintenance`, `Accident`
**Operations** — `Project`, `ThirdPartyAccount` (embedded assignments + history), `Order` (embedded timeline)
**Supply chain** — `Warehouse`, `InventoryItem`, `StockMovement`, `PurchaseOrder`
**Commercial** — `Company`, `Contact`, `Deal`, `SalesTarget`, `FinanceTransaction`
**Platform** — `AuditLog`, `Notification`, `SiteSetting`, `Article`, `Job`, `ClientLogo`, `Submission`

---

## Project structure

```
src/
├─ app/
│  ├─ (site)/          # public marketing website  (/, services, about, articles, careers…)
│  ├─ (app)/           # authenticated ERP         (dashboard, hr, fleet, ops, finance…)
│  ├─ api/             # route handlers grouped by module
│  ├─ login/
│  └─ globals.css      # design tokens (light/dark)
├─ components/
│  ├─ ui/              # Button, Modal, Toast, Combobox, ConfirmDialog, Card, Badge, Field
│  ├─ data/            # DataTable, ResourceManager, ResourceForm, ExportButton
│  ├─ charts/          # Donut, Bars, TrendChart, Gauge  (dependency-free SVG)
│  ├─ shell/           # Sidebar, Topbar, NotificationBell, AppShell
│  └─ site/            # public-site header, footer, hero, forms
├─ lib/                # auth, rbac, db, audit, listQuery, crudFactory, exportFactory, excel, analytics
├─ models/             # Mongoose schemas + registry
├─ i18n/               # dictionaries + providers (server & client)
└─ proxy.ts            # edge auth gate
scripts/               # seed.mjs · seed-demo.mjs · import-fleet.mjs
```

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server on :3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run seed` | Super admin + reference data (idempotent) |
| `npm run seed:demo` | Realistic demo data across every module |
| `npm run import:fleet` | Import the real fleet workbook with full linkage |

---

## Deployment

The app is a standard Next.js deployment — **Vercel** is the least-friction target.

1. Push this repository to GitHub.
2. Import it in Vercel (framework auto-detected).
3. Set environment variables: `MONGODB_URI`, `AUTH_SECRET`.
4. In **MongoDB Atlas → Network Access**, allow your deployment's egress IPs (or `0.0.0.0/0` for
   serverless platforms with dynamic IPs).
5. Seed once against production: `MONGODB_URI="<atlas-uri>" npm run seed`.

Any Node host works (Render, Railway, a VM) — build with `npm run build`, serve with `npm start`.
Connections are pooled and cached across invocations, which keeps Atlas connection counts sane on
serverless.

---

## Conventions for contributors

- **Never trust the client.** Every mutation goes through `guard({ permission })` + a zod schema.
- **Add new models to `src/models/registry.ts`**, or cross-model `populate()` will throw.
- **Searching a referenced field?** Use `refSearch` in the `ListSpec` — a regex on a dotted ref
  path (`employee.nameAr`) silently matches nothing.
- **Reuse the engine.** New list screens should use `ResourceManager` + `crudFactory` +
  `exportFactory` rather than bespoke tables.
- **Both locales, always.** Every user-facing string needs an Arabic and an English form, and
  Arabic copy is Modern Standard — no colloquialisms.
- **Layout uses logical properties** (`ps-4`, `end-0`, `text-start`) so RTL works for free.
- **Design tokens only** — no hard-coded hex values; light and dark must both work.

---

<div align="center">

**Proprietary — © First Line (الخط الأول).** All rights reserved.

</div>
