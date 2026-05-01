/**
 * OpenAI Research Module for Agent Economy
 * Uses GPT-5-mini for accurate research estimates
 */
import OpenAI from "openai";
import type { ResearchOutput } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Countries to exclude from research (show "No Data" for these)
const EXCLUDED_COUNTRIES = [
  "RUS", // Russia
  "TWN", // Taiwan
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

  const model = "gpt-5-mini";

  const systemPrompt = `You are an expert economic analyst specializing in AI and technology markets.
Estimate AI agent economy metrics for countries based on their actual economic indicators.

COUNTRY TIER CLASSIFICATION (use these as baselines):

TIER 1 - Global Tech Leaders (monthly figures):
- USA: Agent GDP $4-5B, Employment 15-20%, Tax $280-320, Revenue $2000-2500
- China: Agent GDP $2-3B, Employment 12-18%, Tax $150-200, Revenue $1200-1800
- UK, Germany, Japan: Agent GDP $600M-900M, Employment 12-16%, Tax $240-300, Revenue $1500-2200

TIER 2 - Advanced Tech Economies:
- South Korea, Canada, Australia, France, Netherlands, Singapore, Israel, Sweden, Switzerland
- Agent GDP: $150M-500M, Employment 10-14%, Tax $200-280, Revenue $1200-1800

TIER 3 - Strong Tech Sectors:
- India, Brazil, Poland, Spain, Italy, Ireland, Belgium, Austria, Norway, Denmark, Finland
- Agent GDP: $50M-200M, Employment 5-10%, Tax $100-200, Revenue $600-1200

TIER 4 - Emerging Tech Markets:
- Mexico, Indonesia, Turkey, Thailand, Vietnam, Malaysia, Philippines, South Africa, UAE, Saudi Arabia
- Agent GDP: $20M-80M, Employment 3-7%, Tax $60-150, Revenue $300-800

TIER 5 - Developing Digital Economies:
- Nigeria, Egypt, Kenya, Colombia, Argentina, Chile, Peru, Pakistan, Bangladesh
- Agent GDP: $5M-30M, Employment 2-5%, Tax $30-80, Revenue $150-400

TIER 6 - Early Stage Markets:
- Most other countries in Africa, Central Asia, Caribbean, Pacific Islands
- Agent GDP: $1M-10M, Employment 1-3%, Tax $20-50, Revenue $80-200

Key factors to consider:
1. Country's nominal GDP and GDP per capita
2. Tech sector size as % of GDP
3. Developer/IT workforce population
4. Internet penetration and cloud adoption
5. Presence of major tech companies
6. Startup ecosystem maturity

For top_functions, pick 3 from: Coding, Sales, Research, Support, Operations, Marketing, Finance, Legal, Recruiting, Design, Content`;

  const userPrompt = `Provide AI agent economy estimates for: ${countryName} (${countryIso3})

Based on ${countryName}'s economic profile, classify it into the appropriate tier and provide estimates.

Return ONLY a valid JSON object:
{
  "country_iso3": "${countryIso3}",
  "evidence_items": [{"source_url": "https://example.com", "source_title": "Economic indicators", "source_type": "estimate", "signal_type": "adoption", "extracted_claim": "Based on GDP and tech sector analysis", "numeric_value": 0, "confidence": 0.6}],
  "estimated_active_agent_users": <number>,
  "agent_gdp_components": {
    "agent_assisted_work_value_usd_month": <largest component, ~50% of total>,
    "agent_generated_revenue_usd_month": <~25% of total>,
    "agent_service_revenue_usd_month": <~20% of total>,
    "agent_asset_revenue_usd_month": <~5% of total>
  },
  "employment_pct": <1-20 based on tier>,
  "deployed_agent_work_signals": <estimate>,
  "total_relevant_digital_work_signals": <estimate>,
  "top_functions": ["Function1", "Function2", "Function3"],
  "median_tax_usd_month": <monthly AI tool spend based on tier>,
  "median_revenue_usd_month": <monthly revenue per user based on tier>,
  "confidence_score": <0.5-0.75>,
  "notes": "Tier X - brief reasoning"
}`;

  console.log(`[v0] Calling GPT-5-mini for ${countryName}`);

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenAI response");
  }

  const parsed = JSON.parse(content) as ResearchOutput;
  parsed.country_iso3 = countryIso3;

  return parsed;
}
