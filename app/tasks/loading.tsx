import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <Skeleton className="h-10 w-full max-w-3xl" />
      <TableSkeleton />
    </div>
  );
}
