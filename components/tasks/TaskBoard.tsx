"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Status, Task } from "@/lib/generated/prisma/client";
import { ClipboardList } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { useTaskModal } from "@/app/providers/TaskModalProvider";
import { useToast } from "@/app/providers/ToastProvider";
import { deleteTask } from "@/app/actions/tasks";
import { STATUS_DOT_CLASS, STATUS_LABEL, STATUS_OPTIONS, cn } from "@/lib/utils";

export function TaskBoard({ tasks, isFiltered }: { tasks: Task[]; isFiltered: boolean }) {
  const router = useRouter();
  const { openEdit, openCreate } = useTaskModal();
  const { showToast } = useToast();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const changeStatus = async (task: Task, status: Status) => {
    if (status === task.status) return;
    setPendingIds((prev) => new Set(prev).add(task.id));
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      showToast("Status updated");
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATUS_OPTIONS.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className="flex flex-col gap-3 rounded-xl bg-slate-100/70 p-3 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 px-1">
                <span className={cn("size-2 rounded-full", STATUS_DOT_CLASS[status])} aria-hidden />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {STATUS_LABEL[status]}
                </h3>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {columnTasks.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                    No tasks
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      pending={pendingIds.has(task.id)}
                      onEdit={() => openEdit(task)}
                      onDelete={() => setDeleteTarget(task)}
                      onStatusChange={(next) => changeStatus(task, next)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
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
