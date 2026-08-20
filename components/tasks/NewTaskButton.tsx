"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTaskModal } from "@/app/providers/TaskModalProvider";

export function NewTaskButton() {
  const { openCreate } = useTaskModal();

  return (
    <Button onClick={openCreate} size="sm" aria-label="New task">
      <Plus className="size-4" />
      New Task
    </Button>
  );
}
