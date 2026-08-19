"use client";

import type { Status, Task } from "@/lib/generated/prisma/client";
import { Pencil, Trash2 } from "lucide-react";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { Select } from "@/components/ui/Field";
import { STATUS_LABEL, STATUS_OPTIONS, cn, initials } from "@/lib/utils";

export function TaskCard({
  task,
  pending,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  pending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: Status) => void;
}) {
  return (
    <div
      className={cn(
        "group rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm transition-opacity dark:border-slate-800 dark:bg-slate-900",
        pending && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onEdit}
          className="text-left text-sm font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
        >
          {task.title}
        </button>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            aria-label={`Edit ${task.title}`}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            onClick={onDelete}
            aria-label={`Delete ${task.title}`}
            className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <DueDateBadge dueDate={task.dueDate} status={task.status} className="text-xs" />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        {task.assignee ? (
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              {initials(task.assignee)}
            </span>
            <span className="truncate text-xs text-slate-600 dark:text-slate-300">{task.assignee}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">Unassigned</span>
        )}
        <Select
          aria-label={`Change status for ${task.title}`}
          value={task.status}
          disabled={pending}
          onChange={(e) => onStatusChange(e.target.value as Status)}
          className="w-auto py-1 text-xs"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
