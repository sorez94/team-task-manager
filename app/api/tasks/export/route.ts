import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getFilteredTasks, type DueFilter, type SortField, type SortOrder } from "@/lib/tasks-query";
import {
  AREA_LABEL,
  formatDate,
  formatDateTime,
  formatDuration,
  parseAreas,
  PRIORITY_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
} from "@/lib/utils";
import type { Priority, Status, TaskArea, TaskType } from "@/lib/generated/prisma/client";

// GET /api/tasks/export — download the current filtered/sorted task list as
// an .xlsx workbook. Accepts the same filter/sort query params as
// GET /api/tasks (see lib/tasks-query.ts); pagination params are ignored —
// the export always contains every matching task, not just one page of it.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const { tasks } = await getFilteredTasks({
    q: params.get("q") ?? undefined,
    type: (params.get("type") as TaskType | "ALL" | null) ?? "ALL",
    area: (params.get("area") as TaskArea | "ALL" | "UNSPECIFIED" | null) ?? "ALL",
    status: (params.get("status") as Status | "ALL" | null) ?? "ALL",
    priority: (params.get("priority") as Priority | "ALL" | null) ?? "ALL",
    due: (params.get("due") as DueFilter | null) ?? "ALL",
    assignee: params.get("assignee") ?? "ALL",
    sort: (params.get("sort") as SortField | null) ?? "createdAt",
    order: (params.get("order") as SortOrder | null) ?? "desc",
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Task Manager";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Tasks");
  sheet.columns = [
    { header: "Title", key: "title", width: 42 },
    { header: "Description", key: "description", width: 50 },
    { header: "Type", key: "type", width: 10 },
    { header: "Areas", key: "areas", width: 26 },
    { header: "Status", key: "status", width: 12 },
    { header: "Priority", key: "priority", width: 12 },
    { header: "Due Date", key: "dueDate", width: 14 },
    { header: "Assignee", key: "assignee", width: 20 },
    { header: "Time Spent", key: "timeSpent", width: 12 },
    { header: "Created At", key: "createdAt", width: 20 },
    { header: "Updated At", key: "updatedAt", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };

  for (const task of tasks) {
    sheet.addRow({
      title: task.title,
      description: task.description ?? "",
      type: TYPE_LABEL[task.type],
      areas: parseAreas(task.areas)
        .map((area) => AREA_LABEL[area])
        .join(", "),
      status: STATUS_LABEL[task.status],
      priority: PRIORITY_LABEL[task.priority],
      dueDate: formatDate(task.dueDate) ?? "",
      assignee: task.assignee ?? "",
      timeSpent: formatDuration(task.timeSpentMinutes) ?? "",
      createdAt: formatDateTime(task.createdAt) ?? "",
      updatedAt: formatDateTime(task.updatedAt) ?? "",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `tasks-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
