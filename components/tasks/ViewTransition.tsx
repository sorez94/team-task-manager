"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { BoardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

type View = "table" | "board";

type ViewTransitionContextValue = {
  isPending: boolean;
  pendingView: View | null;
  switchView: (view: View, navigate: () => void) => void;
};

const ViewTransitionContext = createContext<ViewTransitionContextValue | null>(null);

export function ViewTransitionProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  const [pendingView, setPendingView] = useState<View | null>(null);

  const switchView = (view: View, navigate: () => void) => {
    setPendingView(view);
    startTransition(navigate);
  };

  return (
    <ViewTransitionContext.Provider
      value={{ isPending, pendingView: isPending ? pendingView : null, switchView }}
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

// Swaps in a skeleton matching the view being navigated to while the
// table/board switch is in flight, instead of leaving the old view on
// screen with no feedback until the new URL's data has loaded.
export function TasksViewContent({ children }: { children: ReactNode }) {
  const { isPending, pendingView } = useViewTransition();

  if (isPending) {
    return pendingView === "table" ? <TableSkeleton /> : <BoardSkeleton />;
  }

  return <>{children}</>;
}
