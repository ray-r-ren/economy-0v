/**
 * Seed script for the Forsy Economy database.
 *
 * This script:
 * 1. Seeds all countries from the ISO 3166-1 list
 * 2. Optionally adds demo metric snapshots for UI development
 *
 * Run with: npx tsx scripts/seed.ts
 *
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { COUNTRIES, DEMO_METRICS } from "../lib/data/countries";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedCountries() {
  console.log(`Seeding ${COUNTRIES.length} countries...`);

  // Insert countries in batches of 50
  const batchSize = 50;
  for (let i = 0; i < COUNTRIES.length; i += batchSize) {
    const batch = COUNTRIES.slice(i, i + batchSize);

    const { error } = await supabase.from("countries").upsert(
      batch.map((c) => ({
        name: c.name,
        iso2: c.iso2,
        iso3: c.iso3,
        iso_numeric: c.iso_numeric,
        region: c.region,
        subregion: c.subregion,
      })),
      { onConflict: "iso3" }
    );

    if (error) {
      console.error(`Error seeding countries batch ${i}:`, error);
    } else {
      console.log(
        `Seeded countries ${i + 1} to ${Math.min(i + batchSize, COUNTRIES.length)}`
      );
    }
  }

  console.log("Countries seeding complete!");
}

async function seedDemoMetrics() {
  console.log("Seeding demo metric snapshots...");

  const currentMonth = new Date();
  currentMonth.setDate(1);
  const periodMonth = currentMonth.toISOString().split("T")[0];

  const demoEntries = Object.entries(DEMO_METRICS);

  for (const [iso3, metrics] of demoEntries) {
    // Calculate derived values
    const total_agent_tax_spend_usd_month =
      metrics.estimated_active_agent_users * metrics.median_tax_usd_month;

    // Distribute Agent GDP across components (rough estimates for demo)
    const agent_assisted_work_value = metrics.agent_gdp_usd_month * 0.45;
    const agent_generated_revenue = metrics.agent_gdp_usd_month * 0.25;
    const agent_service_revenue = metrics.agent_gdp_usd_month * 0.2;
    const agent_asset_revenue = metrics.agent_gdp_usd_month * 0.1;

    const { error } = await supabase.from("country_metric_snapshots").upsert(
      {
        country_iso3: iso3,
        period_month: periodMonth,
        agent_gdp_usd_month: metrics.agent_gdp_usd_month,
        agent_assisted_work_value_usd_month: agent_assisted_work_value,
        agent_generated_revenue_usd_month: agent_generated_revenue,
        agent_service_revenue_usd_month: agent_service_revenue,
        agent_asset_revenue_usd_month: agent_asset_revenue,
        employment_pct: metrics.employment_pct,
        top_functions: metrics.top_functions,
        median_tax_usd_month: metrics.median_tax_usd_month,
        median_revenue_usd_month: metrics.median_revenue_usd_month,
        estimated_active_agent_users: metrics.estimated_active_agent_users,
        total_agent_tax_spend_usd_month,
        productivity_multiplier: metrics.productivity_multiplier,
        confidence_score: metrics.confidence_score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "country_iso3,period_month" }
    );

    if (error) {
      console.error(`Error seeding metrics for ${iso3}:`, error);
    } else {
      console.log(`Seeded demo metrics for ${iso3}`);
    }
  }

  console.log("Demo metrics seeding complete!");
}

async function main() {
  try {
    await seedCountries();
    await seedDemoMetrics();
    console.log("\nSeeding complete!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

main();
