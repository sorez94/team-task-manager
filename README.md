# Task Manager

A clean, production-ready task manager built with the Next.js App Router and Prisma. No accounts, no login — just a shared task board. Runs on a local SQLite file in development and a hosted [Turso](https://turso.tech) (SQLite-compatible) database in production, so it deploys cleanly to Vercel.

> **No access control.** Anyone with the deployed URL can view, create, edit, and delete every task — there's no login, by design, for easy sharing with a small team. Only share the URL with people you trust with that.

## Features

- Create, edit, delete, and complete/reopen tasks
- Dashboard with summary stat cards (total, to do, in progress, completed, overdue) and a "recently updated" feed
- Table and Kanban board views for the task list
- Filter by status, priority, and due date (overdue / due today / due this week / no due date)
- Search by title or description
- Sortable by created date, updated date, due date, priority, or title
- Status and priority badges, with overdue/due-soon highlighting
- Loading skeletons and empty states throughout
- Client- and server-side form validation (Zod)
- Toast notifications and confirm-before-delete dialogs
- Responsive layout with a collapsible mobile nav drawer

## Tech stack

- **Next.js 16** (App Router, Server Actions, Route Handlers)
- **TypeScript**
- **Prisma 7** + **SQLite/Turso** (via the `@prisma/adapter-libsql` driver adapter — a pure-JS setup with no native build step, so it runs the same way locally and on Vercel's serverless functions)
- **Tailwind CSS 4**
- **Zod** for schema validation
- **lucide-react** for icons

## Project structure

```
task-manager/
├── prisma/
│   ├── schema.prisma        # Task model, Status/Priority enums
│   └── seed.ts               # Demo data seed script
├── prisma.config.ts          # Prisma CLI config (migrations, seed command, datasource url)
├── lib/
│   ├── prisma.ts             # PrismaClient singleton (libSQL driver adapter)
│   ├── tasks-query.ts        # Shared filter/sort/search query builder + dashboard stats
│   ├── validations.ts        # Zod schema for the task form
│   ├── utils.ts               # Formatting helpers, badge color maps, cn()
│   ├── useMounted.ts          # SSR-safe "has mounted" hook (used by modal/toast portals)
│   └── generated/prisma/     # Generated Prisma client (git-ignored, regenerated on install)
├── app/
│   ├── layout.tsx             # Root layout: providers + app shell
│   ├── page.tsx                # Dashboard page
│   ├── loading.tsx             # Dashboard skeleton
│   ├── error.tsx / not-found.tsx
│   ├── tasks/
│   │   ├── page.tsx            # Task list (table/board), reads filters from the URL
│   │   └── loading.tsx
│   ├── actions/tasks.ts        # Server Actions: createTask, updateTask, deleteTask, setTaskStatus
│   ├── api/tasks/               # REST API routes (GET/POST /api/tasks, GET/PATCH/DELETE /api/tasks/:id)
│   └── providers/               # ToastProvider, TaskModalProvider (client contexts)
└── components/
    ├── layout/AppShell.tsx      # Sidebar + mobile nav
    ├── dashboard/                # StatCard, RecentTasks
    ├── tasks/                    # FilterBar, TaskTable, TaskBoard, TaskCard, TaskModal
    └── ui/                        # Button, Field, Modal, ConfirmDialog, badges, Skeleton, EmptyState
```

## Database schema

```prisma
enum Status {
  TODO
  IN_PROGRESS
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      Status    @default(TODO)
  priority    Priority  @default(MEDIUM)
  dueDate     DateTime?
  assignee    String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### Why a driver adapter?

Prisma 7 requires the app's `PrismaClient` to be constructed with an explicit driver **adapter** rather than reading a connection string straight out of the schema at runtime. This project uses `@prisma/adapter-libsql`, which speaks the same protocol whether it's pointed at:

- a plain local SQLite file (`prisma/dev.db`) — used in development, no native compilation step, `npm install` stays simple on every OS; or
- a hosted [Turso](https://turso.tech) database — used in production, since Vercel's serverless functions have no persistent filesystem to keep a SQLite file on.

Which one it uses is entirely controlled by the `DATABASE_URL` (and, for Turso, `DATABASE_AUTH_TOKEN`) environment variables — see below. The Prisma CLI (`migrate`, `db push`, `studio`, `seed`) reads the same variables via `prisma.config.ts`.

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Local dev | Production (Vercel) |
| --- | --- | --- |
| `DATABASE_URL` | `file:./prisma/dev.db` (default, no setup needed) | Your Turso database URL, e.g. `libsql://task-manager-<org>.turso.io` |
| `DATABASE_AUTH_TOKEN` | not needed | Your Turso auth token |

## Setup and run instructions (local development)

### 1. Install dependencies

```bash
npm install
```

This also runs `prisma generate` automatically (via the `postinstall` script), which creates the Prisma client in `lib/generated/prisma`.

### 2. Create the database

```bash
npm run db:push
```

This creates `prisma/dev.db` and applies the schema. (Use `npm run db:migrate` instead if you'd rather track schema changes as versioned migration files.)

### 3. (Optional) Seed demo data

```bash
npm run db:seed
```

Adds 12 sample tasks spanning every status, priority, and a mix of due dates (including a couple of overdue ones) so the dashboard and board have something to show.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other scripts

| Command | Description |
| --- | --- |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the project |
| `npm run db:studio` | Open Prisma Studio to browse/edit data |
| `npm run db:reset` | Drop and recreate the database, then re-seed |

The database file lives at `prisma/dev.db` and is git-ignored — each clone starts fresh via `db:push` + `db:seed`.

## Deploying to Vercel

Local SQLite files don't survive on Vercel — each serverless invocation can run on a fresh container with no persistent disk. This project is set up to use [Turso](https://turso.tech) instead: a hosted, SQLite-compatible database with a free tier that comfortably covers a ~10-person shared board.

### 1. Create a Turso database

Install the [Turso CLI](https://docs.turso.tech/cli/installation) and sign in, then:

```bash
turso db create task-manager
turso db show task-manager --url          # -> DATABASE_URL
turso db tokens create task-manager        # -> DATABASE_AUTH_TOKEN
```

### 2. Push the schema to it

Run this once, locally, pointed at Turso (it won't touch your local dev database):

```bash
DATABASE_URL="libsql://task-manager-<your-org>.turso.io" \
DATABASE_AUTH_TOKEN="<token from above>" \
npx prisma db push
```

Optionally seed it with demo data the same way, swapping `prisma db push` for `npm run db:seed` (with the same two env vars set).

### 3. Deploy

Push this repo to GitHub and [import it on Vercel](https://vercel.com/new), or run `npx vercel` from this directory. Either way, before the first build completes, add these two Environment Variables in the Vercel project settings (Production — and Preview, if you want preview deployments to work too):

- `DATABASE_URL` — the `libsql://...` URL from step 1
- `DATABASE_AUTH_TOKEN` — the token from step 1

Vercel runs `npm install` (which triggers `prisma generate` via `postinstall`) and then `next build`. No database access is needed at build time — the dashboard and task pages are both rendered per-request — so the build itself won't fail even if you deploy before finishing steps 1–2, though the app won't work correctly until the database exists and the env vars are set.

### 4. Share the URL

Once deployed, share the `*.vercel.app` URL with your team. There's no login — everyone who has the link sees and can edit the same shared task board (see the access-control note at the top of this file).

## API routes

In addition to the Server Actions used by the UI (create/update/delete/status-change), a small REST API is available for external/programmatic use:

- `GET /api/tasks` — list tasks (`?q=`, `?status=`, `?priority=`, `?due=`, `?sort=`, `?order=`)
- `POST /api/tasks` — create a task
- `GET /api/tasks/:id` — fetch one task
- `PATCH /api/tasks/:id` — update a task, or pass `{ "status": "DONE" }` for a quick status-only change
- `DELETE /api/tasks/:id` — delete a task
