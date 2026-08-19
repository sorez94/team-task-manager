import { ListTodo, Loader, CheckCircle2, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentTasks } from "@/components/dashboard/RecentTasks";
import { getDashboardStats } from "@/lib/tasks-query";

// Render per-request rather than prerendering at build time: the overdue
// count depends on "today", and a build-time snapshot would need the
// database reachable during the build itself (a footgun on Vercel, where
// the DB/table might not exist yet on a first deploy).
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          An overview of what&apos;s on your plate.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total tasks" value={stats.total} icon={ListTodo} accent="slate" />
        <StatCard label="To do" value={stats.todo} icon={ListTodo} accent="slate" />
        <StatCard label="In progress" value={stats.inProgress} icon={Loader} accent="blue" />
        <StatCard label="Completed" value={stats.done} icon={CheckCircle2} accent="emerald" />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          accent="rose"
          hint={stats.dueThisWeek > 0 ? `${stats.dueThisWeek} due within 7 days` : undefined}
        />
      </div>

      <RecentTasks tasks={stats.recent} />
    </div>
  );
}
