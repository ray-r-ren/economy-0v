"use client";

import { cn } from "@/lib/utils";

interface MetricValueProps {
  value: string;
  variant?: "default" | "highlight" | "muted";
  className?: string;
}

export function MetricValue({
  value,
  variant = "default",
  className,
}: MetricValueProps) {
  const isNoData = value === "No Data Yet";

  return (
    <span
      className={cn(
        "whitespace-nowrap",
        isNoData && "text-zinc-600 italic",
        !isNoData && variant === "default" && "text-zinc-200",
        !isNoData && variant === "highlight" && "text-emerald-400 font-medium",
        !isNoData && variant === "muted" && "text-zinc-400",
        className
      )}
    >
      {value}
    </span>
  );
}

interface FunctionTagsProps {
  functions: string[];
}

export function FunctionTags({ functions }: FunctionTagsProps) {
  if (!functions || functions.length === 0) {
    return <span className="text-zinc-600 italic">No Data Yet</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {functions.slice(0, 3).map((fn) => (
        <span
          key={fn}
          className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
        >
          {fn}
        </span>
      ))}
    </div>
  );
}
