"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useViewTransition } from "@/components/tasks/ViewTransition";

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startFilterTransition } = useViewTransition();

  if (pageCount <= 1) return null;

  const goTo = (target: number) => {
    const next = Math.min(Math.max(target, 1), pageCount);
    if (next === page) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === 1) {
      params.delete("page");
    } else {
      params.set("page", String(next));
    }
    startFilterTransition(() => router.push(`/tasks?${params.toString()}`, { scroll: false }));
  };

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mt-3 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 sm:flex-row sm:px-6">
      <p>
        Showing <span className="font-medium text-slate-700 dark:text-slate-300">{start}</span>
        {"–"}
        <span className="font-medium text-slate-700 dark:text-slate-300">{end}</span> of{" "}
        <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="px-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          Page {page} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
          className="flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
