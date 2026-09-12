import { cn, initials } from "@/lib/utils";

const SIZE_CLASS = {
  sm: { avatar: "size-5 text-[9px]", text: "text-xs", gap: "gap-1.5" },
  md: { avatar: "size-6 text-[10px]", text: "text-sm", gap: "gap-2" },
};

export function AssigneeChip({
  assignees,
  size = "md",
  className,
  max = 3,
}: {
  assignees: string[] | null | undefined;
  size?: "sm" | "md";
  className?: string;
  /** Show at most this many names before collapsing the rest into a "+N" badge. */
  max?: number;
}) {
  const list = assignees ?? [];
  const { avatar, text, gap } = SIZE_CLASS[size];

  if (list.length === 0) {
    return <span className={cn(text, "text-slate-400 dark:text-slate-500", className)}>Unassigned</span>;
  }

  const visible = list.slice(0, max);
  const overflow = list.length - visible.length;

  return (
    <div className={cn("flex flex-wrap items-center", gap, className)}>
      {visible.map((assignee) => (
        <div key={assignee} className={cn("flex min-w-0 items-center overflow-hidden", gap)}>
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
              avatar
            )}
          >
            {initials(assignee)}
          </span>
          <span className={cn("truncate text-slate-600 dark:text-slate-300", text)}>{assignee}</span>
        </div>
      ))}
      {overflow > 0 && (
        <span className={cn(text, "shrink-0 text-slate-400 dark:text-slate-500")}>+{overflow}</span>
      )}
    </div>
  );
}
