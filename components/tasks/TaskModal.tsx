"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Task } from "@/lib/generated/prisma/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label, Input, Textarea, Select, FieldError } from "@/components/ui/Field";
import { createTask, updateTask } from "@/app/actions/tasks";
import { useToast } from "@/app/providers/ToastProvider";
import { PRIORITY_LABEL, PRIORITY_OPTIONS, STATUS_LABEL, STATUS_OPTIONS, toDateInputValue } from "@/lib/utils";
import type { TaskFormErrors, TaskFormValues } from "@/lib/validations";

const EMPTY_FORM: TaskFormValues = {
  title: "",
  description: "",
  status: "TODO",
  priority: "MEDIUM",
  dueDate: "",
  assignee: "",
};

function toFormValues(task: Task | null): TaskFormValues {
  if (!task) return EMPTY_FORM;
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    dueDate: toDateInputValue(task.dueDate),
    assignee: task.assignee ?? "",
  };
}

export function TaskModal({
  open,
  task,
  onClose,
}: {
  open: boolean;
  task: Task | null;
  onClose: () => void;
}) {
  const isEditing = Boolean(task);
  const [values, setValues] = useState<TaskFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  // Reset the form whenever the modal opens for a (possibly different) task,
  // including reopening for the *same* task after a cancelled edit.
  // Adjusting state during render (React's documented pattern for this)
  // instead of in an effect avoids an extra render pass.
  const taskKey = task?.id ?? "new";
  const [renderedAs, setRenderedAs] = useState<{ open: boolean; taskKey: string } | null>(null);
  if (open && (!renderedAs?.open || renderedAs.taskKey !== taskKey)) {
    setRenderedAs({ open: true, taskKey });
    setValues(toFormValues(task));
    setErrors({});
    setFormError(null);
  } else if (!open && renderedAs?.open) {
    setRenderedAs({ open: false, taskKey });
  }

  const update = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);

    const result = isEditing && task ? await updateTask(task.id, values) : await createTask(values);

    if (!result.success) {
      setErrors(result.errors);
      setFormError(result.message ?? null);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    showToast(isEditing ? "Task updated" : "Task created");
    router.refresh();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit task" : "New task"}
      description={isEditing ? "Update the details below." : "Fill in the details for the new task."}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            autoFocus
            value={values.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Draft Q3 roadmap"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
          <FieldError>{errors.title}</FieldError>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Optional details about this task"
            aria-invalid={Boolean(errors.description)}
          />
          <FieldError>{errors.description}</FieldError>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={values.status}
              onChange={(e) => update("status", e.target.value as TaskFormValues["status"])}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              id="priority"
              value={values.priority}
              onChange={(e) => update("priority", e.target.value as TaskFormValues["priority"])}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              type="date"
              value={values.dueDate}
              onChange={(e) => update("dueDate", e.target.value)}
              aria-invalid={Boolean(errors.dueDate)}
            />
            <FieldError>{errors.dueDate}</FieldError>
          </div>
          <div>
            <Label htmlFor="assignee">Assignee</Label>
            <Input
              id="assignee"
              value={values.assignee}
              onChange={(e) => update("assignee", e.target.value)}
              placeholder="Team member name"
              aria-invalid={Boolean(errors.assignee)}
            />
            <FieldError>{errors.assignee}</FieldError>
          </div>
        </div>

        {formError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditing ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
