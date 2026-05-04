import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { researchCountry } from "@/lib/openai/researchCountry";
import { calculateCountryMetrics } from "@/lib/metrics/calculateCountryMetrics";

// Admin endpoint to manually trigger research for ALL countries
// Use this to run initial data population or force a refresh

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const maxDuration = 300; // 5 minutes max for Vercel

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const region = searchParams.get("region") || null;
  
  // Simple admin key check (set ADMIN_KEY in env vars for security)
  const adminKey = searchParams.get("key");
  const expectedKey = process.env.ADMIN_KEY || process.env.CRON_SECRET;
  
  // In preview/dev, allow access without key for testing
  const isDev = process.env.NODE_ENV === "development" || !expectedKey;
  
  if (!isDev && adminKey !== expectedKey) {
    return NextResponse.json(
      { error: "Unauthorized. Add ?key=YOUR_ADMIN_KEY to the URL" },
      { status: 401 }
    );
  }

  // Research only runs when explicitly enabled via env var
  if (process.env.RESEARCH_ENABLED !== "true") {
    return NextResponse.json(
      {
        status: "disabled",
        message:
          "Research is disabled. Set RESEARCH_ENABLED=true to enable.",
      },
      { status: 403 }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const results: Array<{
    country: string;
    iso3: string;
    status: "success" | "error";
    agentGdp?: string;
    error?: string;
  }> = [];

  try {
    // Get ALL countries to research
    let query = supabase
      .from("countries")
      .select("name, iso3, region")
      .not("iso3", "is", null)
      .order("name", { ascending: true });

    if (region) {
      query = query.eq("region", region);
    }

    const { data: countries, error: countriesError } = await query;

    if (countriesError) {
      throw new Error(`Failed to fetch countries: ${countriesError.message}`);
    }

    const countriesToProcess = countries || [];
    const totalCountries = countriesToProcess.length;

    if (totalCountries === 0) {
      return NextResponse.json({
        message: "No countries found to process",
        totalCountries: 0,
      });
    }

    // Create a research run record
    const { data: runData, error: runError } = await supabase
      .from("research_runs")
      .insert({
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError) {
      console.error("Failed to create research run:", runError);
    }

    const runId = runData?.id;

    // Process ALL countries
    for (let i = 0; i < countriesToProcess.length; i++) {
      const country = countriesToProcess[i];
      
      try {
        console.log(
          `[${i + 1}/${totalCountries}] Researching ${country.name} (${country.iso3})...`
        );
        
        // Call OpenAI to research the country
        const research = await researchCountry(country.name, country.iso3);
        
        // Calculate metrics from research
        const metrics = calculateCountryMetrics(research);
        
        // Get current month for period_month
        const now = new Date();
        const periodMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split("T")[0];

        // Upsert metrics (replaces existing data)
        const { error: upsertError } = await supabase
          .from("country_metric_snapshots")
          .upsert(
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
          throw new Error(`Database error: ${upsertError.message}`);
        }

        // Save source signals if available
        if (research.evidence_items && research.evidence_items.length > 0) {
          const signals = research.evidence_items.map((item) => ({
            country_iso3: country.iso3,
            source_url: item.source_url,
            source_title: item.source_title,
            source_type: item.source_type,
            signal_type: item.signal_type,
            signal_value: {
              extracted_claim: item.extracted_claim,
              numeric_value: item.numeric_value,
            },
            confidence: item.confidence,
            captured_at: new Date().toISOString(),
          }));

          await supabase.from("source_signals").insert(signals);
        }

        results.push({
          country: country.name,
          iso3: country.iso3,
          status: "success",
          agentGdp: metrics.agent_gdp_usd_month
            ? `$${(metrics.agent_gdp_usd_month / 1000000).toFixed(1)}M/mo`
            : "No data",
        });

        console.log(
          `Completed ${country.name}: Agent GDP = ${
            metrics.agent_gdp_usd_month
              ? `$${(metrics.agent_gdp_usd_month / 1000000).toFixed(1)}M`
              : "No data"
          }`
        );
      } catch (error) {
        console.error(`Error researching ${country.name}:`, error);
        results.push({
          country: country.name,
          iso3: country.iso3,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Update research run record
    if (runId) {
      await supabase
        .from("research_runs")
        .update({
          status: "completed",
          finished_at: new Date().toISOString(),
          countries_processed: results.filter((r) => r.status === "success")
            .length,
        })
        .eq("id", runId);
    }

    const successful = results.filter((r) => r.status === "success").length;
    const failed = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      message: `Research completed for all countries: ${successful} successful, ${failed} failed`,
      totalCountries,
      successful,
      failed,
      processed: results,
    });
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        results,
      },
      { status: 500 }
    );
  }
}
