"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import type { CountryWithMetrics } from "@/lib/types";
import {
  formatCompactUSD,
  formatPercentage,
  formatMultiplier,
  formatMonthlyUSD,
} from "@/lib/formatters";

// World Atlas TopoJSON URL - using a CDN-hosted version
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  countries: CountryWithMetrics[];
  selectedCountry: string | null;
  onSelectCountry: (iso3: string | null) => void;
}

// Color scale for Agent GDP
function getCountryColor(agentGdp: number | null | undefined): string {
  if (agentGdp === null || agentGdp === undefined) {
    return "#1a1a1a"; // Muted dark gray for no data
  }

  // Color scale from dark to bright based on GDP value
  // Scale: $1M -> $100B
  const logValue = Math.log10(Math.max(agentGdp, 1));
  const normalized = Math.min(Math.max((logValue - 6) / 5, 0), 1); // 10^6 to 10^11

  // Interpolate between dark teal and bright cyan
  const r = Math.round(20 + normalized * 20);
  const g = Math.round(50 + normalized * 180);
  const b = Math.round(80 + normalized * 175);

  return `rgb(${r}, ${g}, ${b})`;
}

// Country tooltip component
interface TooltipData {
  name: string;
  agentGdp: string;
  employment: string;
  topFunctions: string[];
  medianTax: string;
  medianRevenue: string;
  productivity: string;
}

interface TooltipProps {
  data: TooltipData | null;
  position: { x: number; y: number };
}

function MapTooltip({ data, position }: TooltipProps) {
  if (!data) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 rounded-lg border border-white/10 bg-zinc-900/95 px-4 py-3 shadow-xl backdrop-blur-sm"
      style={{
        left: position.x + 16,
        top: position.y - 10,
        transform: "translateY(-100%)",
      }}
    >
      <div className="mb-2 text-sm font-semibold text-white">{data.name}</div>
      <div className="grid gap-1.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-400">Agent GDP</span>
          <span className="font-medium text-emerald-400">{data.agentGdp}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-400">Employment</span>
          <span className="text-zinc-200">{data.employment}</span>
        </div>
        {data.topFunctions.length > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-400">Top Functions</span>
            <span className="text-zinc-200">
              {data.topFunctions.slice(0, 2).join(", ")}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-400">Median Tax</span>
          <span className="text-zinc-200">{data.medianTax}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-400">Median Revenue</span>
          <span className="text-zinc-200">{data.medianRevenue}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-400">Productivity</span>
          <span className="text-zinc-200">{data.productivity}</span>
        </div>
      </div>
    </div>
  );
}

export function WorldMap({
  countries,
  selectedCountry,
  onSelectCountry,
}: WorldMapProps) {
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Create lookup map by ISO numeric code (used in TopoJSON)
  const countryByNumeric = useMemo(() => {
    const map = new Map<string, CountryWithMetrics>();
    for (const country of countries) {
      if (country.iso_numeric) {
        map.set(country.iso_numeric, country);
      }
    }
    return map;
  }, [countries]);

  // Create lookup map by ISO3 code
  const countryByIso3 = useMemo(() => {
    const map = new Map<string, CountryWithMetrics>();
    for (const country of countries) {
      if (country.iso3) {
        map.set(country.iso3, country);
      }
    }
    return map;
  }, [countries]);

  const handleMouseEnter = useCallback(
    (geo: GeoJSON.Feature, event: React.MouseEvent) => {
      const geoId = geo.id?.toString() || "";
      const country =
        countryByNumeric.get(geoId) || countryByIso3.get(geoId);

      if (country) {
        const metrics = country.metrics;
        setTooltipData({
          name: country.name,
          agentGdp: formatCompactUSD(metrics?.agent_gdp_usd_month),
          employment: formatPercentage(metrics?.employment_pct),
          topFunctions: metrics?.top_functions || [],
          medianTax: formatMonthlyUSD(metrics?.median_tax_usd_month),
          medianRevenue: formatMonthlyUSD(metrics?.median_revenue_usd_month),
          productivity: formatMultiplier(metrics?.productivity_multiplier),
        });
        setTooltipPosition({ x: event.clientX, y: event.clientY });
      }
    },
    [countryByNumeric, countryByIso3]
  );

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltipData(null);
  }, []);

  const handleClick = useCallback(
    (geo: GeoJSON.Feature) => {
      const geoId = geo.id?.toString() || "";
      const country =
        countryByNumeric.get(geoId) || countryByIso3.get(geoId);

      if (country?.iso3) {
        onSelectCountry(
          selectedCountry === country.iso3 ? null : country.iso3
        );
      }
    },
    [countryByNumeric, countryByIso3, selectedCountry, onSelectCountry]
  );

  return (
    <div className="relative w-full">
      <MapTooltip data={tooltipData} position={tooltipPosition} />

      <div className="overflow-hidden rounded-xl border border-white/5 bg-zinc-950">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 130,
            center: [0, 30],
          }}
          style={{
            width: "100%",
            height: "auto",
            aspectRatio: "2 / 1",
          }}
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoId = geo.id?.toString() || "";
                  const country =
                    countryByNumeric.get(geoId) || countryByIso3.get(geoId);
                  const isSelected = country?.iso3 === selectedCountry;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getCountryColor(country?.metrics?.agent_gdp_usd_month)}
                      stroke={isSelected ? "#22d3ee" : "#262626"}
                      strokeWidth={isSelected ? 1.5 : 0.5}
                      style={{
                        default: {
                          outline: "none",
                          transition: "fill 0.2s ease",
                        },
                        hover: {
                          fill: country?.metrics?.agent_gdp_usd_month
                            ? "#22d3ee"
                            : "#2a2a2a",
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: {
                          outline: "none",
                        },
                      }}
                      onMouseEnter={(event) => handleMouseEnter(geo, event)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleClick(geo)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-zinc-800" />
          <span className="text-xs text-zinc-500">No Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: "rgb(30, 80, 120)" }}
          />
          <span className="text-xs text-zinc-500">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: "rgb(30, 150, 180)" }}
          />
          <span className="text-xs text-zinc-500">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: "rgb(40, 230, 255)" }}
          />
          <span className="text-xs text-zinc-500">High</span>
        </div>
      </div>
    </div>
  );
}
