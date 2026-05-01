/**
 * OpenAI Research Module for Agent Economy
 * Uses GPT-5.1 for accurate research estimates
 */
import OpenAI from "openai";
import type { ResearchOutput } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Countries to exclude from research (show "No Data" for these)
const EXCLUDED_COUNTRIES = [
  "RUS", "TWN", "PRK", "PSE", "VEN", "AFG", "LBY", "SYR", "HKG", "MAC",
];

export function isExcludedCountry(iso3: string): boolean {
  return EXCLUDED_COUNTRIES.includes(iso3);
}

export async function researchCountry(
  countryName: string,
  countryIso3: string
): Promise<ResearchOutput | null> {
  if (isExcludedCountry(countryIso3)) {
    console.log(`[v0] Skipping excluded country: ${countryName}`);
    return null;
  }

  const model = "gpt-5.1";

  const systemPrompt = `You are an expert economic analyst estimating AI agent economy metrics.

CRITICAL CONTEXT: The "agent economy" is EXTREMELY NEW (2024-2026) and almost entirely concentrated in Silicon Valley, London, and a handful of global tech hubs. Most of the world has NEGLIGIBLE agent adoption.

ABSOLUTE ANCHORS (use these as your reference):
- USA: $4.2B/month - This is THE global leader with 80%+ of agent economy activity
- China: $800M/month - Large scale but lower per-capita adoption
- UK: $400M/month - Strong fintech/AI hub
- Germany: $300M/month - Industrial AI adoption
- All other countries COMBINED: ~$500M/month

REALISTIC TIER SYSTEM:

TIER 1 - USA ONLY:
  Agent GDP: $3-5 BILLION/month
  Employment: 15-20%
  This is where OpenAI, Anthropic, Google AI, etc. are based

TIER 2 - Major Tech Powers (China, UK, Germany, Japan, Canada, France):
  Agent GDP: $100-800 MILLION/month
  Employment: 5-12%

TIER 3 - Advanced Small Economies (Australia, Netherlands, Israel, Singapore, S.Korea, Sweden, Switzerland):
  Agent GDP: $30-150 MILLION/month
  Employment: 4-10%

TIER 4 - Developed Economies (Spain, Italy, Belgium, Austria, Ireland, Norway, Denmark, Finland, NZ):
  Agent GDP: $10-50 MILLION/month
  Employment: 2-6%

TIER 5 - Large Emerging (India, Brazil):
  Agent GDP: $20-80 MILLION/month (large population offsets low per-capita)
  Employment: 1-4%

TIER 6 - Upper-Middle Markets (Mexico, Poland, Turkey, UAE, Saudi, Thailand, Malaysia, Indonesia):
  Agent GDP: $5-25 MILLION/month
  Employment: 1-3%

TIER 7 - Middle Markets (Vietnam, Philippines, South Africa, Egypt, Colombia, Chile, Argentina, Czech, Romania):
  Agent GDP: $1-8 MILLION/month
  Employment: 0.5-2%

TIER 8 - Emerging Markets (Nigeria, Kenya, Pakistan, Bangladesh, Peru, Morocco, Hungary, Ukraine):
  Agent GDP: $200K-3 MILLION/month
  Employment: 0.2-1%

TIER 9 - Frontier Markets (Albania, Algeria, most African countries, Central Asia, Caribbean, Pacific islands):
  Agent GDP: $10K-300K/month
  Employment: 0.05-0.5%
  These countries have almost NO meaningful agent economy - just a few individual freelancers

SPECIFIC EXAMPLES:
- Albania (3M population, $18B GDP, minimal tech): $20K-50K/month MAXIMUM
- Algeria (45M population, $190B GDP, very limited tech): $50K-150K/month MAXIMUM  
- Nigeria (220M population, some tech hubs): $1-3M/month
- Philippines (115M population, BPO industry): $3-6M/month
- India (1.4B population, major IT sector): $40-70M/month

KEY RULE: If a country doesn't have significant venture capital, tech startups, or cloud computing adoption, its agent GDP should be under $1M/month.`;

  const userPrompt = `Estimate AI agent economy for: ${countryName} (ISO: ${countryIso3})

STEP 1: Identify the correct tier (1-9) based on:
- Population size
- Nominal GDP and GDP per capita
- Tech startup ecosystem presence
- Cloud/AI adoption rates
- Developer community size

STEP 2: Estimate WITHIN that tier's range. When uncertain, use the LOWER end.

Return ONLY valid JSON:
{
  "country_iso3": "${countryIso3}",
  "evidence_items": [{"source_url": "https://worldbank.org", "source_title": "Economic indicators", "source_type": "estimate", "signal_type": "economic_analysis", "extracted_claim": "Based on GDP and tech sector analysis", "numeric_value": null, "confidence": 0.6}],
  "estimated_active_agent_users": <number - be conservative>,
  "agent_gdp_components": {
    "agent_assisted_work_value_usd_month": <50% of total GDP>,
    "agent_generated_revenue_usd_month": <25% of total GDP>,
    "agent_service_revenue_usd_month": <20% of total GDP>,
    "agent_asset_revenue_usd_month": <5% of total GDP>
  },
  "employment_pct": <percentage based on tier>,
  "deployed_agent_work_signals": <number>,
  "total_relevant_digital_work_signals": <number>,
  "top_functions": ["Function1", "Function2", "Function3"],
  "median_tax_usd_month": <$15-300 based on local purchasing power>,
  "median_revenue_usd_month": <$30-2500 based on tier>,
  "confidence_score": 0.65,
  "notes": "Tier X - brief reasoning"
}`;

  console.log(`[v0] Calling GPT-5.1 for ${countryName}`);

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
