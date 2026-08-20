import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getFilteredTasks, type DueFilter, type SortField, type SortOrder } from "@/lib/tasks-query";
import { taskFormSchema } from "@/lib/validations";
import type { Priority, Status, TaskType } from "@/lib/generated/prisma/client";

// GET /api/tasks — list tasks, with optional filtering/search/sort query params.
// Example: /api/tasks?status=TODO&priority=HIGH&q=launch&sort=dueDate&order=asc
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    const tasks = await getFilteredTasks({
      q: params.get("q") ?? undefined,
      type: (params.get("type") as TaskType | "ALL" | null) ?? "ALL",
      status: (params.get("status") as Status | "ALL" | null) ?? "ALL",
      priority: (params.get("priority") as Priority | "ALL" | null) ?? "ALL",
      due: (params.get("due") as DueFilter | null) ?? "ALL",
      sort: (params.get("sort") as SortField | null) ?? "createdAt",
      order: (params.get("order") as SortOrder | null) ?? "desc",
    });
    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

// POST /api/tasks — create a task from a JSON body.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = taskFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { title, description, type, status, priority, dueDate, assignee } = parsed.data;

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      type,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignee: assignee || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/tasks");

  return NextResponse.json({ task }, { status: 201 });
}
