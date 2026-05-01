"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function MethodologyPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/5 bg-zinc-900/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-zinc-900/50"
      >
        <span className="text-sm font-medium text-zinc-300">Methodology</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-white/5 px-6 py-4">
          <div className="grid gap-6 text-sm text-zinc-400 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-medium text-zinc-200">Agent GDP</h4>
              <p className="leading-relaxed">
                Estimated monthly economic value created by agent work.
                Calculated as the sum of Agent-Assisted Work Value,
                Agent-Generated Revenue, Agent Service Revenue, and Agent Asset
                Revenue.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium text-zinc-200">Employment</h4>
              <p className="leading-relaxed">
                Percentage of observable digital work signals showing deployed
                agent use. Calculated by dividing deployed agent work signals by
                total relevant digital work signals.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium text-zinc-200">Productivity</h4>
              <p className="leading-relaxed">
                Agent GDP divided by total estimated agent tool spend.
                Represents the economic output multiplier of agent investments.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium text-zinc-200">Data Sources</h4>
              <p className="leading-relaxed">
                Built from public web signals, including job postings, company
                announcements, product launches, industry reports, and pricing
                data. Updated daily via automated research.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
