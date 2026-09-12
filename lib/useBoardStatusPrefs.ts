"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Status } from "@/lib/generated/prisma/client";
import { STATUS_OPTIONS } from "@/lib/utils";

const STORAGE_KEY = "task-manager:board-visible-statuses";

// In-tab listeners for our own writes (the browser's "storage" event never
// fires in the tab that made the change, only in *other* tabs/windows).
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function parseStatuses(raw: string | null): Status[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter((s): s is Status => STATUS_OPTIONS.includes(s as Status));
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

// getSnapshot must return a referentially stable value when nothing has
// actually changed (useSyncExternalStore re-invokes it to check for
// tearing) — so cache the parsed result and only rebuild it when the raw
// string underneath has changed.
let cachedRaw: string | null = null;
let cachedSnapshot: Status[] = STATUS_OPTIONS;

function getSnapshot(): Status[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Local storage may be unavailable (private browsing, disabled site
    // data) — fall back to defaults rather than throw.
    raw = null;
  }
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = parseStatuses(raw) ?? STATUS_OPTIONS;
  return cachedSnapshot;
}

// Used for server rendering and the initial client render, before
// localStorage can be read — always "everything visible", so there's no
// hydration mismatch.
function getServerSnapshot(): Status[] {
  return STATUS_OPTIONS;
}

function persist(statuses: Status[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch {
    // Preference just won't survive a reload; the board still works.
  }
  notify();
}

/**
 * Which board columns *this browser* wants to see. This is a per-device
 * preference stored in localStorage, not project data — nothing is sent to
 * the server, so it doesn't affect what other people looking at the same
 * board see, and it has no effect outside the board view.
 */
export function useBoardStatusPrefs() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((status: Status) => {
    const current = getSnapshot();
    const next = current.includes(status) ? current.filter((s) => s !== status) : [...current, status];
    // Keep at least one column visible so the board never goes empty.
    if (next.length === 0) return;
    persist(next);
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up if storage isn't available anyway.
    }
    notify();
  }, []);

  return { visible, toggle, reset };
}
