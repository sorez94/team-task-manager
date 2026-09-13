import { redirect } from "next/navigation";
import type { Priority, Status, TaskArea, TaskType } from "@/lib/generated/prisma/client";
import { FilterBar } from "@/components/tasks/FilterBar";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { TasksViewContent, ViewTransitionProvider } from "@/components/tasks/ViewTransition";
import { Pagination } from "@/components/tasks/Pagination";
import {
  DEFAULT_PAGE_SIZE,
  getDistinctAssignees,
  getFilteredTasks,
  type DueFilter,
  type SortField,
  type SortOrder,
} from "@/lib/tasks-query";

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
  const area = (first(params.area) as TaskArea | "ALL" | "UNSPECIFIED" | undefined) ?? "ALL";
  const status = (first(params.status) as Status | "ALL" | undefined) ?? "ALL";
  const priority = (first(params.priority) as Priority | "ALL" | undefined) ?? "ALL";
  const due = (first(params.due) as DueFilter | undefined) ?? "ALL";
  const assignee = first(params.assignee) ?? "ALL";
  const sort = (first(params.sort) as SortField | undefined) ?? "createdAt";
  const order = (first(params.order) as SortOrder | undefined) ?? "desc";
  const view = first(params.view) === "table" ? "table" : "board";
  // Pagination only applies to the table view — the board lays every
  // matching task out by status column, so it always fetches the full set.
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [{ tasks, total }, assignees] = await Promise.all([
    getFilteredTasks({
      q,
      type,
      area,
      status,
      priority,
      due,
      assignee,
      sort,
      order,
      ...(view === "table" ? { page, pageSize: DEFAULT_PAGE_SIZE } : {}),
    }),
    getDistinctAssignees(),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
  // A bookmarked or hand-edited URL can point past the last page once
  // filters shrink the result set — send it back to the last valid page
  // instead of rendering an empty table with a misleading "no tasks" state.
  if (view === "table" && page > pageCount && total > 0) {
    const redirectParams = new URLSearchParams(
      Object.entries(params).flatMap(([key, value]) =>
        value === undefined ? [] : (Array.isArray(value) ? value : [value]).map((v) => [key, v])
      )
    );
    if (pageCount === 1) {
      redirectParams.delete("page");
    } else {
      redirectParams.set("page", String(pageCount));
    }
    redirect(`/tasks?${redirectParams.toString()}`);
  }
  const isFiltered = Boolean(
    q ||
      type !== "ALL" ||
      area !== "ALL" ||
      status !== "ALL" ||
      priority !== "ALL" ||
      due !== "ALL" ||
      assignee !== "ALL"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {total} {total === 1 ? "task" : "tasks"}
            {isFiltered ? " matching your filters" : " total"}
          </p>
        </div>
        <NewTaskButton />
      </div>

      <ViewTransitionProvider>
        <FilterBar view={view} assignees={assignees} />

        <TasksViewContent view={view}>
          {view === "board" ? (
            <>
              {/* Board view needs room for status columns, so it's desktop-only;
                  mobile always falls back to the table regardless of the `view`
                  param (e.g. a bookmarked or shared board link). */}
              <div className="hidden sm:block">
                <TaskBoard tasks={tasks} isFiltered={isFiltered} />
              </div>
              <div className="sm:hidden">
                <TaskTable tasks={tasks} isFiltered={isFiltered} />
              </div>
            </>
          ) : (
            <>
              <TaskTable tasks={tasks} isFiltered={isFiltered} />
              {tasks.length > 0 && (
                <Pagination page={page} pageCount={pageCount} total={total} pageSize={DEFAULT_PAGE_SIZE} />
              )}
            </>
          )}
        </TasksViewContent>
      </ViewTransitionProvider>
    </div>
  );
}
