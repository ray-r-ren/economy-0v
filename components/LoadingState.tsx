"use client";

import { Spinner } from "@/components/ui/spinner";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Loading economy data...",
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <Spinner className="h-8 w-8 text-cyan-400" />
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}
