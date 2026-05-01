import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EconomySummary } from "@/lib/types";

// Threshold for counting in "countries tracked" (same as table threshold)
const GDP_THRESHOLD = 700000;

/**
 * GET /api/economy/summary
 *
 * Returns aggregate economy metrics:
 * - global_agent_gdp_usd_month: Sum of all countries' Agent GDP
 * - median_tax_usd_month: Median of all countries' median tax
 * - median_revenue_usd_month: Median of all countries' median revenue
 * - average_productivity_multiplier: Average productivity across countries
 * - countries_tracked: Number of countries with GDP >= $700K
 * - last_updated: Most recent metric update timestamp
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all countries count (we'll calculate countries_with_data from metrics)
    const { count: totalCountries, error: countError } = await supabase
      .from("countries")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting countries:", countError);
      return NextResponse.json(
        { error: "Failed to count countries" },
        { status: 500 }
      );
    }

    // Get all latest metrics (one per country, most recent period)
    const { data: allMetrics, error: metricsError } = await supabase
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

    // Deduplicate to get latest metric per country
    const latestByCountry = new Map<string, (typeof allMetrics)[0]>();
    for (const metric of allMetrics || []) {
      if (!latestByCountry.has(metric.country_iso3)) {
        latestByCountry.set(metric.country_iso3, metric);
      }
    }

    const latestMetrics = Array.from(latestByCountry.values());

    // Calculate aggregates - only count countries with GDP >= $700K threshold
    const countriesWithData = latestMetrics.filter(
      (m) => 
        m.agent_gdp_usd_month !== null && 
        m.agent_gdp_usd_month >= GDP_THRESHOLD
    ).length;

    // Sum of Agent GDP
    const globalAgentGdp = latestMetrics.reduce(
      (sum, m) => sum + (m.agent_gdp_usd_month || 0),
      0
    );

    // Calculate median tax
    const taxValues = latestMetrics
      .map((m) => m.median_tax_usd_month)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);
    const medianTax =
      taxValues.length > 0
        ? taxValues[Math.floor(taxValues.length / 2)]
        : null;

    // Calculate median revenue
    const revenueValues = latestMetrics
      .map((m) => m.median_revenue_usd_month)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);
    const medianRevenue =
      revenueValues.length > 0
        ? revenueValues[Math.floor(revenueValues.length / 2)]
        : null;

    // Calculate average productivity
    const productivityValues = latestMetrics
      .map((m) => m.productivity_multiplier)
      .filter((v): v is number => v !== null);
    const avgProductivity =
      productivityValues.length > 0
        ? productivityValues.reduce((sum, v) => sum + v, 0) /
          productivityValues.length
        : null;

    // Find most recent update
    const lastUpdated =
      latestMetrics.length > 0
        ? latestMetrics.reduce((latest, m) => {
            const mDate = new Date(m.updated_at);
            return mDate > new Date(latest) ? m.updated_at : latest;
          }, latestMetrics[0].updated_at)
        : null;

    const summary: EconomySummary = {
      global_agent_gdp_usd_month: globalAgentGdp > 0 ? globalAgentGdp : null,
      median_tax_usd_month: medianTax,
      median_revenue_usd_month: medianRevenue,
      average_productivity_multiplier: avgProductivity,
      countries_tracked: totalCountries || 0,
      countries_with_data: countriesWithData,
      last_updated: lastUpdated,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Unexpected error in summary API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
