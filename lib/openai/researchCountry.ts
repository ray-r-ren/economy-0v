/**
 * OpenAI Research Module for Agent Economy
 * Researches country-specific agent economy data using GPT
 */
import OpenAI from "openai";
import type { ResearchOutput } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function researchCountry(
  countryName: string,
  countryIso3: string
): Promise<ResearchOutput> {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const systemPrompt = `You are an expert economic analyst specializing in the emerging AI agent economy.
Your task is to ESTIMATE economic metrics for AI agent activity in a specific country.

IMPORTANT: You MUST provide numeric estimates, not null values. Base your estimates on:
- Country's GDP and tech sector size
- AI adoption indicators (ChatGPT usage, GitHub activity, AI job postings)
- Tech workforce size
- Digital economy maturity
- Comparable data from similar countries

ESTIMATION APPROACH:
1. Start with the country's digital economy size
2. Estimate what % involves AI/agent-assisted work (typically 1-20% in developed countries)
3. Break down into components: internal work automation, revenue generation, services, assets
4. Scale based on country's tech maturity vs the US (use US as baseline)

REFERENCE BASELINES (monthly, use for scaling):
- US: Agent GDP ~$4B, Employment 18%, Median Tax $280, Median Revenue $2300, Users 8.5M
- UK: Agent GDP ~$900M, Employment 15%, Median Tax $240, Median Revenue $1900
- Germany: Agent GDP ~$720M, Employment 13%, Median Tax $260, Median Revenue $1650
- Developing countries: Scale down by 5-50x based on tech sector size

For top_functions use: Coding, Sales, Research, Support, Operations, Marketing, Finance, Legal, Recruiting, Design, Content

Confidence scoring (be realistic):
- 0.3-0.4: Limited direct data, extrapolated from regional/global trends
- 0.4-0.6: Some country-specific indicators available
- 0.6-0.8: Good data from multiple sources
- 0.8+: Well-documented AI economy metrics`;

  const userPrompt = `Estimate the agent economy metrics for ${countryName} (ISO3: ${countryIso3}).

Consider ${countryName}'s:
- Total GDP and tech sector contribution
- Digital workforce and developer population
- AI/ML adoption in enterprises
- Startup ecosystem and tech companies
- Remote work and gig economy size
- AI tool usage patterns

You MUST return numeric estimates (not null) based on reasonable extrapolation. Return JSON:
{
  "country_iso3": "${countryIso3}",
  "evidence_items": [
    {
      "source_url": "https://example.com",
      "source_title": "Data source name",
      "source_type": "report|article|statistics|estimate",
      "signal_type": "adoption|revenue|employment|tools",
      "extracted_claim": "Description of the evidence or reasoning",
      "numeric_value": 12345,
      "confidence": 0.5
    }
  ],
  "estimated_active_agent_users": <number - people actively using AI agents for work>,
  "agent_gdp_components": {
    "agent_assisted_work_value_usd_month": <number - value of AI-assisted internal work>,
    "agent_generated_revenue_usd_month": <number - revenue from agent-built products/businesses>,
    "agent_service_revenue_usd_month": <number - revenue from AI-enabled services>,
    "agent_asset_revenue_usd_month": <number - revenue from templates, workflows, automations>
  },
  "employment_pct": <number 0-100 - % of digital workers using agents>,
  "deployed_agent_work_signals": <number - observable agent deployment signals>,
  "total_relevant_digital_work_signals": <number - total digital work signals>,
  "top_functions": ["Function1", "Function2", "Function3"],
  "median_tax_usd_month": <number - median monthly AI tool spend per user>,
  "median_revenue_usd_month": <number - median monthly revenue per active agent user>,
  "confidence_score": <number 0-1>,
  "notes": "Brief explanation of estimation methodology"
}

Provide your best estimates for ${countryName}. Use reasonable scaling from known data.`;

  console.log(`[v0] Calling OpenAI for ${countryName} with model: ${model}`);

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  console.log(`[v0] Got OpenAI response for ${countryName}`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  const parsed = JSON.parse(content) as ResearchOutput;
  parsed.country_iso3 = countryIso3;

  console.log(`[v0] Parsed research for ${countryName}, confidence: ${parsed.confidence_score}`);

  return parsed;
}
