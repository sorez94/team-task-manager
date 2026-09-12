import type { Prisma, Priority, Status, TaskArea, TaskType } from "@/lib/generated/prisma/client";
import { prisma } from "./prisma";
import { parseAssignees, startOfToday } from "./utils";

export type DueFilter = "ALL" | "OVERDUE" | "TODAY" | "WEEK" | "NONE";
export type SortField = "dueDate" | "priority" | "createdAt" | "updatedAt" | "title";
export type SortOrder = "asc" | "desc";

// Statuses that mean a task is no longer actively in flight — excluded from
// "overdue" reckoning the same way DONE always was.
const INACTIVE_STATUSES: Status[] = ["DONE", "CANCELLED"];

export type TaskFilters = {
  q?: string;
  type?: TaskType | "ALL";
  area?: TaskArea | "ALL" | "UNSPECIFIED";
  status?: Status | "ALL";
  priority?: Priority | "ALL";
  due?: DueFilter;
  assignee?: string | "ALL";
  sort?: SortField;
  order?: SortOrder;
  // Pagination is opt-in: omit both to get every matching task (e.g. the
  // board view, which lays tasks out by status rather than by page).
  page?: number;
  pageSize?: number;
};

export const DEFAULT_PAGE_SIZE = 10;

const PRIORITY_WEIGHT: Record<Priority, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };

export function buildWhere(filters: TaskFilters): Prisma.TaskWhereInput {
  const conditions: Prisma.TaskWhereInput[] = [];

  if (filters.q) {
    conditions.push({
      OR: [
        { title: { contains: filters.q } },
        { description: { contains: filters.q } },
        { assignees: { contains: filters.q } },
      ],
    });
  }

  if (filters.type && filters.type !== "ALL") {
    conditions.push({ type: filters.type });
  }

  if (filters.area && filters.area !== "ALL") {
    if (filters.area === "UNSPECIFIED") {
      conditions.push({ OR: [{ areas: null }, { areas: "" }] });
    } else {
      // `areas` is a comma-separated list (e.g. "FRONTEND,DESIGN"), so match
      // it as a whole token rather than a plain substring — a `contains`
      // check alone could false-positive if one area name were a substring
      // of another.
      const area = filters.area;
      conditions.push({
        OR: [
          { areas: area },
          { areas: { startsWith: `${area},` } },
          { areas: { endsWith: `,${area}` } },
          { areas: { contains: `,${area},` } },
        ],
      });
    }
  }

  if (filters.assignee && filters.assignee !== "ALL") {
    if (filters.assignee === "UNASSIGNED") {
      conditions.push({ assignees: null });
    } else {
      // `assignees` is a comma-separated list (e.g. "Amelia Chen,Marcus Reid"),
      // so match it as a whole token rather than a plain substring — a
      // `contains` check alone could false-positive if one name were a
      // substring of another.
      const assignee = filters.assignee;
      conditions.push({
        OR: [
          { assignees: assignee },
          { assignees: { startsWith: `${assignee},` } },
          { assignees: { endsWith: `,${assignee}` } },
          { assignees: { contains: `,${assignee},` } },
        ],
      });
    }
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
      conditions.push({ dueDate: { lt: today }, status: { notIn: INACTIVE_STATUSES } });
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
  const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : undefined;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  // Priority is ranked LOW < MEDIUM < HIGH rather than alphabetically, so it
  // can't be handled by a plain Prisma `orderBy` — sort (and, if paginating,
  // slice) in JS instead.
  if (filters.sort === "priority") {
    const tasks = await prisma.task.findMany({ where });
    tasks.sort((a, b) => {
      const diff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      return order === "asc" ? diff : -diff;
    });
    if (!page) return { tasks, total: tasks.length };
    const start = (page - 1) * pageSize;
    return { tasks: tasks.slice(start, start + pageSize), total: tasks.length };
  }

  const sortField = filters.sort ?? "createdAt";
  if (!page) {
    const tasks = await prisma.task.findMany({ where, orderBy: { [sortField]: order } });
    return { tasks, total: tasks.length };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: { [sortField]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.task.count({ where }),
  ]);
  return { tasks, total };
}

export async function getDistinctAssignees() {
  const rows = await prisma.task.findMany({
    where: { assignees: { not: null } },
    select: { assignees: true },
  });
  const names = new Set<string>();
  for (const row of rows) {
    for (const name of parseAssignees(row.assignees)) {
      names.add(name);
    }
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

export async function getDashboardStats() {
  const [total, todo, doing, blocked, done, overdue, dueThisWeek, recent] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: "TODO" } }),
    prisma.task.count({ where: { status: "DOING" } }),
    prisma.task.count({ where: { status: "BLOCKED" } }),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.task.count({
      where: { dueDate: { lt: startOfToday() }, status: { notIn: INACTIVE_STATUSES } },
    }),
    prisma.task.count({
      where: {
        dueDate: {
          gte: startOfToday(),
          lt: new Date(startOfToday().getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        status: { notIn: INACTIVE_STATUSES },
      },
    }),
    prisma.task.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);

  return { total, todo, doing, blocked, done, overdue, dueThisWeek, recent };
}
