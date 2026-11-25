# HorizonEA

**Enterprise Architecture & Lifecycle Management** – document, visualise and manage your application landscape, technologies, IT assets, end-of-life (EOL) exposure and the transformation roadmap from the **Current State (As-Is)** to the **Target State (To-Be)**.

![Executive dashboard](docs/screenshots/dashboard.jpg)

| Landscape map (Delta view, dark mode) | Transformations board |
| --- | --- |
| ![Landscape map](docs/screenshots/landscape-delta.jpg) | ![Kanban board](docs/screenshots/transformations-board.jpg) |

![Lifecycle timeline](docs/screenshots/lifecycle-timeline.jpg)

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start (local)](#quick-start-local)
- [Docker deployment](#docker-deployment) · [Deploy with Coolify](#deploy-with-coolify)
- [Configuration](#configuration)
- [npm scripts](#npm-scripts)
- [Domain model](#domain-model)
- [How risk, EOL and delta are calculated](#how-risk-eol-and-delta-are-calculated)
- [Import & export](#import--export)
- [REST API](#rest-api)
- [Project structure](#project-structure)
- [Operational notes](#operational-notes)

## Features

| Area | What you get |
| --- | --- |
| **Executive dashboard** | KPI tiles (active applications, EOL warnings in the next 6 / 12 months, active & blocked initiatives, high-risk dependencies), **Risk Radar** (rings = severity, sectors = business domain, dot size = criticality), top risks, upcoming EOL list, As-Is → To-Be delta and portfolio distributions. |
| **As-Is / To-Be / Delta switcher** | Global toggle in the header (persisted in a cookie). Tables, interface lists and the landscape map show the current state, the target state, or a diff that highlights systems and interfaces being **introduced**, **modified** or **decommissioned**. |
| **Applications** | Portfolio table with search, filters, sorting and computed risk; detail pages with risk findings, technology stack, deployments, interfaces (inbound/outbound) and related initiatives – all editable in place. |
| **Technologies & EOL** | Technology catalog with vendor lifecycle dates and standardization status (*Approved → Containment → Sunset → Prohibited*), plus a **Gantt-style lifecycle timeline** for technologies, applications and assets with warning thresholds (amber within 6 months, red past EOL, hatched extended support / use past end of support). |
| **IT Assets** | Servers, clusters, cloud accounts, network & storage – with environment, location, OS/platform (linked to the catalog, so assets inherit OS EOL risk) and hardware end of support. |
| **Landscape map** | React Flow dependency graph with auto-layout (data-flow or domain lanes), filters (domain, criticality, lifecycle, high risk), colouring by domain / risk / lifecycle / criticality, optional technology and asset layers, neighbourhood highlighting and a details panel. |
| **Transformations** | Drag-and-drop **Kanban board** (Backlog / In Progress / Blocked / Completed), **roadmap timeline** with phases and milestones, and initiative pages with As-Is → To-Be mappings (applications *and* technologies), strategy (Rehost, Replatform, Refactor, Replace, Retire, Retain), budget, effort and risk notes. |
| **Import / Export** | Full JSON snapshot (backup / restore), per-collection CSV & JSON export with readable reference columns, validated CSV/JSON import (merge or replace, dry run, all-or-nothing), demo-data reset. |
| **UX** | Responsive layout (mobile drawer navigation), light / dark / system theme, accessible status badges (colour is always paired with text or an icon). |

## Tech stack

- **Next.js 16** (App Router, React 19, TypeScript) – UI *and* REST API (route handlers) in one Node.js service
- **Tailwind CSS v4** with shadcn/ui-style components built on **Radix UI** primitives, `lucide-react` icons, `next-themes`, `sonner`
- **Drizzle ORM** on **PostgreSQL** – one schema, one set of SQL migrations
- **PGlite** (PostgreSQL compiled to WASM) as the zero-dependency local database
- **React Flow (`@xyflow/react`) + dagre** for the landscape map; custom SVG/HTML for the risk radar and Gantt timelines
- **Zod** for request / import validation, **PapaParse** for CSV
- Node's built-in test runner (via `tsx`) for unit & integration tests

> **Why PGlite instead of SQLite?** The brief asked for PostgreSQL with an optional zero-dependency local mode. PGlite *is* PostgreSQL (17), embedded in-process via WASM and persisted to a local folder – so local development uses exactly the same SQL dialect, enums, constraints and migrations as production. There is no second schema to keep in sync and no native module to compile.

## Quick start (local)

Requirements: **Node.js ≥ 20.9** (22 LTS recommended) and npm.

```bash
npm install
```

```bash
npm run dev
```

Open <http://localhost:3000>. On first start the embedded database is created in `./data/pglite`, migrations are applied and the **demo landscape** (a fictional logistics group: 30 applications, 51 technologies, 21 assets, 42 interfaces, 12 initiatives) is loaded automatically.

### Using a local PostgreSQL instead

```bash
cp .env.example .env
```

Set `DATABASE_URL=postgres://user:password@localhost:5432/horizon` in `.env`, then:

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run dev
```

(Alternatively set `SEED_DEMO_DATA=true` and the app migrates and seeds a fresh database on first start.)

### Production build without Docker

```bash
npm run build
```

```bash
npm run start
```

## Docker deployment

The repository ships a multi-stage `Dockerfile` (Next.js standalone output, non-root user, health check) and a `docker-compose.yml` with the application, **PostgreSQL 17** and a persistent volume. The compose file is written for [Coolify](#deploy-with-coolify): it publishes **no host ports** and takes its secrets from generated variables. On a plain Docker host, add `docker-compose.local.yml`, which publishes the port and supplies local defaults.

### Local / plain Docker host

```bash
cp .env.example .env
```

Set `SERVICE_PASSWORD_POSTGRES` (database password) and optionally `SERVICE_PASSWORD_LOGIN` (enables the login) in `.env`, then:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```

Open <http://localhost:3000> (or `APP_PORT`). The app waits for the database health check, applies migrations automatically and – with `SEED_DEMO_DATA=true` (default in compose) – loads the demo data into the empty database. Data lives in the `postgres-data` volume and survives `docker compose down`; add `-v` to delete it.

Useful commands:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f app
```

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml exec db psql -U horizon -d horizon
```

The image can also run on its own with the embedded database (mount a volume for `/app/data`):

```bash
docker build -t horizon-ea .
```

```bash
docker run -d -p 3000:3000 -v horizon-data:/app/data -e BASIC_AUTH_PASSWORD=change-me horizon-ea
```

### Deploy with Coolify

1. In Coolify create a new resource from this Git repository and choose the **Docker Compose** build pack. Keep the compose location `/docker-compose.yml` and select the branch to deploy (e.g. `main`).
2. Coolify reads the compose file and fills in the **Environment Variables** tab:
   - `SERVICE_PASSWORD_POSTGRES` – generated database password (the database is only reachable from the app container).
   - `SERVICE_PASSWORD_LOGIN` – generated password for the HTTP Basic Auth login. The user name is `admin` (change it with `BASIC_AUTH_USER`). To run without a login, remove the `BASIC_AUTH_PASSWORD` line from `docker-compose.yml`.
   - `SEED_DEMO_DATA` (default `true`), `ALLOW_DEMO_RESET` (default `true`), `NEXT_PUBLIC_CURRENCY` (default `EUR`).
3. Domain: `SERVICE_URL_APP_3000` tells Coolify to route the resource's domain to port 3000 of the `app` service. With a wildcard domain configured, Coolify generates one; otherwise enter your own for the `app` service including the internal port, e.g. `https://ea.example.com:3000`. Visitors still use normal HTTPS.
4. Deploy. Both containers have health checks; `/api/health` stays reachable without login so the check works. The `postgres-data` volume keeps the data across deployments.

> PostgreSQL only applies the password when its volume is first created. If you change `SERVICE_PASSWORD_POSTGRES` later, change it inside the database as well (or delete the volume to start over).

## Configuration

All settings are environment variables (see [`.env.example`](.env.example)); `npm run dev/start` and `docker compose` both read `.env`.

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | – | PostgreSQL connection string. Unset → embedded PGlite. |
| `PGLITE_DATA_DIR` | `./data/pglite` (`/app/data/pglite` in Docker) | Storage folder of the embedded database. |
| `DATABASE_POOL_SIZE` | `10` | Max PostgreSQL connections. |
| `SEED_DEMO_DATA` | `true` for PGlite, `false` for PostgreSQL | Load demo data when the app starts against a **brand-new** database. |
| `ALLOW_DEMO_RESET` | `true` | Enables “Reset demo data” / “Clear all data” and `POST /api/demo-data`. Set to `false` on shared instances. |
| `NEXT_PUBLIC_CURRENCY` | `EUR` | Currency for budgets (build-time for client components; a Docker build arg). |
| `MIGRATIONS_DIR` | `./drizzle` | Location of the SQL migrations. |
| `BASIC_AUTH_PASSWORD` / `BASIC_AUTH_USER` | – / `admin` | Enables HTTP Basic Auth for the UI and API when a password is set (`/api/health` stays open). |
| `SERVICE_PASSWORD_POSTGRES` / `SERVICE_PASSWORD_LOGIN` | generated by Coolify | docker compose: database password and login password (mapped to `BASIC_AUTH_PASSWORD`). Set them in `.env` for local compose runs. |
| `APP_PORT` | `3000` | Host port used by `docker-compose.local.yml`. |

## npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` / `npm run start` | Production build / server |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint checks |
| `npm test` | Unit and integration tests (risk engine, validation, delta logic, import/export against an in-memory PostgreSQL) |
| `npm run db:generate` | Generate a new SQL migration after changing `src/lib/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Load demo data into an empty database (`npm run db:reset` wipes and re-seeds) |
| `npm run db:studio` | Drizzle Studio (requires `DATABASE_URL`) |

> The embedded database can only be opened by **one process at a time**. Stop `npm run dev` before running `db:*` scripts against PGlite – or use **Import / Export → Reset to demo data** in the running app.

## Domain model

```mermaid
erDiagram
    APPLICATION ||--o{ INTERFACE : "source of"
    APPLICATION ||--o{ INTERFACE : "target of"
    APPLICATION ||--o{ APPLICATION_TECHNOLOGY : uses
    TECHNOLOGY  ||--o{ APPLICATION_TECHNOLOGY : "used by"
    APPLICATION ||--o{ APPLICATION_ASSET : "deployed on"
    ASSET       ||--o{ APPLICATION_ASSET : hosts
    TECHNOLOGY  |o--o{ ASSET : "OS / platform of"
    INITIATIVE  ||--o{ INITIATIVE_ITEM : "maps As-Is → To-Be"
    INITIATIVE  ||--o{ INITIATIVE_PHASE : "phases / milestones"
    APPLICATION |o--o{ INITIATIVE_ITEM : "source / target"
    TECHNOLOGY  |o--o{ INITIATIVE_ITEM : "source / target"

    APPLICATION {
        uuid id
        text name
        text business_domain
        enum criticality
        text owner
        enum lifecycle_status
        enum architecture_state
        date go_live_date
        date planned_eol_date
        enum hosting_model
    }
    TECHNOLOGY {
        uuid id
        text name
        text version
        enum category
        text vendor
        date release_date
        date eol_date
        date extended_support_end_date
        enum standardization_status
    }
    ASSET {
        uuid id
        text name
        enum asset_type
        enum environment
        text location
        uuid operating_system_id
        text owner
        date eol_date
    }
    INTERFACE {
        uuid id
        text name
        text data_flow
        text protocol
        enum integration_pattern
        enum direction
        enum architecture_state
    }
    INITIATIVE {
        uuid id
        text name
        enum strategy
        enum status
        date start_date
        date target_date
        int budget
        int effort_person_days
        enum risk_level
        text risk_notes
    }
    INITIATIVE_ITEM {
        uuid id
        enum kind
        uuid source_application_id
        uuid target_application_id
        uuid source_technology_id
        uuid target_technology_id
        text notes
    }
    INITIATIVE_PHASE {
        uuid id
        text name
        date start_date
        date end_date
        enum status
        int sort_order
    }
```

| Enum | Values |
| --- | --- |
| Criticality | Tier 1, Tier 2, Tier 3 |
| Lifecycle status | Planned, Active, Phase-Out, Retired |
| Architecture state | As-Is, To-Be, Both |
| Hosting model | On-Premises, Cloud, SaaS, Hybrid |
| Technology category | Language, Framework, Database, Operating System, Middleware, Infrastructure |
| Standardization | Approved, Containment, Sunset, Prohibited |
| Asset type / environment | Server, Cluster, Cloud Account, Network Device, Storage / Prod, Staging, Dev |
| Integration pattern | Synchronous API, Asynchronous Messaging, Event Streaming, File Transfer, Database Integration, ETL / Batch |
| Migration strategy | Rehost, Replatform, Refactor, Replace, Retire, Retain |
| Initiative status | Backlog, In Progress, Blocked, Completed |

Integrity rules are enforced in the database (unique names, foreign keys with cascades, no self-referencing interfaces) and in the API (date ordering, mapping completeness, enum values).

## How risk, EOL and delta are calculated

**EOL status** (technologies, assets, application planned EOL) relative to today: *Past EOL* (red) · *Extended support* (past standard EOL but within paid extended support, orange) · *EOL < 6 months* (amber) · *EOL < 12 months* (yellow) · *Supported* (green) · *No EOL date*.

**Application risk** (`src/lib/risk.ts`) – evaluated for every non-retired application:

| Finding | Severity |
| --- | --- |
| Uses a technology past EOL, or a *Prohibited* standard | critical |
| Technology on extended support only, or EOL within 6 months | high |
| Technology EOL within 12 months, or a *Sunset* standard | medium |
| *Containment* standard | low |
| Hosting asset past / near end of support; asset OS inherits all technology rules | as above |
| Planned EOL date passed while still Active / Phase-Out | high |
| Phase-Out without an open initiative covering it | medium |
| Current interface to a *Retired* application / to a *Phase-Out* application | high / low |

Risk **level** = worst finding; **score** = Σ severity weights (10 / 5 / 2 / 1) × criticality factor (Tier 1 = 3, Tier 2 = 2, Tier 3 = 1). **High-risk dependencies** = distinct app→technology, app→asset and app→app links of operational applications with a high or critical finding.

**Delta classification** (`src/lib/delta.ts`): `To-Be` only → *Introduced*; `As-Is` only → *Decommissioned*; `Both` → *Modified* when an open Rehost / Replatform / Refactor / Replace initiative maps the application, or replaces a technology it uses; otherwise *Unchanged*. Interfaces follow their own architecture state.

> The demo data uses publicly announced vendor lifecycle dates as of late 2026 for illustration. Verify dates against vendor lifecycle pages (e.g. <https://endoflife.date>) before relying on them.

## Import & export

- **JSON snapshot** (`GET /api/export`): `{ "format": "horizon-ea", "version": 1, "exportedAt": "…", "data": { "applications": [...], "technologies": [...], … } }` – re-importable as a backup (`replace` mode restores it exactly).
- **CSV per collection** (`GET /api/export/:collection?format=csv`): one row per record with `id` columns **and** readable reference columns, e.g. `sourceApplicationId, sourceApplication`.
- **Import** (`POST /api/import`, or the Import / Export page):
  - `merge` – rows are matched by `id`, then by natural key (application / asset / initiative name; technology name + version; interface name + source + target). Matches are updated (columns missing from the file are left untouched), the rest created.
  - `replace` – deletes all data first, then imports.
  - References may be given as ids **or** readable names (`sourceApplication=SAP ECC 6.0`, `technology=PostgreSQL 17`); enum values are matched case-insensitively (`tier1`, `on premises`); dates accept `YYYY-MM-DD` and `DD.MM.YYYY`.
  - **All-or-nothing**: if any row fails validation nothing is written and the response (HTTP 422) lists every problem per row. Use `dryRun=true` to validate only.

Example – add interfaces from a spreadsheet:

```csv
name,sourceApplication,targetApplication,integrationPattern,protocol,architectureState
Order events,Salesforce Sales Cloud,Event Streaming Platform,event streaming,Kafka,To-Be
```

```bash
curl -F file=@interfaces.csv -F resource=interfaces -F mode=merge http://localhost:3000/api/import
```

## REST API

All endpoints accept and return JSON. Validation errors return `422 { "error": "Validation failed", "issues": { "<field>": "<message>" } }`; unique-key conflicts `409`; unknown ids `404`.

| Collection | Endpoints |
| --- | --- |
| Applications | `GET/POST /api/applications` · `GET/PATCH/PUT/DELETE /api/applications/:id` |
| Technologies | `GET/POST /api/technologies` · `GET/PATCH/PUT/DELETE /api/technologies/:id` |
| IT assets | `GET/POST /api/assets` · `GET/PATCH/PUT/DELETE /api/assets/:id` |
| Interfaces (app ↔ app) | `GET/POST /api/interfaces` · `…/:id` |
| Application ↔ technology | `GET/POST /api/application-technologies` · `…/:id` |
| Application ↔ asset | `GET/POST /api/application-assets` · `…/:id` |
| Initiatives | `GET/POST /api/initiatives` · `…/:id` |
| Initiative items (As-Is → To-Be) | `GET/POST /api/initiative-items` · `…/:id` |
| Initiative phases | `GET/POST /api/initiative-phases` · `…/:id` |
| Analytics | `GET /api/dashboard` (KPIs, EOL list, risk radar) · `GET /api/health` (liveness + database status) · `GET /api/health?ready` (503 unless the database works) |
| Bulk | `GET /api/export` · `GET /api/export/:collection?format=csv\|json` · `POST /api/import` · `POST /api/demo-data[?empty=1]` |

List endpoints support equality filters on any field and `q` for a name search, e.g. `GET /api/applications?lifecycleStatus=Phase-Out&q=sap`. `PATCH` (and `PUT`) apply partial updates – fields that are not sent are left unchanged.

```bash
curl -X POST http://localhost:3000/api/applications \
  -H 'content-type: application/json' \
  -d '{"name":"Pricing Engine","businessDomain":"Sales & CRM","criticality":"Tier 2","architectureState":"To-Be","lifecycleStatus":"Planned","hostingModel":"Cloud"}'
```

## Project structure

```
├── drizzle/                    SQL migrations (generated by drizzle-kit)
├── scripts/                    migrate & seed CLIs
├── src/
│   ├── app/                    Next.js routes (pages + /api route handlers)
│   ├── components/
│   │   ├── ui/                 shadcn-style primitives (button, card, dialog, table, …)
│   │   ├── charts/             Gantt timeline, risk radar, segmented bar
│   │   ├── landscape/          React Flow landscape map
│   │   ├── forms/              config-driven create/edit dialogs
│   │   └── …                   feature components per area
│   └── lib/
│       ├── db/                 schema, client (PostgreSQL / PGlite), seed data
│       ├── api/                generic validated CRUD handlers + resource registry
│       ├── data/               server-side read models (portfolio, dashboard)
│       ├── risk.ts, delta.ts   risk / EOL engine and As-Is / To-Be logic (pure, unit tested)
│       ├── validation.ts       Zod schemas and cross-field rules
│       └── import-export.ts    JSON / CSV import & export
├── tests/                      node:test suites
├── src/proxy.ts                optional HTTP Basic Auth (Next.js proxy)
├── Dockerfile, docker-compose.yml (Coolify-ready), docker-compose.local.yml, .env.example
```

## Operational notes

- **Authentication**: a single shared login (HTTP Basic Auth via `BASIC_AUTH_PASSWORD`, enabled by default in the Coolify setup) protects the UI and API. There are no user accounts or roles – for those, put HorizonEA behind your SSO / reverse proxy (e.g. oauth2-proxy, Cloudflare Access). Set `ALLOW_DEMO_RESET=false` on shared instances.
- **Migrations** run automatically on start-up. When running several replicas, run `npm run db:migrate` once as a release step instead of letting replicas race.
- **Backups**: use the JSON snapshot export, or standard PostgreSQL tooling (`pg_dump`) for the compose volume.
- **Schema changes**: edit `src/lib/db/schema.ts`, run `npm run db:generate`, commit the new file in `drizzle/`.
