import { z } from "zod";

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(120, "Title must be 120 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
  type: z.enum(["TASK", "BUG"]),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  dueDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
      message: "Enter a valid date",
    }),
  assignee: z
    .string()
    .trim()
    .max(80, "Assignee name must be 80 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>;
