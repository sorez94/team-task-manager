import type { Status } from "@/lib/generated/prisma/client";
import { CalendarClock, CalendarX2 } from "lucide-react";
import { cn, formatDate, isDueSoon, isOverdue } from "@/lib/utils";

export function DueDateBadge({
  dueDate,
  status,
  className,
}: {
  dueDate: Date | string | null;
  status: Status;
  className?: string;
}) {
  if (!dueDate) {
    return <span className={cn("text-sm text-slate-400 dark:text-slate-500", className)}>No due date</span>;
  }

  const overdue = isOverdue(dueDate, status);
  const dueSoon = isDueSoon(dueDate, status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-medium",
        overdue
          ? "text-rose-600 dark:text-rose-400"
          : dueSoon
            ? "text-amber-600 dark:text-amber-400"
            : "text-slate-600 dark:text-slate-400",
        className
      )}
    >
      {overdue ? (
        <CalendarX2 className="size-3.5" aria-hidden />
      ) : (
        <CalendarClock className="size-3.5" aria-hidden />
      )}
      {formatDate(dueDate)}
      {overdue && <span className="text-xs font-semibold uppercase">Overdue</span>}
    </span>
  );
}
