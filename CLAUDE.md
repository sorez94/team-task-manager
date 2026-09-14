@AGENTS.md

# Task Manager — guide for Claude

A no-login, shared task board: Next.js (App Router) + Prisma 7 on
SQLite/Turso, Tailwind 4, Zod. One entity (`Task`, plus `Attachment`), no
users, no per-task ownership. Everyone with the URL can see and edit
everything.

## Read these first, in this order

1. **`NEXTJS_AGENT_NOTES.md`** — condensed Next.js 16 framework notes for
   this repo. Read this instead of walking `node_modules/next/dist/docs/`.
2. **This file** — project conventions and where things live (below).
3. **`APP_SPEC.md`** — the exact-behavior spec: every formatting/parsing
   algorithm (duration, overdue/due-soon), validation rule, filter/sort
   contract, and page-by-page interaction spec. Treat it as the source of
   truth for *behavior* — read the relevant section before changing
   validation, filtering, sorting, or the date/duration helpers.
4. **`README.md`** — human-facing setup/deploy instructions. Its "Database
   schema" section is **stale** (see Known drift below) — don't trust it
   for the data model, only for setup/deploy steps.

## Architecture at a glance

- **Mutations** go through Server Actions in `app/actions/tasks.ts`
  (`createTask`, `updateTask`, `deleteTask`, `setTaskStatus`) — these are
  what the UI calls. Each returns `{ success: true, data }` or
  `{ success: false, errors, message? }` (see `ActionResult<T>`); after a
  successful write they call `revalidatePath("/")` and
  `revalidatePath("/tasks")`.
- A parallel **REST API** under `app/api/` (`tasks/`, `tasks/[id]/`,
  `tasks/assignees/`, `tasks/export/`, `tasks/[id]/attachments/`,
  `attachments/[id]/`) exists for programmatic access — keep both in sync
  when changing validation or the data model.
- **Validation** is defined once, in `lib/validations.ts`
  (`taskFormSchema`, a Zod schema), and used by both the client-side form
  and the server actions — never duplicate a validation rule elsewhere.
- **Query building** (filter/sort/search/pagination + dashboard stats) is
  centralized in `lib/tasks-query.ts` (`buildWhere`, `getFilteredTasks`,
  `getDistinctAssignees`, `getDashboardStats`). Add new filters there, not
  ad hoc in a page component.
- **List-valued columns aren't native lists** — SQLite has no scalar-list
  type, so `areas` and `assignees` are comma-separated strings on `Task`.
  Always go through the parse/serialize pairs in `lib/utils.ts`
  (`parseAreas`/`serializeAreas`, `parseAssignees`/`serializeAssignees`)
  rather than splitting/joining inline, and never `contains`-filter one of
  these columns directly — see the boundary-aware `startsWith`/`endsWith`/
  `contains(",x,")` pattern already used in `buildWhere`.
- **No global client store.** Filter/sort/search/pagination/view state
  lives in the URL query string (shareable, survives refresh). The one
  exception: which Kanban columns are visible is a per-browser preference
  in `localStorage`, read via `lib/useBoardStatusPrefs.ts`
  (`useSyncExternalStore`, so it's SSR-safe with no hydration mismatch).

## Data model (current — `prisma/schema.prisma` is the source of truth)

- `Priority`: `LOW | MEDIUM | HIGH | CRITICAL`.
- `TaskArea`: `FRONTEND | BACKEND | DESIGN | PRODUCT` — a task can have
  zero or more (`areas` column, comma-separated).
- `assignees` — comma-separated free-text names, not user references.
- `timeSpentMinutes` — plain integer minutes; entered/displayed via
  `formatDuration`/`parseDuration` in `lib/utils.ts` (accepts `"2h"`,
  `"45m"`, `"1d 2h"`, or a bare number).
- `Attachment` — belongs to a `Task` (cascade delete), image bytes stored
  **in the DB** (`Bytes` column), not on disk — Vercel's serverless
  functions have no persistent filesystem, so the DB is the only storage
  that survives a deploy. Rules live in `lib/attachments.ts`: 4MB/file cap,
  `image/png|jpeg|gif|webp` only. Enforce the same limits on any new
  upload path (client pre-check + server route).

## Keeping docs in sync

`README.md`'s "Database schema" section is kept in sync with
`prisma/schema.prisma` by hand (last synced: `CRITICAL` priority,
`DESIGN`/`PRODUCT` areas, `areas`/`timeSpentMinutes`, and the `Attachment`
model are all present). If you change the schema, update that README
section in the same change — and if it ever disagrees with
`prisma/schema.prisma` or `APP_SPEC.md`, those two win.

## Commands

`npm run dev` / `db:push` / `db:seed` / `db:studio` / `lint` — see
`README.md` for the full list and Turso/Vercel deploy steps.
