import type { Prisma, Priority, Status, TaskType } from "@/lib/generated/prisma/client";
import { prisma } from "./prisma";
import { startOfToday } from "./utils";

export type DueFilter = "ALL" | "OVERDUE" | "TODAY" | "WEEK" | "NONE";
export type SortField = "dueDate" | "priority" | "createdAt" | "updatedAt" | "title";
export type SortOrder = "asc" | "desc";

export type TaskFilters = {
  q?: string;
  type?: TaskType | "ALL";
  status?: Status | "ALL";
  priority?: Priority | "ALL";
  due?: DueFilter;
  assignee?: string | "ALL";
  sort?: SortField;
  order?: SortOrder;
};

const PRIORITY_WEIGHT: Record<Priority, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

export function buildWhere(filters: TaskFilters): Prisma.TaskWhereInput {
  const conditions: Prisma.TaskWhereInput[] = [];

  if (filters.q) {
    conditions.push({
      OR: [
        { title: { contains: filters.q } },
        { description: { contains: filters.q } },
        { assignee: { contains: filters.q } },
      ],
    });
  }

  if (filters.type && filters.type !== "ALL") {
    conditions.push({ type: filters.type });
  }

  if (filters.assignee && filters.assignee !== "ALL") {
    conditions.push(
      filters.assignee === "UNASSIGNED" ? { assignee: null } : { assignee: filters.assignee }
    );
  }

  if (filters.status && filters.status !== "ALL") {
    conditions.push({ status: filters.status });
  }

  if (filters.priority && filters.priority !== "ALL") {
    conditions.push({ priority: filters.priority });
  }

  if (filters.due && filters.due !== "ALL") {
    const today = startOfToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    if (filters.due === "OVERDUE") {
      conditions.push({ dueDate: { lt: today }, status: { not: "DONE" } });
    } else if (filters.due === "TODAY") {
      conditions.push({ dueDate: { gte: today, lt: tomorrow } });
    } else if (filters.due === "WEEK") {
      conditions.push({ dueDate: { gte: today, lt: weekEnd } });
    } else if (filters.due === "NONE") {
      conditions.push({ dueDate: null });
    }
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export async function getFilteredTasks(filters: TaskFilters) {
  const where = buildWhere(filters);
  const order = filters.order ?? "asc";

  // Priority is ranked LOW < MEDIUM < HIGH rather than alphabetically, so it
  // can't be handled by a plain Prisma `orderBy` — sort in JS instead.
  if (filters.sort === "priority") {
    const tasks = await prisma.task.findMany({ where });
    tasks.sort((a, b) => {
      const diff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      return order === "asc" ? diff : -diff;
    });
    return tasks;
  }

  const sortField = filters.sort ?? "createdAt";
  return prisma.task.findMany({
    where,
    orderBy: { [sortField]: order },
  });
}

export async function getDistinctAssignees() {
  const rows = await prisma.task.findMany({
    where: { assignee: { not: null } },
    select: { assignee: true },
    distinct: ["assignee"],
  });
  return rows
    .map((r) => r.assignee)
    .filter((a): a is string => Boolean(a))
    .sort((a, b) => a.localeCompare(b));
}

export async function getDashboardStats() {
  const [total, todo, inProgress, done, overdue, dueThisWeek, recent] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: "TODO" } }),
    prisma.task.count({ where: { status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.task.count({
      where: { dueDate: { lt: startOfToday() }, status: { not: "DONE" } },
    }),
    prisma.task.count({
      where: {
        dueDate: {
          gte: startOfToday(),
          lt: new Date(startOfToday().getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        status: { not: "DONE" },
      },
    }),
    prisma.task.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);

  return { total, todo, inProgress, done, overdue, dueThisWeek, recent };
}
