"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface ColumnInfoTooltipProps {
  label: string;
  caption: string;
}

export function ColumnInfoTooltip({ label, caption }: ColumnInfoTooltipProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={`Info about ${label}`}
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs bg-zinc-800 text-zinc-200 border-zinc-700"
          >
            <p className="text-xs leading-relaxed">{caption}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
