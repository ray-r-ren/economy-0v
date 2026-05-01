// OpenAI research module - updated to remove max_tokens parameter
import OpenAI from "openai";
import type { ResearchOutput } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper for nullable number type in JSON schema
const nullableNumber = {
  anyOf: [{ type: "number" }, { type: "null" }],
};

// JSON Schema for structured output (OpenAI strict mode compatible)
const researchOutputSchema = {
  type: "object",
  properties: {
    country_iso3: { type: "string" },
    evidence_items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          source_url: { type: "string" },
          source_title: { type: "string" },
          source_type: { type: "string" },
          signal_type: { type: "string" },
          extracted_claim: { type: "string" },
          numeric_value: nullableNumber,
          confidence: { type: "number" },
        },
        required: [
          "source_url",
          "source_title",
          "source_type",
          "signal_type",
          "extracted_claim",
          "numeric_value",
          "confidence",
        ],
        additionalProperties: false,
      },
    },
    estimated_active_agent_users: nullableNumber,
    agent_gdp_components: {
      type: "object",
      properties: {
        agent_assisted_work_value_usd_month: nullableNumber,
        agent_generated_revenue_usd_month: nullableNumber,
        agent_service_revenue_usd_month: nullableNumber,
        agent_asset_revenue_usd_month: nullableNumber,
      },
      required: [
        "agent_assisted_work_value_usd_month",
        "agent_generated_revenue_usd_month",
        "agent_service_revenue_usd_month",
        "agent_asset_revenue_usd_month",
      ],
      additionalProperties: false,
    },
    employment_pct: nullableNumber,
    deployed_agent_work_signals: nullableNumber,
    total_relevant_digital_work_signals: nullableNumber,
    top_functions: {
      type: "array",
      items: { type: "string" },
    },
    median_tax_usd_month: nullableNumber,
    median_revenue_usd_month: nullableNumber,
    confidence_score: { type: "number" },
    notes: { type: "string" },
  },
  required: [
    "country_iso3",
    "evidence_items",
    "estimated_active_agent_users",
    "agent_gdp_components",
    "employment_pct",
    "deployed_agent_work_signals",
    "total_relevant_digital_work_signals",
    "top_functions",
    "median_tax_usd_month",
    "median_revenue_usd_month",
    "confidence_score",
    "notes",
  ],
  additionalProperties: false,
};

/**
 * Research a country's agent economy using OpenAI's Responses API with web search.
 *
 * This function gathers public evidence about:
 * - Agent adoption rates and deployment
 * - Agent-related job demand and workflows
 * - Public company usage and case studies
 * - Common agent tools and apps
 * - Agent-enabled service revenue
 * - Agent-run businesses and products
 * - Bounty/template/workflow revenue
 * - Common agent stack costs
 * - Top deployed agent functions
 */
export async function researchCountry(
  countryName: string,
  countryIso3: string
): Promise<ResearchOutput> {
  // Use a known working model - gpt-4o-mini is fast and cheap
  const envModel = process.env.OPENAI_MODEL;
  const validModels = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"];
  const model = envModel && validModels.includes(envModel) ? envModel : "gpt-4o-mini";
  
  console.log(`[v0] OPENAI_MODEL env: "${envModel}", using model: "${model}"`);

  const systemPrompt = `You are an expert economic researcher analyzing the emerging agent economy across countries.

Your task is to gather PUBLIC EVIDENCE about AI agent adoption and economic activity in a specific country.

IMPORTANT GUIDELINES:
1. Only report data you can find from public sources
2. Do NOT invent or fabricate numbers
3. If data is unavailable, return null for that field
4. Cite specific sources for each claim
5. Be conservative in estimates - underestimate rather than overestimate
6. Focus on observable signals: job postings, company announcements, product launches, revenue reports

For each evidence item, classify the signal_type as one of:
- adoption_rate: General AI/agent adoption metrics
- job_demand: Agent-related job postings or hiring trends
- company_usage: Companies deploying agents
- case_study: Specific success stories or implementations
- tool_pricing: Agent tool/service pricing data
- revenue_report: Revenue attributed to agent work
- workflow_deployment: Active agent workflows/automations
- service_offering: Agent-enabled services being sold
- market_research: Industry reports or surveys

For top_functions, use these categories:
Coding, Sales, Research, Support, Operations, Marketing, Finance, Legal, Recruiting, Design, Content, Science, Personal Admin

Confidence scores should be between 0 and 1:
- 0.0-0.3: Very limited or uncertain data
- 0.3-0.5: Some evidence but gaps
- 0.5-0.7: Moderate evidence from multiple sources
- 0.7-0.9: Strong evidence with clear citations
- 0.9-1.0: Very strong, well-documented data`;

  const userPrompt = `Research the agent economy in ${countryName} (ISO3: ${countryIso3}).

Search for and analyze:
1. AI agent adoption rates and deployment in businesses
2. Agent-related job postings and demand
3. Companies publicly using AI agents for operations
4. Agent workflow tools being deployed
5. Public case studies of agent implementations
6. Common AI/agent tool subscriptions and their costs
7. Revenue from agent-enabled services
8. Agent-run businesses or agent-built products
9. Freelancer/agency revenue from AI-assisted work
10. Workflow, template, and automation marketplace activity

Extract specific evidence with sources. Estimate monthly values where supported by data.
Return null for any metric without supporting evidence.

Focus on ${countryName} specifically, not global data.`;

  console.log(`[v0] Starting OpenAI research for ${countryName} with model ${model}`);
  
  // Use Chat Completions API with JSON mode
  // Note: Do NOT use max_tokens or max_completion_tokens - let it use defaults
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `${userPrompt}\n\nRespond with a valid JSON object. Include these fields: country_iso3, evidence_items (array), estimated_active_agent_users (number or null), agent_gdp_components (object with agent_assisted_work_value_usd_month, agent_generated_revenue_usd_month, agent_service_revenue_usd_month, agent_asset_revenue_usd_month), employment_pct (number or null), deployed_agent_work_signals (number or null), total_relevant_digital_work_signals (number or null), top_functions (array of strings), median_tax_usd_month (number or null), median_revenue_usd_month (number or null), confidence_score (number 0-1), notes (string).` 
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  console.log(`[v0] OpenAI response received for ${countryName}`);

  // Extract the content from the response
  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  console.log(`[v0] Parsing JSON response for ${countryName}`);
  const parsed = JSON.parse(content) as ResearchOutput;

  // Ensure country_iso3 is set correctly
  parsed.country_iso3 = countryIso3;

  return parsed;
}
