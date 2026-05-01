import type { ResearchOutput, CalculatedMetrics } from "@/lib/types";

/**
 * Calculate country metrics from structured research output.
 *
 * This function implements the deterministic calculation layer that computes
 * final metrics from evidence-based research data. It does not invent values -
 * if required inputs are missing or weak, it returns null.
 *
 * Formulas:
 *
 * Agent GDP = Agent-Assisted Work Value + Agent-Generated Revenue
 *           + Agent Service Revenue + Agent Asset Revenue
 *
 * Employment = (deployed_agent_work_signals / total_relevant_digital_work_signals) * 100
 *
 * Total Agent Tax Spend = estimated_active_agent_users * median_tax_usd_month
 *
 * Productivity = agent_gdp_usd_month / total_agent_tax_spend_usd_month
 */
export function calculateCountryMetrics(
  research: ResearchOutput
): CalculatedMetrics {
  const { agent_gdp_components } = research;

  // Calculate Agent GDP by summing all components
  // Only calculate if we have at least one component
  const components = [
    agent_gdp_components.agent_assisted_work_value_usd_month,
    agent_gdp_components.agent_generated_revenue_usd_month,
    agent_gdp_components.agent_service_revenue_usd_month,
    agent_gdp_components.agent_asset_revenue_usd_month,
  ];

  const hasAnyComponent = components.some((c) => c !== null && c !== undefined);

  let agent_gdp_usd_month: number | null = null;
  if (hasAnyComponent) {
    agent_gdp_usd_month = components.reduce(
      (sum, val) => sum + (val ?? 0),
      0
    );
  }

  // Calculate Employment percentage
  let employment_pct: number | null = research.employment_pct;
  if (
    employment_pct === null &&
    research.deployed_agent_work_signals !== null &&
    research.total_relevant_digital_work_signals !== null &&
    research.total_relevant_digital_work_signals > 0
  ) {
    employment_pct =
      (research.deployed_agent_work_signals /
        research.total_relevant_digital_work_signals) *
      100;
  }

  // Calculate Total Agent Tax Spend
  let total_agent_tax_spend_usd_month: number | null = null;
  if (
    research.estimated_active_agent_users !== null &&
    research.median_tax_usd_month !== null
  ) {
    total_agent_tax_spend_usd_month =
      research.estimated_active_agent_users * research.median_tax_usd_month;
  }

  // Calculate Productivity Multiplier
  let productivity_multiplier: number | null = null;
  if (
    agent_gdp_usd_month !== null &&
    total_agent_tax_spend_usd_month !== null &&
    total_agent_tax_spend_usd_month > 0
  ) {
    productivity_multiplier =
      agent_gdp_usd_month / total_agent_tax_spend_usd_month;
  }

  // Process top functions - ensure we have valid array
  const top_functions =
    research.top_functions && research.top_functions.length > 0
      ? research.top_functions.slice(0, 5) // Keep top 5
      : null;

  return {
    agent_gdp_usd_month,
    agent_assisted_work_value_usd_month:
      agent_gdp_components.agent_assisted_work_value_usd_month,
    agent_generated_revenue_usd_month:
      agent_gdp_components.agent_generated_revenue_usd_month,
    agent_service_revenue_usd_month:
      agent_gdp_components.agent_service_revenue_usd_month,
    agent_asset_revenue_usd_month:
      agent_gdp_components.agent_asset_revenue_usd_month,
    employment_pct,
    top_functions,
    median_tax_usd_month: research.median_tax_usd_month,
    median_revenue_usd_month: research.median_revenue_usd_month,
    estimated_active_agent_users: research.estimated_active_agent_users,
    total_agent_tax_spend_usd_month,
    productivity_multiplier,
    confidence_score: research.confidence_score,
  };
}

/**
 * Validate that research output has minimum required quality.
 * Returns true if the data is usable, false if it should be discarded.
 */
export function validateResearchOutput(research: ResearchOutput): boolean {
  // Must have at least some evidence
  if (!research.evidence_items || research.evidence_items.length === 0) {
    return false;
  }

  // Confidence score should be reasonable
  if (research.confidence_score < 0.1) {
    return false;
  }

  return true;
}
