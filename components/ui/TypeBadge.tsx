import type { TaskType } from "@/lib/generated/prisma/client";
import { cn, TYPE_BADGE_CLASS, TYPE_DOT_CLASS, TYPE_LABEL } from "@/lib/utils";

export function TypeBadge({ type, className }: { type: TaskType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        TYPE_BADGE_CLASS[type],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", TYPE_DOT_CLASS[type])} aria-hidden />
      {TYPE_LABEL[type]}
    </span>
  );
}
