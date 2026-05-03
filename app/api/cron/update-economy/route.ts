import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { researchCountry } from "@/lib/openai/researchCountry";
import {
  calculateCountryMetrics,
  validateResearchOutput,
} from "@/lib/metrics/calculateCountryMetrics";

// Vercel function timeout - set to maximum for Pro plan (300s)
export const maxDuration = 300;

/**
 * GET /api/cron/update-economy
 *
 * Manually-invoked protected endpoint that updates economy data for ALL countries.
 * Automatic Vercel cron scheduling has been removed; trigger this route manually when needed.
 *
 * Behavior:
 * - If RUN_RESEARCH_CRON is not "true", returns a safe message without calling OpenAI
 * - If RUN_RESEARCH_CRON is "true":
 *   - Processes ALL countries in the database
 *   - Runs OpenAI research for each country (refreshes existing data)
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
          "Research run is disabled. Set RUN_RESEARCH_CRON=true only when you want to run it manually.",
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

    // Get ALL countries - process every country every week
    const { data: countries, error: countriesError } = await supabase
      .from("countries")
      .select("iso3, name")
      .not("iso3", "is", null)
      .order("name", { ascending: true });

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

    let processedCount = 0;
    const errors: string[] = [];
    const totalCountries = countries?.length || 0;

    // Process ALL countries
    for (const country of countries || []) {
      try {
        console.log(
          `[${processedCount + 1}/${totalCountries}] Researching ${country.name} (${country.iso3})...`
        );

        // Run OpenAI research
        const research = await researchCountry(
          country.name,
          country.iso3 as string
        );

        // Validate research quality - skip if very low quality
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

        // Upsert metric snapshot (replaces existing data for this month)
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
        console.log(
          `Completed ${country.name}: Agent GDP = ${
            metrics.agent_gdp_usd_month
              ? `$${(metrics.agent_gdp_usd_month / 1000000).toFixed(1)}M`
              : "No data"
          }`
        );
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
      total_countries: totalCountries,
      countries_processed: processedCount,
      countries_failed: errors.length,
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
