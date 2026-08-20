import type { Priority, Status, TaskType } from "@/lib/generated/prisma/client";
import { FilterBar } from "@/components/tasks/FilterBar";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { getFilteredTasks, type DueFilter, type SortField, type SortOrder } from "@/lib/tasks-query";

export const metadata = {
  title: "Tasks · Task Manager",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const q = first(params.q) ?? "";
  const type = (first(params.type) as TaskType | "ALL" | undefined) ?? "ALL";
  const status = (first(params.status) as Status | "ALL" | undefined) ?? "ALL";
  const priority = (first(params.priority) as Priority | "ALL" | undefined) ?? "ALL";
  const due = (first(params.due) as DueFilter | undefined) ?? "ALL";
  const sort = (first(params.sort) as SortField | undefined) ?? "createdAt";
  const order = (first(params.order) as SortOrder | undefined) ?? "desc";
  const view = first(params.view) === "table" ? "table" : "board";

  const tasks = await getFilteredTasks({ q, type, status, priority, due, sort, order });
  const isFiltered = Boolean(q || type !== "ALL" || status !== "ALL" || priority !== "ALL" || due !== "ALL");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tasks</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          {isFiltered ? " matching your filters" : " total"}
        </p>
      </div>

      <FilterBar view={view} />

      {view === "board" ? (
        <TaskBoard tasks={tasks} isFiltered={isFiltered} />
      ) : (
        <TaskTable tasks={tasks} isFiltered={isFiltered} />
      )}
    </div>
  );
}
