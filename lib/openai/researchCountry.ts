/**
 * OpenAI Research Module for Agent Economy
 * Uses GPT-4o for more accurate research estimates
 */
import OpenAI from "openai";
import type { ResearchOutput } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Countries to exclude from research (show "No Data" for these)
const EXCLUDED_COUNTRIES = [
  "RUS", // Russia
  "TWN", // Taiwan (included in China)
  "PRK", // North Korea
  "PSE", // Palestine
  "VEN", // Venezuela
  "AFG", // Afghanistan
  "LBY", // Libya
  "SYR", // Syria
  "HKG", // Hong Kong (included in China)
  "MAC", // Macau (included in China)
];

export function isExcludedCountry(iso3: string): boolean {
  return EXCLUDED_COUNTRIES.includes(iso3);
}

export async function researchCountry(
  countryName: string,
  countryIso3: string
): Promise<ResearchOutput | null> {
  // Skip excluded countries
  if (isExcludedCountry(countryIso3)) {
    console.log(`[v0] Skipping excluded country: ${countryName} (${countryIso3})`);
    return null;
  }

  // Use GPT-4o for more accurate research (better reasoning and knowledge)
  const model = "gpt-4o";

  const systemPrompt = `You are an expert economic analyst with deep knowledge of global technology markets and AI adoption.
Your task is to provide realistic estimates for AI agent economy metrics for a specific country.

CRITICAL: Provide realistic estimates based on actual economic fundamentals:
- Country's GDP, tech sector size, and digital maturity
- Developer population and AI/ML talent pool
- Enterprise tech spending and cloud adoption
- Startup ecosystem strength
- Internet penetration and digital infrastructure

SCALING GUIDELINES (monthly figures):
Tier 1 - Major Tech Hubs (US, UK, Germany, Japan, China, South Korea):
- Agent GDP: $500M - $5B/month
- Employment: 10-20%
- Median Tax: $200-350/month
- Median Revenue: $1500-3000/month

Tier 2 - Developed Tech Markets (Canada, Australia, France, Netherlands, Singapore, Israel):
- Agent GDP: $100M - $500M/month
- Employment: 8-15%
- Median Tax: $150-280/month
- Median Revenue: $1000-2000/month

Tier 3 - Emerging Tech Markets (India, Brazil, Poland, Vietnam, Mexico, Indonesia):
- Agent GDP: $20M - $150M/month
- Employment: 3-10%
- Median Tax: $50-150/month
- Median Revenue: $400-1200/month

Tier 4 - Developing Markets (most African, Central Asian countries):
- Agent GDP: $1M - $30M/month
- Employment: 1-5%
- Median Tax: $20-80/month
- Median Revenue: $100-500/month

For top_functions, choose from: Coding, Sales, Research, Support, Operations, Marketing, Finance, Legal, Recruiting, Design, Content, Science

Confidence scoring:
- 0.4-0.5: Limited data, scaled from regional estimates
- 0.5-0.65: Some country-specific tech indicators
- 0.65-0.8: Good data from multiple sources
- 0.8+: Well-documented tech economy`;

  const userPrompt = `Estimate the AI agent economy metrics for ${countryName} (ISO3: ${countryIso3}).

Consider:
1. ${countryName}'s nominal GDP and tech sector as % of GDP
2. Developer population and tech workforce size
3. Major tech companies and startups headquartered or operating there
4. Cloud/AI adoption in enterprises
5. Relative position vs peer countries in the region

Return a JSON object with these fields (ALL fields must have numeric values, not null):
{
  "country_iso3": "${countryIso3}",
  "evidence_items": [{"source_url": "url", "source_title": "title", "source_type": "estimate", "signal_type": "adoption", "extracted_claim": "reasoning", "numeric_value": 0, "confidence": 0.5}],
  "estimated_active_agent_users": <number of people using AI agents for work>,
  "agent_gdp_components": {
    "agent_assisted_work_value_usd_month": <value of AI-assisted work automation>,
    "agent_generated_revenue_usd_month": <revenue from agent-built products>,
    "agent_service_revenue_usd_month": <revenue from AI-enabled services>,
    "agent_asset_revenue_usd_month": <revenue from AI templates/workflows>
  },
  "employment_pct": <% of digital workers using agents, typically 1-20>,
  "deployed_agent_work_signals": <observable agent deployment count>,
  "total_relevant_digital_work_signals": <total digital work signals>,
  "top_functions": ["Function1", "Function2", "Function3"],
  "median_tax_usd_month": <median monthly AI tool spend, typically $20-350>,
  "median_revenue_usd_month": <median monthly revenue per user, typically $100-3000>,
  "confidence_score": <0.4-0.8 based on data quality>,
  "notes": "Brief explanation of tier classification and key factors"
}

Be realistic - developed countries should have higher values than developing ones.`;

  console.log(`[v0] Calling OpenAI GPT-4o for ${countryName}`);

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  console.log(`[v0] Got OpenAI response for ${countryName}`);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  const parsed = JSON.parse(content) as ResearchOutput;
  parsed.country_iso3 = countryIso3;

  console.log(`[v0] Parsed research for ${countryName}, GDP components:`, parsed.agent_gdp_components);

  return parsed;
}
