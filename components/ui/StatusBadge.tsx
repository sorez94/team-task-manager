import type { Status } from "@/lib/generated/prisma/client";
import { cn, STATUS_BADGE_CLASS, STATUS_DOT_CLASS, STATUS_LABEL } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        STATUS_BADGE_CLASS[status],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASS[status])} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
