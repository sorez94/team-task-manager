"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Task } from "@/lib/generated/prisma/client";
import { TaskModal } from "@/components/tasks/TaskModal";

type TaskModalContextValue = {
  openCreate: () => void;
  openEdit: (task: Task) => void;
};

const TaskModalContext = createContext<TaskModalContextValue | null>(null);

export function TaskModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<Task | null>(null);

  const openCreate = () => {
    setTask(null);
    setOpen(true);
  };

  const openEdit = (task: Task) => {
    setTask(task);
    setOpen(true);
  };

  const close = () => setOpen(false);

  return (
    <TaskModalContext.Provider value={{ openCreate, openEdit }}>
      {children}
      <TaskModal open={open} task={task} onClose={close} />
    </TaskModalContext.Provider>
  );
}

export function useTaskModal() {
  const ctx = useContext(TaskModalContext);
  if (!ctx) throw new Error("useTaskModal must be used within TaskModalProvider");
  return ctx;
}
