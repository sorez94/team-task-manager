"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type Status } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { taskFormSchema, type TaskFormValues, type TaskFormErrors } from "@/lib/validations";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; errors: TaskFormErrors; message?: string };

function revalidateTaskPaths() {
  revalidatePath("/");
  revalidatePath("/tasks");
}

function toZodErrors(error: import("zod").ZodError<TaskFormValues>): TaskFormErrors {
  const errors: TaskFormErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof TaskFormValues | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export async function createTask(values: TaskFormValues): Promise<ActionResult<{ id: string }>> {
  const parsed = taskFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, errors: toZodErrors(parsed.error) };
  }

  const { title, description, type, status, priority, dueDate, assignee } = parsed.data;

  try {
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
    revalidateTaskPaths();
    return { success: true, data: { id: task.id } };
  } catch {
    return { success: false, errors: {}, message: "Could not create the task. Please try again." };
  }
}

export async function updateTask(
  id: string,
  values: TaskFormValues
): Promise<ActionResult<{ id: string }>> {
  const parsed = taskFormSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, errors: toZodErrors(parsed.error) };
  }

  const { title, description, type, status, priority, dueDate, assignee } = parsed.data;

  try {
    await prisma.task.update({
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
    return { success: true, data: { id } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, errors: {}, message: "This task no longer exists." };
    }
    return { success: false, errors: {}, message: "Could not update the task. Please try again." };
  }
}

export async function deleteTask(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.task.delete({ where: { id } });
    revalidateTaskPaths();
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "This task no longer exists." };
    }
    return { success: false, message: "Could not delete the task. Please try again." };
  }
}

export async function setTaskStatus(
  id: string,
  status: Status
): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.task.update({ where: { id }, data: { status } });
    revalidateTaskPaths();
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "This task no longer exists." };
    }
    return { success: false, message: "Could not update the task. Please try again." };
  }
}
