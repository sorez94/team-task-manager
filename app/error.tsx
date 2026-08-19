"use client";

import { useEffect } from "react";
import { AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950">
        <AlertOctagon className="size-6" />
      </div>
      <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Something went wrong
      </h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        An unexpected error occurred while loading this page. You can try again.
      </p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
