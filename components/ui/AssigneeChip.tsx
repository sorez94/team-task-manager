import { cn, initials } from "@/lib/utils";

const SIZE_CLASS = {
  sm: { avatar: "size-5 text-[9px]", text: "text-xs", gap: "gap-1.5" },
  md: { avatar: "size-6 text-[10px]", text: "text-sm", gap: "gap-2" },
};

export function AssigneeChip({
  assignee,
  size = "md",
  className,
}: {
  assignee: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}) {
  const { avatar, text, gap } = SIZE_CLASS[size];

  if (!assignee) {
    return <span className={cn(text, "text-slate-400 dark:text-slate-500", className)}>Unassigned</span>;
  }

  return (
    <div className={cn("flex items-center overflow-hidden", gap, className)}>
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
  );
}
