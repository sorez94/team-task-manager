"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import type { Status } from "@/lib/generated/prisma/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn, STATUS_DOT_CLASS, STATUS_LABEL, STATUS_OPTIONS } from "@/lib/utils";

export function BoardColumnSettings({
  visible,
  onToggle,
  onReset,
}: {
  visible: Status[];
  onToggle: (status: Status) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hiddenCount = STATUS_OPTIONS.length - visible.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
      >
        <Settings2 className="size-3.5" />
        Columns
        {hiddenCount > 0 && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {hiddenCount} hidden
          </span>
        )}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Board columns"
        description="Choose which statuses show up here. Saved on this device only — it won't change what anyone else sees."
        size="sm"
      >
        <div className="space-y-1">
          {STATUS_OPTIONS.map((status) => {
            const checked = visible.includes(status);
            return (
              <label
                key={status}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(status)}
                  className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-600 dark:bg-slate-800"
                />
                <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASS[status])} aria-hidden />
                <span className="text-sm text-slate-700 dark:text-slate-300">{STATUS_LABEL[status]}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Show all
          </button>
          <Button size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </Modal>
    </>
  );
}
