"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Task } from "@/lib/generated/prisma/client";
import { ClipboardList, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { TypeBadge } from "@/components/ui/TypeBadge";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { AssigneeChip } from "@/components/ui/AssigneeChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { useTaskModal } from "@/app/providers/TaskModalProvider";
import { useToast } from "@/app/providers/ToastProvider";
import { deleteTask } from "@/app/actions/tasks";
import { cn } from "@/lib/utils";

export function TaskTable({ tasks, isFiltered }: { tasks: Task[]; isFiltered: boolean }) {
  const router = useRouter();
  const { openEdit, openCreate } = useTaskModal();
  const { showToast } = useToast();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const toggleComplete = async (task: Task) => {
    setPendingIds((prev) => new Set(prev).add(task.id));
    const nextStatus = task.status === "DONE" ? "TODO" : "DONE";
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      showToast(nextStatus === "DONE" ? "Marked as complete" : "Marked as incomplete");
      router.refresh();
    } catch {
      showToast("Could not update the task", "error");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteTask(deleteTarget.id);
    if (result.success) {
      showToast("Task deleted");
      router.refresh();
    } else {
      showToast(result.message ?? "Could not delete the task", "error");
    }
    setDeleteTarget(null);
  };

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList className="size-6" />}
        title={isFiltered ? "No tasks match your filters" : "No tasks yet"}
        description={
          isFiltered
            ? "Try adjusting your search or filters to find what you're looking for."
            : "Create your first task to get started."
        }
        action={
          !isFiltered && (
            <Button onClick={openCreate} size="sm">
              New Task
            </Button>
          )
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              <tr>
                <th className="w-10 px-4 py-3 sm:px-6" />
                <th className="px-3 py-3 font-medium">Task</th>
                <th className="hidden px-3 py-3 font-medium sm:table-cell">Type</th>
                <th className="hidden px-3 py-3 font-medium sm:table-cell">Status</th>
                <th className="hidden px-3 py-3 font-medium md:table-cell">Priority</th>
                <th className="hidden px-3 py-3 font-medium lg:table-cell">Assignee</th>
                <th className="hidden px-3 py-3 font-medium xl:table-cell">Due date</th>
                <th className="w-20 px-3 py-3 font-medium sm:px-6" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {tasks.map((task) => {
                const pending = pendingIds.has(task.id);
                const done = task.status === "DONE";
                return (
                  <tr
                    key={task.id}
                    className={cn(
                      "transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      pending && "opacity-60"
                    )}
                  >
                    <td className="px-4 py-4 sm:px-6">
                      <input
                        type="checkbox"
                        checked={done}
                        disabled={pending}
                        onChange={() => toggleComplete(task)}
                        aria-label={done ? "Mark as incomplete" : "Mark as complete"}
                        className="size-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-600 dark:bg-slate-800"
                      />
                    </td>
                    <td className="max-w-xs px-3 py-4">
                      <button
                        onClick={() => openEdit(task)}
                        className={cn(
                          "block truncate text-left font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400",
                          done && "text-slate-400 line-through dark:text-slate-500"
                        )}
                      >
                        {task.title}
                      </button>
                      {task.description && (
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 sm:hidden">
                        <TypeBadge type={task.type} />
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <div className="mt-1.5 lg:hidden">
                        <AssigneeChip assignee={task.assignee} size="sm" />
                      </div>
                    </td>
                    <td className="hidden px-3 py-4 sm:table-cell">
                      <TypeBadge type={task.type} />
                    </td>
                    <td className="hidden px-3 py-4 sm:table-cell">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="hidden px-3 py-4 md:table-cell">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="hidden px-3 py-4 lg:table-cell">
                      <AssigneeChip assignee={task.assignee} />
                    </td>
                    <td className="hidden px-3 py-4 xl:table-cell">
                      <DueDateBadge dueDate={task.dueDate} status={task.status} />
                    </td>
                    <td className="px-3 py-4 sm:px-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(task)}
                          aria-label={`Edit ${task.title}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(task)}
                          aria-label={`Delete ${task.title}`}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete task?"
        description={`"${deleteTarget?.title}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
      />
    </>
  );
}
