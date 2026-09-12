import { Timer } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";

export function TimeSpentBadge({
  minutes,
  className,
}: {
  minutes: number | null | undefined;
  className?: string;
}) {
  const formatted = formatDuration(minutes);
  if (!formatted) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400",
        className
      )}
    >
      <Timer className="size-3.5" aria-hidden />
      {formatted}
    </span>
  );
}
