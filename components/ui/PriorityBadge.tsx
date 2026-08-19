import type { Priority } from "@/lib/generated/prisma/client";
import { cn, PRIORITY_BADGE_CLASS, PRIORITY_DOT_CLASS, PRIORITY_LABEL } from "@/lib/utils";

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        PRIORITY_BADGE_CLASS[priority],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", PRIORITY_DOT_CLASS[priority])} aria-hidden />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
