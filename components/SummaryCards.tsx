"use client";

import type { EconomySummary } from "@/lib/types";
import {
  formatCompactUSD,
  formatMonthlyUSD,
  formatMultiplier,
  formatDate,
} from "@/lib/formatters";
import {
  Globe,
  Receipt,
  TrendingUp,
  Gauge,
  MapPin,
  Clock,
} from "lucide-react";

interface SummaryCardsProps {
  summary: EconomySummary | null;
  isLoading: boolean;
}

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function SummaryCard({ label, value, icon, highlight }: SummaryCardProps) {
  const isNoData = value === "No Data Yet";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-zinc-900/50 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-zinc-500">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div
        className={`text-xl font-semibold sm:text-2xl ${
          isNoData
            ? "text-zinc-600 italic text-base"
            : highlight
              ? "text-emerald-400"
              : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function SummaryCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-zinc-900/50 p-4">
      <div className="h-4 w-24 animate-pulse rounded bg-zinc-800" />
      <div className="h-7 w-32 animate-pulse rounded bg-zinc-800" />
    </div>
  );
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SummaryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <SummaryCard
        label="Global Agent GDP"
        value={formatCompactUSD(summary?.global_agent_gdp_usd_month)}
        icon={<Globe className="h-4 w-4" />}
        highlight
      />
      <SummaryCard
        label="Median Tax"
        value={formatMonthlyUSD(summary?.median_tax_usd_month)}
        icon={<Receipt className="h-4 w-4" />}
      />
      <SummaryCard
        label="Median Revenue"
        value={formatMonthlyUSD(summary?.median_revenue_usd_month)}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <SummaryCard
        label="Avg Productivity"
        value={formatMultiplier(summary?.average_productivity_multiplier)}
        icon={<Gauge className="h-4 w-4" />}
      />
      <SummaryCard
        label="Countries Tracked"
        value={
          summary?.countries_with_data
            ? `${summary.countries_with_data}`
            : "No Data Yet"
        }
        icon={<MapPin className="h-4 w-4" />}
      />
      <SummaryCard
        label="Last Updated"
        value={formatDate(summary?.last_updated)}
        icon={<Clock className="h-4 w-4" />}
      />
    </div>
  );
}
