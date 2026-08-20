"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { BoardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

type View = "table" | "board";

type ViewTransitionContextValue = {
  isPending: boolean;
  pendingView: View | null;
  switchView: (view: View, navigate: () => void) => void;
  // For navigations that don't change the table/board view (filter, search,
  // sort changes) — keeps the current view's skeleton on screen instead of
  // switching to a specific pendingView.
  startFilterTransition: (navigate: () => void) => void;
};

const ViewTransitionContext = createContext<ViewTransitionContextValue | null>(null);

export function ViewTransitionProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  const [pendingView, setPendingView] = useState<View | null>(null);

  const switchView = (view: View, navigate: () => void) => {
    setPendingView(view);
    startTransition(navigate);
  };

  const startFilterTransition = (navigate: () => void) => {
    setPendingView(null);
    startTransition(navigate);
  };

  return (
    <ViewTransitionContext.Provider
      value={{
        isPending,
        pendingView: isPending ? pendingView : null,
        switchView,
        startFilterTransition,
      }}
    >
      {children}
    </ViewTransitionContext.Provider>
  );
}

export function useViewTransition() {
  const ctx = useContext(ViewTransitionContext);
  if (!ctx) throw new Error("useViewTransition must be used within a ViewTransitionProvider");
  return ctx;
}

// Swaps in a skeleton while any navigation triggered from this page (view
// switch, filter/search/sort change) is in flight, instead of leaving stale
// data on screen with no feedback until the new URL's data has loaded.
// `view` is the current (already-committed) view, used as a fallback when
// the pending navigation isn't a table/board switch.
export function TasksViewContent({ children, view }: { children: ReactNode; view: View }) {
  const { isPending, pendingView } = useViewTransition();

  if (isPending) {
    return (pendingView ?? view) === "table" ? <TableSkeleton /> : <BoardSkeleton />;
  }

  return <>{children}</>;
}
