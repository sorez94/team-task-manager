"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/components/ui/Field";

/** A multi-value tag input for free-text assignee names — type a name, press Enter/comma to add it as a chip. */
export function AssigneesInput({
  id,
  value,
  onChange,
  suggestions,
  placeholder = "Add a name and press Enter",
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  "aria-invalid"?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  const commit = (raw: string) => {
    const name = raw.trim();
    setDraft("");
    if (!name) return;
    if (value.some((v) => v.toLowerCase() === name.toLowerCase())) return;
    onChange([...value, name]);
  };

  const remove = (name: string) => onChange(value.filter((v) => v !== name));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div
      className={cn(
        fieldClass,
        "flex flex-wrap items-center gap-1.5 py-1.5 has-[input:focus]:ring-2 has-[input:focus]:ring-indigo-600 dark:has-[input:focus]:ring-indigo-500"
      )}
    >
      {value.map((name) => (
        <span
          key={name}
          className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pl-2.5 pr-1 text-xs font-medium whitespace-nowrap text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
        >
          {name}
          <button
            type="button"
            onClick={() => remove(name)}
            aria-label={`Remove ${name}`}
            className="rounded-full p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-500/30 dark:hover:text-indigo-200"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        list={suggestions?.length ? listId : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        placeholder={value.length === 0 ? placeholder : ""}
        aria-invalid={ariaInvalid}
        className="min-w-[8rem] flex-1 border-0 bg-transparent p-0.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
      {suggestions && suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
}
