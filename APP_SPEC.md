# Task Manager — Application Logic Specification

**Purpose of this document:** this is a build spec for an AI (or a developer) to recreate this application from scratch. It describes **only logic and behavior** — data model, validation rules, business rules, page/route contracts, and interaction/state logic. It deliberately contains **no visual design system**: no colors, spacing, typography, icon choices, or component styling. Whoever implements this is free to choose their own UI look — just reproduce the behavior described here.

Where a concrete technology is named (Next.js, Prisma, Zod, SQLite/Turso), that's because it's an architectural decision that affects behavior (e.g. server actions vs. REST, how pagination works), not a styling choice. Substituting an equivalent stack is fine as long as the described behavior is preserved.

---

## 1. Overview

A single-tenant, no-login, shared task manager ("task board") for a small team. Anyone with the URL can view, create, edit, and delete any task — there is no authentication, no user accounts, and no per-user ownership of tasks. Two main views:

- **Dashboard** (`/`) — summary stats + a short "recently updated" feed.
- **Tasks** (`/tasks`) — the full task list, filterable/searchable/sortable, in either a **table** or a **Kanban-style board** layout.

Tasks are created/edited/deleted through a single modal reused across the whole app, and through a REST API for programmatic access.

## 2. Non-goals

- No authentication, authorization, or multi-tenancy.
- No file attachments, comments, activity log, or notifications beyond in-app toasts.
- No real-time sync between browser tabs/users beyond a full page-data refresh after a mutation.
- No visual/design specification — colors, layout spacing, fonts, and iconography are intentionally left out of this document.

## 3. Tech stack (architectural, not aesthetic)

- **Framework**: Next.js App Router (Server Components for data fetching, Server Actions for mutations from the UI, Route Handlers for a REST API), React with `useTransition`/`useSyncExternalStore`.
- **Database**: SQLite. Local dev uses a plain file (`prisma/dev.db`); production uses a hosted SQLite-compatible database (Turso) reached over libSQL, since serverless deployments have no persistent local disk. Both are accessed through the same driver-adapter interface so app code doesn't branch on environment.
- **ORM**: Prisma, with a driver adapter (rather than a built-in connector) so the same client code works against a local file or a remote libSQL endpoint, selected purely by an environment variable.
- **Validation**: a schema-validation library (Zod in the reference implementation) shared between client-side form submission and server-side mutation handlers, so the same rules apply everywhere a task is written.
- **State**: no global client store. Filter/sort/search/pagination/view state all live in the URL's query string (so it's shareable/bookmarkable and survives refresh). The one piece of client-only persisted state is which Kanban columns are visible, stored in `localStorage` per browser.

## 4. Data model

One entity: **Task**.

```
Task
├── id                String    (primary key, generated, e.g. cuid)
├── title             String    (required)
├── description       String?   (optional, long text)
├── type              Enum      TaskType    — default TASK... see note below
├── areas             String?   (see "Areas encoding" below)
├── status            Enum      Status      — default TODO
├── priority          Enum      Priority    — default MEDIUM
├── dueDate           DateTime? (date only, no time-of-day significance)
├── assignees         String?   (comma-separated free-text names, see "Assignees encoding" below)
├── timeSpentMinutes  Int?      (time logged, stored as raw minutes)
├── createdAt         DateTime  (set once, on creation)
└── updatedAt         DateTime  (bumped on every update)
```

**Enums:**

- `TaskType`: `TASK`, `BUG`
- `Status`: `BACKLOG`, `TODO`, `DOING`, `BLOCKED`, `DONE`, `CANCELLED` — this order is also the canonical display/column order everywhere (selects, board columns, column-visibility list).
- `Priority`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` — this order is also the canonical ranking order for sorting (see §6.4), from lowest to highest.
- `TaskArea`: `FRONTEND`, `BACKEND`, `DESIGN`, `PRODUCT`

**"Inactive" statuses:** `DONE` and `CANCELLED` are treated as "no longer in flight" everywhere overdue/due-soon logic is computed — a task in either of these statuses is never counted as overdue or due-soon, no matter its due date.

**Areas encoding:** a task can belong to zero or more areas (it's not a single category — a task can touch both frontend and backend, say). Since the database column is a plain string (no native list type), areas are stored as a comma-separated string of `TaskArea` values (e.g. `"FRONTEND,DESIGN"`), or `null`/empty for "unspecified". Helper functions:
- `parseAreas(raw)` → splits on `,`, trims, and drops any token that isn't a recognized `TaskArea` value; returns `[]` for null/empty input.
- `serializeAreas(list)` → joins the list with `,`; returns `null` if the list is empty (never stores an empty string).

**Assignees encoding:** a task can have zero or more assignees (free-text names, not user references). Same convention as areas — stored as a comma-separated string (e.g. `"Amelia Chen,Marcus Reid"`), or `null` for "unassigned". Helper functions:
- `parseAssignees(raw)` → splits on `,`, trims each name, and drops empty tokens; returns `[]` for null/empty input.
- `serializeAssignees(list)` → trims and drops empty names, joins with `,`; returns `null` if the resulting list is empty (never stores an empty string). A name may not itself contain a comma (rejected at validation).

**Time spent encoding:** stored as a plain integer number of minutes (`null` if not logged). Entered and displayed as a compact human string — see §6.1.

**Indexes:** on `status`, `priority`, `type`, `areas`, `assignees`, `dueDate`, `createdAt` — i.e., every field used as a filter or sort key.

## 5. Formatting / parsing utilities (exact algorithms)

These are pure functions used by both forms and display, and should be reproduced exactly since validation depends on them.

### 5.1 Duration parsing — `parseDuration(input) → minutes | null`

Accepts compact strings like `"2h"`, `"45m"`, `"1d"`, `"1d 2h"`, or a bare number (treated as minutes).

1. Trim input; empty → `null`.
2. Scan for all tokens matching `(\d+(\.\d+)?)\s*(d|h|m)` (case-insensitive, repeatable — e.g. `"1d 2h"` has two tokens).
3. For each token found, convert to minutes and sum: `d` × 1440, `h` × 60, `m` × 1.
4. If **no** token matched at all, fall back to treating the entire trimmed string as a bare number: if it parses to a number `> 0`, return it rounded; otherwise `null`.
5. If at least one token matched, return the summed total, rounded to the nearest integer.

### 5.2 Duration formatting — `formatDuration(minutes) → string | null`

1. `null`/`undefined`/`≤ 0` → `null` (nothing to show).
2. `days = floor(minutes / 1440)`, `hours = floor((minutes % 1440) / 60)`, `mins = minutes % 60`.
3. Build parts: include `"{days}d"` if `days > 0`; include `"{hours}h"` if `hours > 0`; include `"{mins}m"` **only if `mins > 0` and `days === 0`** (minutes are suppressed once there's a day component, to keep it to two units max, e.g. `"1d 2h"` not `"1d 2h 0m"`).
4. If no parts were produced (i.e. `< 1` minute rounds to 0 across the board), fall back to `"{mins}m"` (typically `"0m"`, though the guard in step 1 makes this effectively unreachable for valid input).
5. Return at most the first 2 parts, space-joined.

### 5.3 Overdue / due-soon

- `startOfToday()` = local midnight of the current day.
- `isOverdue(dueDate, status)` = `dueDate` is set **and** status is not `DONE`/`CANCELLED` **and** `dueDate < startOfToday()`.
- `isDueSoon(dueDate, status)` = `dueDate` is set **and** status is not `DONE`/`CANCELLED` **and** `startOfToday() ≤ dueDate < startOfToday() + 3 days`.

### 5.4 Assignee initials — `initials(name) → string`

- No name → `"—"`.
- Split on whitespace. One word → first 2 characters, upper-cased. Multiple words → first letter of the first word + first letter of the last word, upper-cased.

### 5.5 Date input round-tripping

- `toDateInputValue(date)` formats a `Date`/ISO string to `yyyy-MM-dd` in **local** time (not UTC) for use in a native date input; `null`/`undefined` → `""`.

## 6. Validation rules (task create/edit form)

A single schema governs both the UI form and every server-side write path (server actions and REST API), so validation is identical everywhere:

| Field | Rule |
|---|---|
| `title` | Required, trimmed, 1–120 characters. |
| `description` | Optional, trimmed, ≤ 2000 characters. Empty string allowed. |
| `type` | Required, one of `TASK`/`BUG`. |
| `areas` | Array of `TaskArea` values, defaults to `[]` if omitted. Zero or more, no duplicates enforced by the UI (a toggle-based multi-select). |
| `status` | Required, one of the 6 `Status` values. |
| `priority` | Required, one of the 4 `Priority` values. |
| `dueDate` | Optional. Empty string allowed. If non-empty, must parse as a valid date. |
| `assignees` | Array of names, defaults to `[]` if omitted. Each name trimmed, 1–80 characters, and may not contain a comma. At most 20 entries. |
| `timeSpent` | Optional, trimmed, ≤ 20 characters. Empty allowed. If non-empty, must successfully parse via §5.1 (`parseDuration`) — error message: *"Enter a duration like 2h, 45m, or 1d"*. |

On write, empty-string optional fields are normalized to `null` before persisting (`description || null`), `dueDate` is converted with `new Date(dueDate)` or `null`, `timeSpent` is converted through `parseDuration` to `timeSpentMinutes` (or `null`), `areas` is converted through `serializeAreas`, and `assignees` is converted through `serializeAssignees`.

Validation errors are reported per-field (first error per field wins if a field has multiple issues) so the UI can show them inline next to each input.

## 7. Data access / query layer

All task listing (dashboard stats, table view, board view, REST API) goes through one shared filter-building function so filter semantics never diverge between surfaces.

### 7.1 Filter parameters

| Filter | Values | Behavior |
|---|---|---|
| `q` | free text | Matches if `title`, `description`, or `assignees` **contains** the text (case handling per DB collation; no fuzzy matching). |
| `type` | `ALL` \| `TaskType` | Exact match, or no filter if `ALL`. |
| `area` | `ALL` \| `UNSPECIFIED` \| `TaskArea` | `ALL` = no filter. `UNSPECIFIED` = `areas` is null or empty string. Otherwise: match the comma-list as a **whole token** — equals the value, starts with `"{area},"`, ends with `",{area}"`, or contains `",{area},"` (never a plain substring match, to avoid one area name accidentally matching inside another). |
| `status` | `ALL` \| `Status` | Exact match. |
| `priority` | `ALL` \| `Priority` | Exact match. |
| `assignee` | `ALL` \| `UNASSIGNED` \| name | Filters on the multi-valued `assignees` list, not a single-assignee field — a task can match while having other assignees too. `ALL` = no filter. `UNASSIGNED` = `assignees IS NULL`. Otherwise: match the comma-list as a **whole token** (same scheme as `area` above) — a task matches if the given name is *one of* its assignees. |
| `due` | `ALL` \| `OVERDUE` \| `TODAY` \| `WEEK` \| `NONE` | `OVERDUE`: `dueDate < today` **and** status not inactive (§4). `TODAY`: `today ≤ dueDate < tomorrow`. `WEEK`: `today ≤ dueDate < today+7d`. `NONE`: `dueDate IS NULL`. |
| `sort` | `dueDate` \| `priority` \| `createdAt` \| `updatedAt` \| `title` | See §7.2. Default: `createdAt`. |
| `order` | `asc` \| `desc` | Default: `desc`. |
| `page` / `pageSize` | integers | **Optional.** Omitting both returns every matching row unpaginated (used by the board view, which lays tasks out by status column rather than by page). Default page size: 20. |

All active filter conditions are AND-ed together.

### 7.2 Sorting

- Every sort field except `priority` is a plain database `ORDER BY`.
- `priority` is ranked by a fixed weight (`LOW=0, MEDIUM=1, HIGH=2, CRITICAL=3`), **not** alphabetically — since the database can't express that ordering natively, this case fetches all matching rows, sorts them in application code by weight (respecting `asc`/`desc`), and then (if paginating) slices the requested page out of the already-sorted array in memory.

### 7.3 Distinct assignees

For the assignee filter dropdown: every task's `assignees` list is parsed (`parseAssignees`) and flattened into individual names, deduplicated, alphabetically sorted (locale-aware compare). No pagination.

### 7.4 Dashboard stats

Computed in one batch:
- `total` — count of all tasks.
- `todo`, `doing`, `blocked`, `done` — counts by exact status (`BACKLOG` and `CANCELLED` are not surfaced as their own stat cards).
- `overdue` — count where `dueDate < today` and status not inactive.
- `dueThisWeek` — count where `today ≤ dueDate < today+7d` and status not inactive.
- `recent` — the 5 tasks with the most recent `updatedAt`, regardless of status.

## 8. Mutations

Two parallel entry points exist and must stay behaviorally identical (same validation, same normalization, same side effects):

### 8.1 Server actions (used by the UI forms)

- `createTask(values)` → validates with the shared schema; on failure returns per-field errors; on success creates the row (field normalization per §6) and returns the new id. On an unexpected DB error, returns a generic *"Could not create the task. Please try again."* message.
- `updateTask(id, values)` → same validation/normalization, updates the row by id. If the row no longer exists (deleted concurrently), returns *"This task no longer exists."* Otherwise a generic failure message on error.
- `deleteTask(id)` → deletes by id. Same "no longer exists" handling if it's already gone.
- `setTaskStatus(id, status)` → updates only the `status` field (no full-form validation needed since it's a fixed enum). Same not-found handling.

Every successful mutation invalidates/refreshes both the dashboard (`/`) and tasks (`/tasks`) pages' cached data so subsequent navigations show fresh data.

### 8.2 REST API (for external/programmatic use, and also used by the UI for the two "quick" inline actions — toggling a checkbox complete/incomplete, and changing status from a board card's dropdown)

| Method & path | Body | Success | Errors |
|---|---|---|---|
| `GET /api/tasks` | — (query string: same filter params as §7.1) | `200 { tasks, total }` | `500` on unexpected failure |
| `POST /api/tasks` | full task form JSON | `201 { task }` | `400` invalid JSON; `422 { issues }` (field-level) on validation failure |
| `GET /api/tasks/:id` | — | `200 { task }` | `404` if not found |
| `PATCH /api/tasks/:id` | either a full task form JSON **or** a "quick" partial body of exactly `{ "status": "<Status>" }` | `200 { task }` | `400` invalid JSON; `422` invalid status value or full-form validation failure; `404` if the task no longer exists |
| `DELETE /api/tasks/:id` | — | `200 { success: true }` | `404` if not found |

The "quick status update" detection rule: the parsed JSON body is a plain object with **exactly one key**, and that key is `"status"`. Anything else (including `{ status, title }`) is routed through full-form validation instead.

Every successful write (`POST`/`PATCH`/`DELETE`) triggers the same cache invalidation as the server actions.

## 9. Pages and routing contract

### 9.1 Dashboard — `GET /`

Server-rendered per request (not statically pre-rendered, since "overdue" depends on the current date and the DB may not exist yet at build time). Renders:
- 6 stat tiles: total, to-do, doing, blocked, completed, overdue (with a "N due within 7 days" hint shown only when `dueThisWeek > 0`).
- A "recently updated" list of up to 5 tasks, each opening the edit modal on click; falls back to an empty-state with a "New Task" call to action when there are no tasks at all.

### 9.2 Tasks — `GET /tasks`

All state is driven by the URL query string, so the whole view is bookmarkable/shareable and works with browser back/forward:

| Param | Default | Meaning |
|---|---|---|
| `q` | `""` | Search text |
| `type`, `area`, `status`, `priority` | `ALL` | Filters, per §7.1 |
| `assignee` | `ALL` | Filter, per §7.1 |
| `due` | `ALL` | Due-date filter, per §7.1 |
| `sort` | `createdAt` | Sort field |
| `order` | `desc` | Sort direction |
| `view` | `board` | `"table"` or `"board"` — anything other than the literal `"table"` is treated as `"board"` |
| `page` | `1` | Table view only |

Behavior:
- The board view always fetches **every** matching task (unpaginated) and groups it client-side by status; the table view paginates server-side at 20 per page.
- The distinct-assignee list (for the assignee filter's options) is fetched unconditionally alongside the tasks.
- If the requested `page` is beyond the last valid page for the current filters (e.g. a bookmarked URL made stale by a filter change or deleted tasks) **and** there's at least one matching task, the request is redirected to the last valid page — preserving every other query param — rather than rendering a misleading empty table. If the corrected page is 1, the `page` param is dropped from the URL entirely rather than written as `page=1`.
- A boolean "is filtered" state (true if `q` is non-empty or any filter is off its `ALL` default) drives: the header's "N tasks total" vs. "N tasks matching your filters" copy, and which empty-state message/action shows when there are zero results.

## 10. Client-side interaction & state logic

This section describes *behavior*, not appearance.

### 10.1 Filter bar

- Every non-search filter/sort control writes directly to the URL (via client-side navigation, not a full reload) the moment it changes.
- The search box is **debounced 300ms** before it updates the URL, so the URL (and thus the server query) doesn't refire on every keystroke. Locally-typed text is still shown immediately.
- The search input's local value is reconciled with the URL's `q` param whenever the URL changes from *outside* the input itself (e.g. browser back/forward, or a "clear filters" action elsewhere) — but must not stomp on text the user is still actively typing during the debounce window.
- Changing **any** filter, search text, or sort resets pagination back to page 1 (removes the `page` param) — a filter change can shrink or reorder the result set, so a previously-valid page number may no longer be valid.
- The sort-direction control simply flips `order` between `asc`/`desc`; it doesn't reset the sort field.
- Switching between table/board view is a distinct action from other filter changes (see §10.5 on how pending-state feedback differs between the two).

### 10.2 Task create/edit modal

- One modal instance exists globally (mounted once at the app root) with two entry modes: **create** (no task) and **edit** (a specific task). Any part of the UI can request either mode through a shared global controller — opening it in edit mode loads that task's current values into the form; opening in create mode resets to defaults.
- Default values for a brand-new task: empty title/description, `type = BUG`, `status = TODO`, `priority = MEDIUM`, no areas, no due date, no assignees, no time spent. *(Note: the type defaulting to `BUG` rather than `TASK` is the actual current behavior — carry it forward as-is unless the rebuild intentionally revisits it.)*
- The "assignees" field is a free-text tag input — type a name and press Enter or `,` to add it as a chip; Backspace on an empty draft removes the last chip. Known names from existing tasks are offered as autocomplete suggestions, fetched when the modal opens (best-effort — a failed fetch just means no suggestions).
- Re-opening the modal — including reopening it for the *same* task right after a cancelled edit — must re-derive the form fields fresh from that task's current data, not reuse stale in-memory form state from the previous time it was open.
- The "areas" field is a multi-select where each option is independently toggleable on/off (not a single-choice control).
- On submit: run client-known validation implicitly by delegating straight to the shared create/update mutation; if it returns field errors, show them inline per-field and show any top-level message (e.g. "task no longer exists") above the form buttons; the submit button shows a busy state and is disabled while in flight; the Cancel button is also disabled while submitting (to avoid closing mid-save). On success: show a success toast ("Task created" / "Task updated"), refresh the underlying page's data, and close the modal.

### 10.3 Table view

- Each row has a checkbox that's a shortcut for "mark done" — it only ever toggles between `DONE` and `TODO` (checking it sets `DONE`; unchecking it sets `TODO` — it does not restore whatever the previous non-done status was, e.g. `DOING` or `BLOCKED`). This goes through the "quick status" REST endpoint, not the full form.
- The checkbox and its row show a pending/disabled state while the request is in flight; on failure, show an error toast and leave the row's prior state.
- Clicking a row's title (or its edit icon) opens the edit modal for that task.
- A delete icon opens a confirmation dialog naming the task's title; only on explicit confirm does it call the delete mutation, then toast + refresh.
- Empty state differs by whether filters are active (see §9.2); the "New Task" shortcut in the empty state only appears when there are *no* filters active (an empty *filtered* result shouldn't imply "you have zero tasks, create one").

### 10.4 Board view

- Columns = the `Status` enum values (§4's canonical order), each showing every task with that status from the **full, unpaginated** result set for the current filters.
- **Column visibility** is a per-browser preference, not project data: stored in `localStorage`, independent of the server and of what any other viewer/device sees. Default (nothing stored, or invalid/corrupted stored data) = all 6 columns visible. A settings control lets the user hide/show individual columns; toggling off the last remaining visible column is a no-op (at least one column must always stay visible). A "reset" action clears the stored preference back to "all visible." Changes made in one browser tab should be reflected in other tabs/windows of the same browser (standard cross-tab storage change propagation), though not in other people's browsers.
- Each column is independently collapsible/expandable (starts **collapsed** by default for every column) and shows a live count of tasks in that column regardless of collapsed state.
- Each card shows an inline status selector for changing that one task's status without opening the full edit modal — this goes through the "quick status" REST endpoint. Selecting the task's *current* status again is a no-op (no request fires). While the request is in flight, that card shows a pending/disabled state; on failure, an error toast and no visual status change.
- Edit and delete affordances behave identically to the table view (§10.3): edit opens the full modal, delete opens the same confirmation dialog pattern.
- Empty states: "no tasks at all" (with a create shortcut, unfiltered) vs. "no tasks match your filters" (filtered) at the board level when there are zero tasks overall; additionally, an individual column with zero tasks (but other columns non-empty) shows its own lightweight "no tasks" placeholder rather than being hidden.

### 10.5 Pending/loading feedback for navigation

- Any URL-driven navigation from this page (filter/search/sort/pagination change, or switching table↔board) is wrapped in a non-blocking transition: the current content stays interactive-looking but a loading indicator appears, and a full-page skeleton replaces the content only once the transition is actually pending.
- Switching table↔board specifically pre-selects *which* skeleton shape (table-shaped or board-shaped) to show for the *destination* view while it loads, since the outgoing and incoming views look structurally different. Filter/search/sort/pagination changes, by contrast, keep showing whichever skeleton matches the *current* (not-yet-changed) view, since the view itself isn't changing.

### 10.6 Pagination (table view)

- Hidden entirely if there's only one page.
- Shows a 1-indexed "showing X–Y of Total" summary and prev/next controls; prev is disabled on page 1, next is disabled on the last page.
- Navigating clamps the requested page into `[1, pageCount]` and no-ops if it's already the current page. Same URL-param mechanics as other filters (page 1 is represented by the *absence* of the `page` param, not `page=1`).

### 10.7 Toasts

- A global, app-root-mounted notification queue. `showToast(message, variant)` where variant is `"success"` (default) or `"error"`.
- Each toast auto-dismisses after **4 seconds**; also individually dismissible manually. Multiple toasts can be visible/stacked at once. Rendered outside the normal document flow (a portal to `document.body`), and must not attempt to render server-side (only after the client has mounted), to avoid a server/client markup mismatch.

### 10.8 Navigation shell

- Two top-level nav destinations: Dashboard (`/`) and Tasks (`/tasks`, and anything nested under it). "Active" highlighting: the Dashboard link is active only on an *exact* `/` match; the Tasks link is active on `/tasks` and any path prefixed with it.
- A persistent "New Task" shortcut is always reachable from the nav shell itself (not just from the tasks page), opening the same global create modal.
- On narrow viewports, primary navigation collapses behind a toggleable off-canvas drawer; the drawer closes itself after any nav link is clicked, after its own explicit close control, or after clicking outside it — and also closes when its own "New Task" shortcut is used (in addition to opening the modal).

### 10.9 Error/empty/not-found routes

- A caught render/data error at the app root shows a generic recoverable error state with a "Try again" action that re-attempts rendering (does not reload the whole page or lose navigation state more than necessary); the underlying error should be logged for diagnostics.
- An unmatched route shows a not-found state with a way back to the dashboard.
- Both the dashboard and tasks routes have a route-level loading fallback (skeleton) shown during the *initial* server-rendered load of that route (distinct from the client-side transition skeletons in §10.5, which cover subsequent in-app navigations).

## 11. Internationalization note

Task **title** and **description** are free text that must correctly support right-to-left scripts (e.g. Persian/Arabic) — both in the display (table rows, board cards) and in the edit form's input/textarea. This is a functional text-direction requirement (affects cursor behavior and reading order for RTL content), independent of any visual styling choice.

## 12. Environment & configuration

| Variable | Local default | Production |
|---|---|---|
| `DATABASE_URL` | a local SQLite file path | a remote libSQL/Turso URL |
| `DATABASE_AUTH_TOKEN` | not needed | required for the remote database |

Standard project scripts to reproduce: install dependencies (which should also generate the ORM client), push/migrate the schema, seed demo data, run the dev server, build, and start the production server. A "reset" script (drop + recreate schema + reseed) is useful for local development.

## 13. Seed / demo data

For local development and demos, seed the database with a reset-then-insert of a fixed set of sample tasks spanning every status and priority, a mix of areas, some overdue due dates, some with no due date, at least one unassigned task, some with more than one assignee, and one with no description. A reasonable set (title / type / area(s) / status / priority / due offset from today / assignee(s)):

1. "Design new landing page hero" — TASK, FRONTEND, DOING, HIGH, due +2d, Amelia Chen & Sofia Ibrahim
2. "Fix checkout flow overdue bug" — BUG, FRONTEND, TODO, HIGH, due −3d (overdue), Marcus Reid
3. "Write Q3 roadmap doc" — TASK, unspecified area, BACKLOG, MEDIUM, due +5d, Priya Nair
4. "Migrate CI to new runners" — TASK, BACKEND, DONE, LOW, due −10d, Marcus Reid, no description
5. "Set up product analytics dashboard" — TASK, BACKEND, DOING, MEDIUM, due +1d, Sofia Ibrahim & Priya Nair
6. "Review vendor security questionnaire" — TASK, unspecified area, BLOCKED, HIGH, due −1d (overdue), Amelia Chen
7. "Refactor task list pagination" — BUG, FRONTEND, TODO, LOW, no due date, unassigned
8. "Plan team offsite" — TASK, unspecified area, BACKLOG, LOW, due +21d, Priya Nair & Marcus Reid & Amelia Chen
9. "Upgrade Next.js to latest major" — TASK, BACKEND, DONE, MEDIUM, due −14d, Sofia Ibrahim
10. "Customer interview synthesis" — TASK, unspecified area, DOING, MEDIUM, due +4d, unassigned
11. "Audit accessibility on task board" — BUG, FRONTEND, TODO, MEDIUM, due +7d, Amelia Chen
12. "Archive stale feature flags" — TASK, BACKEND, CANCELLED, LOW, due −30d, Marcus Reid, no description

(These map to the current single-area-per-task shape; if implementing the multi-area model in §4, seed each with a one-element `areas` list rather than a scalar `area`, per the fix noted in §14.)

## 14. Known inconsistency to fix during rebuild

In the reference implementation, the seed script was written against an earlier version of the schema where a task had **one** optional `area` field, and was never updated after the schema changed to the current **multiple areas, comma-encoded** model (§4). When rebuilding, make sure the seed data is written against the *current* shape (an `areas: TaskArea[]` list run through `serializeAreas`, or the multi-area column directly) rather than a single scalar `area` field that no longer exists on the model.
