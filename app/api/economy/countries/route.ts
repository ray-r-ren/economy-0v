import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CountryWithMetrics } from "@/lib/types";

/**
 * GET /api/economy/countries
 *
 * Returns all countries with their latest metric snapshot.
 * Uses a LEFT JOIN to ensure all countries are returned, even those without metrics.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all countries
    const { data: countries, error: countriesError } = await supabase
      .from("countries")
      .select("*")
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

    // Combine countries with their metrics using LEFT JOIN logic
    const countriesWithMetrics: CountryWithMetrics[] = (countries || []).map(
      (country) => ({
        ...country,
        metrics: country.iso3 ? (latestMetrics.get(country.iso3) ?? null) : null,
      })
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
