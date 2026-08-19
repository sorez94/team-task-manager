"use client";

import { LayoutGrid, List, Search, ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Select } from "@/components/ui/Field";
import { cn, PRIORITY_LABEL, PRIORITY_OPTIONS, STATUS_LABEL, STATUS_OPTIONS } from "@/lib/utils";

const DUE_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "Any due date" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "TODAY", label: "Due today" },
  { value: "WEEK", label: "Due this week" },
  { value: "NONE", label: "No due date" },
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "createdAt", label: "Created" },
  { value: "updatedAt", label: "Updated" },
  { value: "dueDate", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Title" },
];

export function FilterBar({ view }: { view: "table" | "board" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [search, setSearch] = useState(urlQuery);
  // Tracks the last URL value we've reconciled `search` against, so the
  // input can be reset when `q` changes from outside this component (e.g.
  // browser back/forward) without clobbering the user's in-progress typing
  // during the debounce window below. This mirrors what a
  // `useEffect(() => setSearch(urlQuery), [urlQuery])` would do, but adjusts
  // state during render instead of in a passive effect.
  const [reconciledQuery, setReconciledQuery] = useState(urlQuery);
  if (urlQuery !== reconciledQuery) {
    setReconciledQuery(urlQuery);
    setSearch(urlQuery);
  }
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "ALL") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/tasks?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", value), 300);
  };

  const order = searchParams.get("order") === "asc" ? "asc" : "desc";
  const toggleOrder = () => setParam("order", order === "asc" ? "desc" : "asc");

  const setView = (next: "table" | "board") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    router.push(`/tasks?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-56">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search title or description…"
          aria-label="Search tasks"
          className="w-full rounded-lg border-0 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
        />
      </div>

      <Select
        aria-label="Filter by status"
        value={searchParams.get("status") ?? "ALL"}
        onChange={(e) => setParam("status", e.target.value)}
        className="w-auto"
      >
        <option value="ALL">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by priority"
        value={searchParams.get("priority") ?? "ALL"}
        onChange={(e) => setParam("priority", e.target.value)}
        className="w-auto"
      >
        <option value="ALL">All priorities</option>
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {PRIORITY_LABEL[p]}
          </option>
        ))}
      </Select>

      <Select
        aria-label="Filter by due date"
        value={searchParams.get("due") ?? "ALL"}
        onChange={(e) => setParam("due", e.target.value)}
        className="w-auto"
      >
        {DUE_OPTIONS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </Select>

      <div className="flex items-center gap-1.5">
        <Select
          aria-label="Sort by"
          value={searchParams.get("sort") ?? "createdAt"}
          onChange={(e) => setParam("sort", e.target.value)}
          className="w-auto"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              Sort: {s.label}
            </option>
          ))}
        </Select>
        <button
          onClick={toggleOrder}
          aria-label={order === "asc" ? "Sort ascending" : "Sort descending"}
          title={order === "asc" ? "Ascending" : "Descending"}
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800"
        >
          {order === "asc" ? <ArrowUpAZ className="size-4" /> : <ArrowDownAZ className="size-4" />}
        </button>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        <button
          onClick={() => setView("table")}
          aria-label="Table view"
          aria-pressed={view === "table"}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            view === "table"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <List className="size-3.5" /> Table
        </button>
        <button
          onClick={() => setView("board")}
          aria-label="Board view"
          aria-pressed={view === "board"}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            view === "board"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <LayoutGrid className="size-3.5" /> Board
        </button>
      </div>
    </div>
  );
}
