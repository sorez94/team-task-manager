"use client";

import Link from "next/link";
import type { Task } from "@/lib/generated/prisma/client";
import { ClipboardList, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { AssigneeChip } from "@/components/ui/AssigneeChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useTaskModal } from "@/app/providers/TaskModalProvider";
import { cn } from "@/lib/utils";

export function RecentTasks({ tasks }: { tasks: Task[] }) {
  const { openEdit, openCreate } = useTaskModal();

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recently updated</h2>
        <Link
          href="/tasks"
          className="flex items-center gap-0.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          View all
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<ClipboardList className="size-6" />}
            title="No tasks yet"
            description="Create your first task to get started."
            action={
              <Button onClick={openCreate} size="sm">
                New Task
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                onClick={() => openEdit(task)}
                className="flex w-full flex-col gap-2 px-5 py-4 text-left transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-slate-800/50"
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate text-sm font-medium text-slate-900 dark:text-slate-100",
                      task.status === "DONE" && "text-slate-400 line-through dark:text-slate-500"
                    )}
                  >
                    {task.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    <AssigneeChip assignee={task.assignee} size="sm" className="min-w-0 max-w-[10rem]" />
                  </div>
                </div>
                <DueDateBadge dueDate={task.dueDate} status={task.status} className="shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
