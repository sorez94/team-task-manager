import type { TaskArea } from "@/lib/generated/prisma/client";
import { AREA_BADGE_CLASS, AREA_DOT_CLASS, AREA_LABEL, cn } from "@/lib/utils";

export function AreaBadge({ areas, className }: { areas: TaskArea[]; className?: string }) {
  if (areas.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {areas.map((area) => (
        <span
          key={area}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
            AREA_BADGE_CLASS[area]
          )}
        >
          <span className={cn("size-1.5 rounded-full", AREA_DOT_CLASS[area])} aria-hidden />
          {AREA_LABEL[area]}
        </span>
      ))}
    </div>
  );
}
