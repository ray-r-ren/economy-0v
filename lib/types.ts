// Country with optional latest metrics
export interface Country {
  id: string;
  name: string;
  iso2: string | null;
  iso3: string | null;
  iso_numeric: string | null;
  region: string | null;
  subregion: string | null;
  created_at: string;
}

export interface CountryMetricSnapshot {
  id: string;
  country_iso3: string;
  period_month: string;
  agent_gdp_usd_month: number | null;
  agent_assisted_work_value_usd_month: number | null;
  agent_generated_revenue_usd_month: number | null;
  agent_service_revenue_usd_month: number | null;
  agent_asset_revenue_usd_month: number | null;
  employment_pct: number | null;
  deployed_agent_work_signals: number | null;
  total_relevant_digital_work_signals: number | null;
  top_functions: string[] | null;
  median_tax_usd_month: number | null;
  median_revenue_usd_month: number | null;
  estimated_active_agent_users: number | null;
  total_agent_tax_spend_usd_month: number | null;
  productivity_multiplier: number | null;
  confidence_score: number | null;
  updated_at: string;
}

export interface CountryWithMetrics extends Country {
  metrics: CountryMetricSnapshot | null;
}

export interface EconomySummary {
  global_agent_gdp_usd_month: number | null;
  median_tax_usd_month: number | null;
  median_revenue_usd_month: number | null;
  average_productivity_multiplier: number | null;
  countries_tracked: number;
  countries_with_data: number;
  last_updated: string | null;
}

export interface SourceSignal {
  id: string;
  country_iso3: string;
  source_url: string | null;
  source_title: string | null;
  source_type: string | null;
  signal_type: string | null;
  signal_value: Record<string, unknown> | null;
  confidence: number | null;
  captured_at: string;
}

export interface ResearchRun {
  id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  countries_processed: number;
  error_message: string | null;
}

// OpenAI Research Types
export interface EvidenceItem {
  source_url: string;
  source_title: string;
  source_type: string;
  signal_type: string;
  extracted_claim: string;
  numeric_value: number | null;
  confidence: number;
}

export interface AgentGDPComponents {
  agent_assisted_work_value_usd_month: number | null;
  agent_generated_revenue_usd_month: number | null;
  agent_service_revenue_usd_month: number | null;
  agent_asset_revenue_usd_month: number | null;
}

export interface ResearchOutput {
  country_iso3: string;
  evidence_items: EvidenceItem[];
  estimated_active_agent_users: number | null;
  agent_gdp_components: AgentGDPComponents;
  employment_pct: number | null;
  deployed_agent_work_signals: number | null;
  total_relevant_digital_work_signals: number | null;
  top_functions: string[];
  median_tax_usd_month: number | null;
  median_revenue_usd_month: number | null;
  confidence_score: number;
  notes: string;
}

export interface CalculatedMetrics {
  agent_gdp_usd_month: number | null;
  agent_assisted_work_value_usd_month: number | null;
  agent_generated_revenue_usd_month: number | null;
  agent_service_revenue_usd_month: number | null;
  agent_asset_revenue_usd_month: number | null;
  employment_pct: number | null;
  top_functions: string[] | null;
  median_tax_usd_month: number | null;
  median_revenue_usd_month: number | null;
  estimated_active_agent_users: number | null;
  total_agent_tax_spend_usd_month: number | null;
  productivity_multiplier: number | null;
  confidence_score: number | null;
}

// Column info for tooltips
export interface ColumnInfo {
  key: string;
  label: string;
  caption: string;
}

export const COLUMN_CAPTIONS: ColumnInfo[] = [
  {
    key: "rank",
    label: "Rank",
    caption: "Position based on Agent GDP, sorted descending.",
  },
  {
    key: "country",
    label: "Country",
    caption: "Country or territory name.",
  },
  {
    key: "agent_gdp",
    label: "Agent GDP",
    caption:
      "Monthly value created through agent-driven work.",
  },
  {
    key: "employment",
    label: "Employment",
    caption:
      "Share of digital work activity involving deployed agent workflows.",
  },
  {
    key: "top_functions",
    label: "Top Functions",
    caption: "Leading categories of agent-driven work in this country.",
  },
  {
    key: "median_tax",
    label: "Median Tax",
    caption:
      "Median monthly cost of the agent stack for active users.",
  },
  {
    key: "median_revenue",
    label: "Median Revenue",
    caption:
      "Median monthly revenue generated through agent-enabled work and businesses.",
  },
  {
    key: "productivity",
    label: "Productivity",
    caption: "Economic value generated per dollar of agent stack cost.",
  },
  {
    key: "updated",
    label: "Updated",
    caption: "Latest refresh of the country snapshot.",
  },
];
