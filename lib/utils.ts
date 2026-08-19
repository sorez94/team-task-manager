import { clsx, type ClassValue } from "clsx";
import type { Priority, Status } from "@/lib/generated/prisma/client";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const STATUS_LABEL: Record<Status, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const STATUS_OPTIONS: Status[] = ["TODO", "IN_PROGRESS", "DONE"];
export const PRIORITY_OPTIONS: Priority[] = ["LOW", "MEDIUM", "HIGH"];

export const STATUS_BADGE_CLASS: Record<Status, string> = {
  TODO: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  IN_PROGRESS:
    "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  DONE: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
};

export const PRIORITY_BADGE_CLASS: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  MEDIUM:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  HIGH: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800",
};

export const STATUS_DOT_CLASS: Record<Status, string> = {
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-blue-500",
  DONE: "bg-emerald-500",
};

export const PRIORITY_DOT_CLASS: Record<Priority, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-rose-500",
};

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
  if (!dueDate || status === "DONE") return false;
  return new Date(dueDate).getTime() < startOfToday().getTime();
}

export function isDueSoon(dueDate: Date | string | null | undefined, status?: Status) {
  if (!dueDate || status === "DONE") return false;
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

export function initials(name: string | null | undefined) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
