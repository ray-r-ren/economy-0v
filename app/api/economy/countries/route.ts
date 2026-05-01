import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CountryWithMetrics } from "@/lib/types";

// Countries to exclude from the public API (controversial or included in parent country)
const EXCLUDED_ISO3 = [
  "RUS", // Russia
  "TWN", // Taiwan (part of China dispute)
  "PRK", // North Korea
  "PSE", // Palestine
  "VEN", // Venezuela
  "AFG", // Afghanistan
  "LBY", // Libya
  "SYR", // Syria
  "HKG", // Hong Kong (included in China)
  "MAC", // Macau (included in China)
];

/**
 * GET /api/economy/countries
 *
 * Returns countries with their latest metric snapshot.
 * Excludes controversial countries and those without data.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all countries except excluded ones
    const { data: countries, error: countriesError } = await supabase
      .from("countries")
      .select("*")
      .not("iso3", "in", `(${EXCLUDED_ISO3.join(",")})`)
      .order("name", { ascending: true });

    if (countriesError) {
      console.error("Error fetching countries:", countriesError);
      return NextResponse.json(
        { error: "Failed to fetch countries" },
        { status: 500 }
      );
    }

    // Get latest metric snapshots for each country
    // We get the most recent period_month for each country
    const { data: metrics, error: metricsError } = await supabase
      .from("country_metric_snapshots")
      .select("*")
      .order("period_month", { ascending: false });

    if (metricsError) {
      console.error("Error fetching metrics:", metricsError);
      return NextResponse.json(
        { error: "Failed to fetch metrics" },
        { status: 500 }
      );
    }

    // Create a map of latest metrics by country_iso3
    const latestMetrics = new Map<string, (typeof metrics)[0]>();
    for (const metric of metrics || []) {
      if (!latestMetrics.has(metric.country_iso3)) {
        latestMetrics.set(metric.country_iso3, metric);
      }
    }

    // Combine countries with their metrics
    // Only include countries that have actual metric data (agent_gdp_usd_month is not null)
    const countriesWithMetrics: CountryWithMetrics[] = (countries || [])
      .map((country) => ({
        ...country,
        metrics: country.iso3 ? (latestMetrics.get(country.iso3) ?? null) : null,
      }))
      .filter((country) => 
        country.metrics?.agent_gdp_usd_month !== null && 
        country.metrics?.agent_gdp_usd_month !== undefined &&
        country.metrics?.agent_gdp_usd_month > 0
      );

    return NextResponse.json(countriesWithMetrics);
  } catch (error) {
    console.error("Unexpected error in countries API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
