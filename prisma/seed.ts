import {
  PrismaClient,
  type Priority,
  type Status,
  type TaskArea,
  type TaskType,
} from "../lib/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { serializeAreas, serializeAssignees } from "../lib/utils";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number) {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

const TASKS: {
  title: string;
  description: string;
  type: TaskType;
  areas: TaskArea[];
  status: Status;
  priority: Priority;
  dueDate: Date | null;
  assignees: string[];
}[] = [
  {
    title: "Design new landing page hero",
    description: "Explore three directions for the homepage hero section and present to the team.",
    type: "TASK",
    areas: ["FRONTEND", "DESIGN"],
    status: "DOING",
    priority: "HIGH",
    dueDate: daysFromNow(2),
    assignees: ["Amelia Chen", "Sofia Ibrahim"],
  },
  {
    title: "Fix checkout flow overdue bug",
    description: "Users report the payment step silently fails on Safari. Needs urgent triage.",
    type: "BUG",
    areas: ["FRONTEND"],
    status: "TODO",
    priority: "CRITICAL",
    dueDate: daysFromNow(-3),
    assignees: ["Marcus Reid"],
  },
  {
    title: "Write Q3 roadmap doc",
    description: "Summarize the planned initiatives for Q3 and circulate for feedback.",
    type: "TASK",
    areas: ["PRODUCT"],
    status: "BACKLOG",
    priority: "MEDIUM",
    dueDate: daysFromNow(5),
    assignees: ["Priya Nair"],
  },
  {
    title: "Migrate CI to new runners",
    description: null as unknown as string,
    type: "TASK",
    areas: ["BACKEND"],
    status: "DONE",
    priority: "LOW",
    dueDate: daysFromNow(-10),
    assignees: ["Marcus Reid"],
  },
  {
    title: "Set up product analytics dashboard",
    description: "Wire up event tracking for the new onboarding funnel.",
    type: "TASK",
    areas: ["BACKEND", "PRODUCT"],
    status: "DOING",
    priority: "MEDIUM",
    dueDate: daysFromNow(1),
    assignees: ["Sofia Ibrahim", "Priya Nair"],
  },
  {
    title: "Review vendor security questionnaire",
    description: "Legal needs this back by end of week for the new integration partner.",
    type: "TASK",
    areas: [],
    status: "BLOCKED",
    priority: "HIGH",
    dueDate: daysFromNow(-1),
    assignees: ["Amelia Chen"],
  },
  {
    title: "Refactor task list pagination",
    description: "Current implementation re-fetches on every keystroke; needs debouncing.",
    type: "BUG",
    areas: ["FRONTEND"],
    status: "TODO",
    priority: "LOW",
    dueDate: null,
    assignees: [],
  },
  {
    title: "Plan team offsite",
    description: "Pick a date, venue, and rough agenda for the fall offsite.",
    type: "TASK",
    areas: [],
    status: "BACKLOG",
    priority: "LOW",
    dueDate: daysFromNow(21),
    assignees: ["Priya Nair", "Marcus Reid", "Amelia Chen"],
  },
  {
    title: "Upgrade Next.js to latest major",
    description: "Test the app router changes in a branch before rolling out.",
    type: "TASK",
    areas: ["BACKEND"],
    status: "DONE",
    priority: "MEDIUM",
    dueDate: daysFromNow(-14),
    assignees: ["Sofia Ibrahim"],
  },
  {
    title: "Customer interview synthesis",
    description: "Pull themes from last month's 12 customer interviews into a shared doc.",
    type: "TASK",
    areas: ["PRODUCT"],
    status: "DOING",
    priority: "MEDIUM",
    dueDate: daysFromNow(4),
    assignees: [],
  },
  {
    title: "Audit accessibility on task board",
    description: "Check keyboard navigation and screen reader labels across the kanban view.",
    type: "BUG",
    areas: ["FRONTEND", "DESIGN"],
    status: "TODO",
    priority: "MEDIUM",
    dueDate: daysFromNow(7),
    assignees: ["Amelia Chen"],
  },
  {
    title: "Archive stale feature flags",
    description: null as unknown as string,
    type: "TASK",
    areas: ["BACKEND"],
    status: "CANCELLED",
    priority: "LOW",
    dueDate: daysFromNow(-30),
    assignees: ["Marcus Reid"],
  },
];

async function main() {
  console.log("Seeding database…");
  await prisma.task.deleteMany();
  for (const { areas, assignees, ...task } of TASKS) {
    await prisma.task.create({
      data: { ...task, areas: serializeAreas(areas), assignees: serializeAssignees(assignees) },
    });
  }
  console.log(`Seeded ${TASKS.length} tasks.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
