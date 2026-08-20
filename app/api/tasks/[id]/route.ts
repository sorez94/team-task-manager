import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma, type Status } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { taskFormSchema } from "@/lib/validations";

const STATUS_VALUES: Status[] = ["TODO", "IN_PROGRESS", "DONE"];

function revalidateTaskPaths() {
  revalidatePath("/");
  revalidatePath("/tasks");
}

// GET /api/tasks/:id
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ task });
}

// PATCH /api/tasks/:id — full update (validated against the task form schema)
// or a quick partial status change, e.g. { "status": "DONE" }.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const isQuickStatusUpdate =
    body !== null &&
    typeof body === "object" &&
    Object.keys(body).length === 1 &&
    "status" in body;

  try {
    if (isQuickStatusUpdate) {
      const status = (body as { status: unknown }).status;
      if (typeof status !== "string" || !STATUS_VALUES.includes(status as Status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 422 });
      }
      const task = await prisma.task.update({ where: { id }, data: { status: status as Status } });
      revalidateTaskPaths();
      return NextResponse.json({ task });
    }

    const parsed = taskFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { title, description, type, status, priority, dueDate, assignee } = parsed.data;
    const task = await prisma.task.update({
      where: { id },
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
    revalidateTaskPaths();
    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/tasks/:id
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.task.delete({ where: { id } });
    revalidateTaskPaths();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
