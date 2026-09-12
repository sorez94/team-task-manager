import { cn } from "@/lib/utils";

/** A row of toggleable pill buttons for a small multi-select — e.g. task area. */
export function CheckboxChips<T extends string>({
  options,
  labels,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T[];
  onChange: (next: T[]) => void;
  ariaLabel: string;
}) {
  const toggle = (option: T) => {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  };

  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(option)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
              active
                ? "bg-indigo-600 text-white ring-indigo-600"
                : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
            )}
          >
            {labels[option]}
          </button>
        );
      })}
    </div>
  );
}
