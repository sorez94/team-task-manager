import { clsx, type ClassValue } from "clsx";
import type { Priority, Status, TaskArea, TaskType } from "@/lib/generated/prisma/client";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const STATUS_LABEL: Record<Status, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  DOING: "Doing",
  BLOCKED: "Blocked",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const TYPE_LABEL: Record<TaskType, string> = {
  BUG: "Bug",
  TASK: "Task",
};

export const AREA_LABEL: Record<TaskArea, string> = {
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  DESIGN: "Design",
  PRODUCT: "Product",
};

// Board/select order — the rough lifecycle of a task, with Cancelled last.
export const STATUS_OPTIONS: Status[] = ["BACKLOG", "TODO", "DOING", "BLOCKED", "DONE", "CANCELLED"];
export const PRIORITY_OPTIONS: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const TYPE_OPTIONS: TaskType[] = ["TASK", "BUG"];
export const AREA_OPTIONS: TaskArea[] = ["FRONTEND", "BACKEND", "DESIGN", "PRODUCT"];

export const STATUS_BADGE_CLASS: Record<Status, string> = {
  BACKLOG:
    "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-800",
  TODO: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  DOING:
    "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  BLOCKED:
    "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800",
  DONE: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  CANCELLED:
    "bg-stone-100 text-stone-500 ring-1 ring-inset ring-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:ring-stone-700",
};

export const PRIORITY_BADGE_CLASS: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  MEDIUM:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  HIGH: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800",
  // Solid fill (vs. HIGH's tint) so the most urgent priority reads as
  // visually louder at a glance, not just a different hue.
  CRITICAL: "bg-red-600 text-white ring-1 ring-inset ring-red-700 dark:bg-red-500 dark:text-white dark:ring-red-400",
};

export const TYPE_BADGE_CLASS: Record<TaskType, string> = {
  TASK: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-800",
  BUG: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800",
};

export const AREA_BADGE_CLASS: Record<TaskArea, string> = {
  FRONTEND:
    "bg-cyan-50 text-cyan-700 ring-1 ring-inset ring-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:ring-cyan-800",
  BACKEND:
    "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-800",
  DESIGN:
    "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-inset ring-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-300 dark:ring-fuchsia-800",
  PRODUCT:
    "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:ring-teal-800",
};

export const STATUS_DOT_CLASS: Record<Status, string> = {
  BACKLOG: "bg-violet-500",
  TODO: "bg-slate-400",
  DOING: "bg-blue-500",
  BLOCKED: "bg-rose-500",
  DONE: "bg-emerald-500",
  CANCELLED: "bg-stone-400",
};

export const PRIORITY_DOT_CLASS: Record<Priority, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-rose-500",
  CRITICAL: "bg-white",
};

export const TYPE_DOT_CLASS: Record<TaskType, string> = {
  TASK: "bg-indigo-500",
  BUG: "bg-rose-500",
};

export const AREA_DOT_CLASS: Record<TaskArea, string> = {
  FRONTEND: "bg-cyan-500",
  BACKEND: "bg-orange-500",
  DESIGN: "bg-fuchsia-500",
  PRODUCT: "bg-teal-500",
};

/** Statuses that mean a task is no longer actively in flight. */
const INACTIVE_STATUSES: ReadonlySet<Status> = new Set(["DONE", "CANCELLED"]);

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return null;
  return dateFormatter.format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return null;
  return dateTimeFormatter.format(new Date(date));
}

/** Midnight today, in local time — used as the overdue/due-soon boundary. */
export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isOverdue(dueDate: Date | string | null | undefined, status?: Status) {
  if (!dueDate || (status && INACTIVE_STATUSES.has(status))) return false;
  return new Date(dueDate).getTime() < startOfToday().getTime();
}

export function isDueSoon(dueDate: Date | string | null | undefined, status?: Status) {
  if (!dueDate || (status && INACTIVE_STATUSES.has(status))) return false;
  const today = startOfToday();
  const in3Days = new Date(today);
  in3Days.setDate(in3Days.getDate() + 3);
  const time = new Date(dueDate).getTime();
  return time >= today.getTime() && time < in3Days.getTime();
}

/** Formats a Date to the yyyy-MM-dd shape an <input type="date"> expects. */
export function toDateInputValue(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses the comma-separated `areas` column into a list of TaskArea values, dropping anything unrecognized. */
export function parseAreas(value: string | null | undefined): TaskArea[] {
  if (!value) return [];
  const known = new Set<string>(AREA_OPTIONS);
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is TaskArea => known.has(v));
}

/** Serializes a list of TaskArea values back into the comma-separated form the `areas` column stores. */
export function serializeAreas(areas: TaskArea[]): string | null {
  return areas.length > 0 ? areas.join(",") : null;
}

/** Parses the comma-separated `assignees` column into a list of names, dropping blanks. */
export function parseAssignees(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/** Serializes a list of assignee names back into the comma-separated form the `assignees` column stores. */
export function serializeAssignees(assignees: string[]): string | null {
  const cleaned = assignees.map((a) => a.trim()).filter((a) => a.length > 0);
  return cleaned.length > 0 ? cleaned.join(",") : null;
}

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

/** Formats minutes into a compact duration string, e.g. 45 -> "45m", 120 -> "2h", 1500 -> "1d 1h". */
export function formatDuration(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const whole = Math.round(minutes);
  const days = Math.floor(whole / MINUTES_PER_DAY);
  const hours = Math.floor((whole % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
  const mins = whole % MINUTES_PER_HOUR;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  // Minutes are only shown alongside a coarser unit when there's no day
  // component, to keep the badge compact (e.g. "1d 2h", not "1d 2h 0m").
  if (mins > 0 && days === 0) parts.push(`${mins}m`);
  if (parts.length === 0) parts.push(`${mins}m`);

  return parts.slice(0, 2).join(" ");
}

const DURATION_TOKEN = /(\d+(?:\.\d+)?)\s*(d|h|m)/gi;

/**
 * Parses a compact duration string like "2h", "45m", "1d", or "1d 2h" into
 * minutes. A bare number with no unit (e.g. "90") is treated as minutes.
 * Returns null if nothing recognizable was entered.
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let total = 0;
  let matched = false;
  for (const match of trimmed.matchAll(DURATION_TOKEN)) {
    matched = true;
    const value = Number.parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === "d") total += value * MINUTES_PER_DAY;
    else if (unit === "h") total += value * MINUTES_PER_HOUR;
    else total += value;
  }

  if (!matched) {
    const bare = Number(trimmed);
    return !Number.isNaN(bare) && bare > 0 ? Math.round(bare) : null;
  }

  return Math.round(total);
}

export function initials(name: string | null | undefined) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
