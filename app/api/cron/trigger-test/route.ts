import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { researchCountry } from "@/lib/openai/researchCountry";
import {
  calculateCountryMetrics,
  validateResearchOutput,
} from "@/lib/metrics/calculateCountryMetrics";

// Test endpoint to manually trigger research for a few countries
// This endpoint is for development/testing only
const TEST_BATCH_SIZE = 3;

export async function GET(request: NextRequest) {
  try {
    // Check if research is enabled
    const runResearch = process.env.RUN_RESEARCH_CRON === "true";

    if (!runResearch) {
      return NextResponse.json({
        status: "skipped",
        message:
          "Research cron is disabled. Set RUN_RESEARCH_CRON=true to enable.",
        timestamp: new Date().toISOString(),
      });
    }

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        status: "error",
        message: "OPENAI_API_KEY is not set",
        timestamp: new Date().toISOString(),
      });
    }

    const supabase = createServiceClient();

    // Create research run record
    const { data: runRecord, error: runError } = await supabase
      .from("research_runs")
      .insert({
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError) {
      console.error("Failed to create research run record:", runError);
      return NextResponse.json(
        { error: "Failed to start research run", details: runError.message },
        { status: 500 }
      );
    }

    // Get countries that need updating - prioritize ones without data
    const { data: countries, error: countriesError } = await supabase
      .from("countries")
      .select(
        `
        iso3,
        name,
        country_metric_snapshots (
          updated_at
        )
      `
      )
      .not("iso3", "is", null)
      .order("name", { ascending: true })
      .limit(100);

    if (countriesError) {
      console.error("Failed to fetch countries:", countriesError);
      await supabase
        .from("research_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_message: "Failed to fetch countries",
        })
        .eq("id", runRecord.id);

      return NextResponse.json(
        { error: "Failed to fetch countries" },
        { status: 500 }
      );
    }

    // Sort by last update (oldest/null first)
    const sortedCountries = countries
      .map((c) => ({
        iso3: c.iso3 as string,
        name: c.name,
        lastUpdated: c.country_metric_snapshots?.[0]?.updated_at || null,
      }))
      .sort((a, b) => {
        if (!a.lastUpdated && !b.lastUpdated) return 0;
        if (!a.lastUpdated) return -1;
        if (!b.lastUpdated) return 1;
        return (
          new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()
        );
      })
      .slice(0, TEST_BATCH_SIZE);

    let processedCount = 0;
    const errors: string[] = [];
    const results: Array<{ country: string; status: string; metrics?: unknown }> = [];

    // Process each country
    for (const country of sortedCountries) {
      try {
        console.log(`[v0] Researching ${country.name} (${country.iso3})...`);

        // Run OpenAI research
        const research = await researchCountry(country.name, country.iso3);

        console.log(`[v0] Research completed for ${country.name}, validating...`);

        // Validate research quality
        if (!validateResearchOutput(research)) {
          console.log(`[v0] Skipping ${country.name}: Low quality research output`);
          results.push({ country: country.name, status: "skipped_low_quality" });
          continue;
        }

        // Store source signals
        for (const evidence of research.evidence_items) {
          await supabase.from("source_signals").insert({
            country_iso3: country.iso3,
            source_url: evidence.source_url,
            source_title: evidence.source_title,
            source_type: evidence.source_type,
            signal_type: evidence.signal_type,
            signal_value: {
              extracted_claim: evidence.extracted_claim,
              numeric_value: evidence.numeric_value,
            },
            confidence: evidence.confidence,
          });
        }

        // Calculate metrics
        const metrics = calculateCountryMetrics(research);

        console.log(`[v0] Metrics calculated for ${country.name}:`, metrics);

        // Get current month for period
        const currentMonth = new Date();
        currentMonth.setDate(1);
        const periodMonth = currentMonth.toISOString().split("T")[0];

        // Upsert metric snapshot
        const { error: upsertError } = await supabase.from("country_metric_snapshots").upsert(
          {
            country_iso3: country.iso3,
            period_month: periodMonth,
            agent_gdp_usd_month: metrics.agent_gdp_usd_month,
            agent_assisted_work_value_usd_month:
              metrics.agent_assisted_work_value_usd_month,
            agent_generated_revenue_usd_month:
              metrics.agent_generated_revenue_usd_month,
            agent_service_revenue_usd_month:
              metrics.agent_service_revenue_usd_month,
            agent_asset_revenue_usd_month: metrics.agent_asset_revenue_usd_month,
            employment_pct: metrics.employment_pct,
            top_functions: metrics.top_functions,
            median_tax_usd_month: metrics.median_tax_usd_month,
            median_revenue_usd_month: metrics.median_revenue_usd_month,
            estimated_active_agent_users: metrics.estimated_active_agent_users,
            total_agent_tax_spend_usd_month:
              metrics.total_agent_tax_spend_usd_month,
            productivity_multiplier: metrics.productivity_multiplier,
            confidence_score: metrics.confidence_score,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "country_iso3,period_month" }
        );

        if (upsertError) {
          console.error(`[v0] Error upserting metrics for ${country.name}:`, upsertError);
          errors.push(`${country.name}: ${upsertError.message}`);
          results.push({ country: country.name, status: "error", metrics: upsertError.message });
        } else {
          processedCount++;
          results.push({ country: country.name, status: "success", metrics });
          console.log(`[v0] Completed ${country.name}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`[v0] Error processing ${country.name}:`, message);
        errors.push(`${country.name}: ${message}`);
        results.push({ country: country.name, status: "error", metrics: message });
      }
    }

    // Update research run record
    await supabase
      .from("research_runs")
      .update({
        status: errors.length > 0 ? "completed_with_errors" : "completed",
        finished_at: new Date().toISOString(),
        countries_processed: processedCount,
        error_message: errors.length > 0 ? errors.join("; ") : null,
      })
      .eq("id", runRecord.id);

    return NextResponse.json({
      status: "completed",
      countries_processed: processedCount,
      results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[v0] Unexpected error in test trigger:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
