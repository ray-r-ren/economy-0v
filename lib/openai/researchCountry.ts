import OpenAI from "openai";
import type { ResearchOutput, EvidenceItem } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// JSON Schema for structured output
const researchOutputSchema = {
  type: "object" as const,
  properties: {
    country_iso3: { type: "string" as const },
    evidence_items: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          source_url: { type: "string" as const },
          source_title: { type: "string" as const },
          source_type: { type: "string" as const },
          signal_type: { type: "string" as const },
          extracted_claim: { type: "string" as const },
          numeric_value: { type: ["number", "null"] as const },
          confidence: { type: "number" as const },
        },
        required: [
          "source_url",
          "source_title",
          "source_type",
          "signal_type",
          "extracted_claim",
          "confidence",
        ],
        additionalProperties: false,
      },
    },
    estimated_active_agent_users: { type: ["number", "null"] as const },
    agent_gdp_components: {
      type: "object" as const,
      properties: {
        agent_assisted_work_value_usd_month: {
          type: ["number", "null"] as const,
        },
        agent_generated_revenue_usd_month: {
          type: ["number", "null"] as const,
        },
        agent_service_revenue_usd_month: { type: ["number", "null"] as const },
        agent_asset_revenue_usd_month: { type: ["number", "null"] as const },
      },
      required: [
        "agent_assisted_work_value_usd_month",
        "agent_generated_revenue_usd_month",
        "agent_service_revenue_usd_month",
        "agent_asset_revenue_usd_month",
      ],
      additionalProperties: false,
    },
    employment_pct: { type: ["number", "null"] as const },
    deployed_agent_work_signals: { type: ["number", "null"] as const },
    total_relevant_digital_work_signals: { type: ["number", "null"] as const },
    top_functions: {
      type: "array" as const,
      items: { type: "string" as const },
    },
    median_tax_usd_month: { type: ["number", "null"] as const },
    median_revenue_usd_month: { type: ["number", "null"] as const },
    confidence_score: { type: "number" as const },
    notes: { type: "string" as const },
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
  const model = process.env.OPENAI_MODEL || "gpt-4o";

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

  try {
    const response = await openai.responses.create({
      model,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [{ type: "web_search" }],
      text: {
        format: {
          type: "json_schema",
          name: "research_output",
          schema: researchOutputSchema,
          strict: true,
        },
      },
    });

    // Extract the text content from the response
    const textOutput = response.output.find((o) => o.type === "message");
    if (!textOutput || textOutput.type !== "message") {
      throw new Error("No text output from OpenAI");
    }

    const content = textOutput.content.find((c) => c.type === "output_text");
    if (!content || content.type !== "output_text") {
      throw new Error("No text content in response");
    }

    const parsed = JSON.parse(content.text) as ResearchOutput;

    // Ensure country_iso3 is set correctly
    parsed.country_iso3 = countryIso3;

    return parsed;
  } catch (error) {
    console.error(`Error researching country ${countryName}:`, error);

    // Return empty research output on error
    return {
      country_iso3: countryIso3,
      evidence_items: [] as EvidenceItem[],
      estimated_active_agent_users: null,
      agent_gdp_components: {
        agent_assisted_work_value_usd_month: null,
        agent_generated_revenue_usd_month: null,
        agent_service_revenue_usd_month: null,
        agent_asset_revenue_usd_month: null,
      },
      employment_pct: null,
      deployed_agent_work_signals: null,
      total_relevant_digital_work_signals: null,
      top_functions: [],
      median_tax_usd_month: null,
      median_revenue_usd_month: null,
      confidence_score: 0,
      notes: `Research failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
