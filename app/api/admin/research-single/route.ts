import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { researchCountry } from "@/lib/openai/researchCountry";
import { calculateCountryMetrics } from "@/lib/metrics/calculateCountryMetrics";

export const maxDuration = 60; // 60 second timeout per country

export async function POST(request: Request) {
  try {
    const { iso3, name } = await request.json();

    if (!iso3 || !name) {
      return NextResponse.json(
        { success: false, error: "Missing iso3 or name" },
        { status: 400 }
      );
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // Research this country
    console.log(`[v0] Researching ${name} (${iso3})...`);
    const researchResult = await researchCountry(name, iso3);

    if (!researchResult) {
      return NextResponse.json({
        success: true,
        country: name,
        iso3,
        metrics: null,
        message: "Research returned no data",
      });
    }

    // Calculate metrics
    const metrics = calculateCountryMetrics(researchResult);

    // Get current month
    const now = new Date();
    const periodMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    // Store source signals
    if (researchResult.evidence_items && researchResult.evidence_items.length > 0) {
      const signals = researchResult.evidence_items.map((item) => ({
        country_iso3: iso3,
        source_url: item.source_url,
        source_title: item.source_title,
        source_type: item.source_type,
        signal_type: item.signal_type,
        signal_value: {
          extracted_claim: item.extracted_claim,
          numeric_value: item.numeric_value,
        },
        confidence: item.confidence,
      }));

      await supabase.from("source_signals").insert(signals);
    }

    // Upsert metric snapshot
    const { error: snapshotError } = await supabase
      .from("country_metric_snapshots")
      .upsert(
        {
          country_iso3: iso3,
          period_month: periodMonth,
          ...metrics,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "country_iso3,period_month" }
      );

    if (snapshotError) {
      console.error(`[v0] Error saving metrics for ${name}:`, snapshotError);
      return NextResponse.json({
        success: false,
        country: name,
        iso3,
        error: snapshotError.message,
      });
    }

    console.log(`[v0] Completed ${name}: GDP = $${metrics.agent_gdp_usd_month || 0}`);

    return NextResponse.json({
      success: true,
      country: name,
      iso3,
      metrics,
    });
  } catch (error) {
    console.error("[v0] Research error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
