"use client";

import { FileSpreadsheet } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Downloads the currently filtered/sorted task list as an .xlsx file.
// A plain anchor to the export route is enough — no client-side state
// needed, and it works even if JS is slow to hydrate.
export function ExportButton() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  // These only affect how the list is displayed, not which tasks match —
  // the export route doesn't understand them anyway.
  params.delete("view");
  params.delete("page");
  const href = `/api/tasks/export${params.size > 0 ? `?${params.toString()}` : ""}`;

  return (
    <a
      href={href}
      aria-label="Export tasks to Excel"
      className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
    >
      <FileSpreadsheet className="size-3.5" />
      Export to Excel
    </a>
  );
}
