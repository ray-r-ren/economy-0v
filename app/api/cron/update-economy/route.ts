import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { researchCountry } from "@/lib/openai/researchCountry";
import {
  calculateCountryMetrics,
  validateResearchOutput,
} from "@/lib/metrics/calculateCountryMetrics";

// Maximum countries to process per cron run
const BATCH_SIZE = 5;

/**
 * GET /api/cron/update-economy
 *
 * Protected Vercel Cron endpoint that updates economy data.
 * Called daily by Vercel Cron at 5:00 AM UTC.
 *
 * Behavior:
 * - If RUN_RESEARCH_CRON is not "true", returns a safe message without calling OpenAI
 * - If RUN_RESEARCH_CRON is "true":
 *   - Selects a batch of countries to update
 *   - Runs OpenAI web research for each country
 *   - Extracts structured source signals
 *   - Calculates updated metrics
 *   - Stores results in database
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Initialize service client for database operations
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
        { error: "Failed to start research run" },
        { status: 500 }
      );
    }

    // Get countries that need updating
    // Prioritize countries with no recent data or oldest data
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

    // Sort by last update (oldest first, null = never updated = highest priority)
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
      .slice(0, BATCH_SIZE);

    let processedCount = 0;
    const errors: string[] = [];

    // Process each country
    for (const country of sortedCountries) {
      try {
        console.log(`Researching ${country.name} (${country.iso3})...`);

        // Run OpenAI research
        const research = await researchCountry(country.name, country.iso3);

        // Validate research quality
        if (!validateResearchOutput(research)) {
          console.log(`Skipping ${country.name}: Low quality research output`);
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

        // Get current month for period
        const currentMonth = new Date();
        currentMonth.setDate(1);
        const periodMonth = currentMonth.toISOString().split("T")[0];

        // Upsert metric snapshot
        await supabase.from("country_metric_snapshots").upsert(
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

        processedCount++;
        console.log(`Completed ${country.name}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error processing ${country.name}:`, message);
        errors.push(`${country.name}: ${message}`);
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
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Unexpected error in cron:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
