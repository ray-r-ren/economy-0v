"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ColumnInfoTooltip } from "@/components/ColumnInfoTooltip";
import { MetricValue, FunctionTags } from "@/components/MetricValue";
import type { CountryWithMetrics } from "@/lib/types";
import { COLUMN_CAPTIONS } from "@/lib/types";
import {
  formatCompactUSD,
  formatPercentage,
  formatMultiplier,
  formatMonthlyUSD,
  formatDate,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface CountryTableProps {
  countries: CountryWithMetrics[];
  selectedCountry: string | null;
  onSelectCountry: (iso3: string | null) => void;
}

// Threshold for showing full details in table (countries below this only show on map)
const TABLE_GDP_THRESHOLD = 700000;

type SortKey =
  | "rank"
  | "name"
  | "agent_gdp"
  | "employment"
  | "median_tax"
  | "median_revenue"
  | "productivity"
  | "updated";

type SortDirection = "asc" | "desc";

function getColumnCaption(key: string): string {
  return COLUMN_CAPTIONS.find((c) => c.key === key)?.caption || "";
}

export function CountryTable({
  countries,
  selectedCountry,
  onSelectCountry,
}: CountryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const selectedRowRef = useRef<HTMLTableRowElement>(null);

  // Sort and rank countries - only show countries with GDP >= $700K in table
  const rankedCountries = useMemo(() => {
    // Filter to only countries above the threshold
    const withData = countries.filter(
      (c) => 
        c.metrics?.agent_gdp_usd_month !== null && 
        c.metrics?.agent_gdp_usd_month !== undefined &&
        c.metrics.agent_gdp_usd_month >= TABLE_GDP_THRESHOLD
    );
    // No "without data" section - countries below threshold don't show in table
    const withoutData: CountryWithMetrics[] = [];

    // Sort countries with data by Agent GDP descending
    withData.sort(
      (a, b) =>
        (b.metrics?.agent_gdp_usd_month || 0) -
        (a.metrics?.agent_gdp_usd_month || 0)
    );

    // Sort countries without data alphabetically
    withoutData.sort((a, b) => a.name.localeCompare(b.name));

    // Assign ranks
    const ranked = withData.map((c, index) => ({
      ...c,
      rank: index + 1,
    }));

    const unranked = withoutData.map((c) => ({
      ...c,
      rank: null as number | null,
    }));

    return [...ranked, ...unranked];
  }, [countries]);

  // Filter by search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return rankedCountries;

    const query = searchQuery.toLowerCase();
    return rankedCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.iso3?.toLowerCase().includes(query) ||
        c.iso2?.toLowerCase().includes(query) ||
        c.region?.toLowerCase().includes(query)
    );
  }, [rankedCountries, searchQuery]);

  // Sort by selected column
  const sortedCountries = useMemo(() => {
    const sorted = [...filteredCountries];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case "rank":
          // Null ranks go to bottom
          if (a.rank === null && b.rank === null) return 0;
          if (a.rank === null) return 1;
          if (b.rank === null) return -1;
          comparison = a.rank - b.rank;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "agent_gdp":
          const aGdp = a.metrics?.agent_gdp_usd_month ?? -Infinity;
          const bGdp = b.metrics?.agent_gdp_usd_month ?? -Infinity;
          comparison = bGdp - aGdp;
          break;
        case "employment":
          const aEmp = a.metrics?.employment_pct ?? -Infinity;
          const bEmp = b.metrics?.employment_pct ?? -Infinity;
          comparison = bEmp - aEmp;
          break;
        case "median_tax":
          const aTax = a.metrics?.median_tax_usd_month ?? -Infinity;
          const bTax = b.metrics?.median_tax_usd_month ?? -Infinity;
          comparison = bTax - aTax;
          break;
        case "median_revenue":
          const aRev = a.metrics?.median_revenue_usd_month ?? -Infinity;
          const bRev = b.metrics?.median_revenue_usd_month ?? -Infinity;
          comparison = bRev - aRev;
          break;
        case "productivity":
          const aProd = a.metrics?.productivity_multiplier ?? -Infinity;
          const bProd = b.metrics?.productivity_multiplier ?? -Infinity;
          comparison = bProd - aProd;
          break;
        case "updated":
          const aDate = a.metrics?.updated_at
            ? new Date(a.metrics.updated_at).getTime()
            : 0;
          const bDate = b.metrics?.updated_at
            ? new Date(b.metrics.updated_at).getTime()
            : 0;
          comparison = bDate - aDate;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredCountries, sortKey, sortDirection]);

  // Handle column header click
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection(key === "name" ? "asc" : "desc");
    }
  };

  // Scroll to selected row when selection changes from map
  useEffect(() => {
    if (selectedCountry && selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedCountry]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-zinc-600" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-cyan-400" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-cyan-400" />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          type="text"
          placeholder="Search countries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-950">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-zinc-900 border-b border-white/5">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                <button
                  onClick={() => handleSort("rank")}
                  className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
                >
                  <ColumnInfoTooltip
                    label="Rank"
                    caption={getColumnCaption("rank")}
                  />
                  <SortIcon columnKey="rank" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
                >
                  <ColumnInfoTooltip
                    label="Country"
                    caption={getColumnCaption("country")}
                  />
                  <SortIcon columnKey="name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                <button
                  onClick={() => handleSort("agent_gdp")}
                  className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
                >
                  <ColumnInfoTooltip
                    label="Agent GDP"
                    caption={getColumnCaption("agent_gdp")}
                  />
                  <SortIcon columnKey="agent_gdp" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                <button
                  onClick={() => handleSort("employment")}
                  className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
                >
                  <ColumnInfoTooltip
                    label="Employment"
                    caption={getColumnCaption("employment")}
                  />
                  <SortIcon columnKey="employment" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                <ColumnInfoTooltip
                  label="Top Functions"
                  caption={getColumnCaption("top_functions")}
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                <button
                  onClick={() => handleSort("median_tax")}
                  className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
                >
                  <ColumnInfoTooltip
                    label="Median Tax"
                    caption={getColumnCaption("median_tax")}
                  />
                  <SortIcon columnKey="median_tax" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                <button
                  onClick={() => handleSort("median_revenue")}
                  className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
                >
                  <ColumnInfoTooltip
                    label="Median Revenue"
                    caption={getColumnCaption("median_revenue")}
                  />
                  <SortIcon columnKey="median_revenue" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                <button
                  onClick={() => handleSort("productivity")}
                  className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
                >
                  <ColumnInfoTooltip
                    label="Productivity"
                    caption={getColumnCaption("productivity")}
                  />
                  <SortIcon columnKey="productivity" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">
                <button
                  onClick={() => handleSort("updated")}
                  className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors"
                >
                  <ColumnInfoTooltip
                    label="Updated"
                    caption={getColumnCaption("updated")}
                  />
                  <SortIcon columnKey="updated" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedCountries.map((country) => {
              const isSelected = country.iso3 === selectedCountry;
              const metrics = country.metrics;

              return (
                <tr
                  key={country.id}
                  ref={isSelected ? selectedRowRef : undefined}
                  onClick={() =>
                    onSelectCountry(
                      isSelected ? null : country.iso3
                    )
                  }
                  className={cn(
                    "cursor-pointer transition-colors",
                    isSelected
                      ? "bg-cyan-950/30 border-l-2 border-l-cyan-400"
                      : "hover:bg-zinc-900/50"
                  )}
                >
                  <td className="px-4 py-3">
                    {country.rank !== null ? (
                      <span className="font-mono text-zinc-300">
                        #{country.rank}
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-200">
                        {country.name}
                      </span>
                      {country.iso2 && (
                        <span className="text-xs text-zinc-600">
                          {country.iso2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <MetricValue
                      value={formatCompactUSD(metrics?.agent_gdp_usd_month)}
                      variant="highlight"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <MetricValue
                      value={formatPercentage(metrics?.employment_pct)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <FunctionTags functions={metrics?.top_functions || []} />
                  </td>
                  <td className="px-4 py-3">
                    <MetricValue
                      value={formatMonthlyUSD(metrics?.median_tax_usd_month)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <MetricValue
                      value={formatMonthlyUSD(metrics?.median_revenue_usd_month)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <MetricValue
                      value={formatMultiplier(metrics?.productivity_multiplier)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <MetricValue
                      value={formatDate(metrics?.updated_at)}
                      variant="muted"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedCountries.length === 0 && (
          <div className="flex items-center justify-center py-12 text-zinc-500">
            No countries found matching your search.
          </div>
        )}
      </div>

      {/* Count */}
      <div className="text-sm text-zinc-500">
        Showing {sortedCountries.length} of {countries.length} countries
      </div>
    </div>
  );
}
