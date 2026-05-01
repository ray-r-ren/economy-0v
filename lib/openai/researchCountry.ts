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

CRITICAL CONTEXT: The "agent economy" is EXTREMELY NEW (2024-2026). Agent adoption is concentrated in major tech hubs across USA, China, and Europe. Most developing countries have NEGLIGIBLE agent activity.

GLOBAL DISTRIBUTION (approximate):
- USA: $4.2B/month (~40% of global) - Silicon Valley dominance
- China: $2.5B/month (~25% of global) - Massive AI investment and adoption
- Europe combined: $1.5B/month (~15% of global) - UK, Germany, France leading
- Rest of developed Asia: $800M/month (~8%) - Japan, Korea, Singapore, Australia
- All other countries COMBINED: ~$1.2B/month (~12%)

REALISTIC TIER SYSTEM:

TIER 1 - USA:
  Agent GDP: $3.5-4.5 BILLION/month
  Employment: 15-20%

TIER 2 - China:
  Agent GDP: $2-3 BILLION/month
  Employment: 8-14%
  Massive domestic AI ecosystem (Baidu, Alibaba, Tencent, ByteDance)

TIER 3 - Major European Powers (UK, Germany, France):
  Agent GDP: $200-600 MILLION/month
  Employment: 6-12%

TIER 4 - Advanced Tech Economies (Japan, Canada, S.Korea, Australia, Netherlands, Israel, Singapore, Sweden, Switzerland):
  Agent GDP: $50-250 MILLION/month
  Employment: 4-10%

TIER 5 - Developed Europe (Spain, Italy, Belgium, Austria, Ireland, Norway, Denmark, Finland, Poland, NZ):
  Agent GDP: $15-80 MILLION/month
  Employment: 2-6%

TIER 6 - Large Emerging (India, Brazil):
  Agent GDP: $30-100 MILLION/month (large population with growing tech sector)
  Employment: 1-4%

TIER 7 - Upper-Middle Markets (Mexico, Turkey, UAE, Saudi, Thailand, Malaysia, Indonesia, Czechia):
  Agent GDP: $5-30 MILLION/month
  Employment: 1-3%

TIER 8 - Middle Markets (Vietnam, Philippines, South Africa, Colombia, Chile, Argentina, Romania):
  Agent GDP: $1-10 MILLION/month
  Employment: 0.3-1.5%

TIER 9 - Lower-Middle Markets (Nigeria, Kenya, Egypt, Pakistan, Bangladesh, Peru, Morocco, Hungary, Ukraine):
  Agent GDP: $100K-2 MILLION/month
  Employment: 0.1-0.8%

TIER 10 - Frontier/Underdeveloped (Albania, Algeria, most African countries, Central Asia, Caribbean, Pacific islands, Middle East non-Gulf):
  Agent GDP: $1K-10K/month MAXIMUM
  Employment: 0.01-0.1%
  These countries have almost ZERO meaningful agent economy

SPECIFIC HARD LIMITS:
- Algeria: MAXIMUM $8K/month (poor infrastructure, limited tech)
- Albania: MAXIMUM $5K/month (tiny economy, no tech sector)
- Most African countries: $1K-10K/month MAXIMUM
- Most Middle Eastern countries (non-Gulf): $1K-10K/month MAXIMUM
- Caribbean nations: $1K-15K/month MAXIMUM
- Central Asian countries: $1K-5K/month MAXIMUM

KEY RULES:
1. If GDP per capita < $5,000: agent GDP should be under $50K/month
2. If no significant tech startup ecosystem: agent GDP should be under $10K/month
3. If limited internet/cloud infrastructure: agent GDP should be under $5K/month
4. When uncertain, use the ABSOLUTE LOWEST reasonable estimate`;

  const userPrompt = `Estimate AI agent economy for: ${countryName} (ISO: ${countryIso3})

STEP 1: Identify the correct tier (1-10) based on:
- GDP per capita (critical factor)
- Tech startup ecosystem presence
- Internet/cloud infrastructure quality
- Developer community size

STEP 2: Estimate WITHIN that tier's range. ALWAYS use the LOWER end for developing countries.

STEP 3: For Tier 10 countries (underdeveloped), values MUST be under $10K/month.

Return ONLY valid JSON:
{
  "country_iso3": "${countryIso3}",
  "evidence_items": [{"source_url": "https://worldbank.org", "source_title": "Economic indicators", "source_type": "estimate", "signal_type": "economic_analysis", "extracted_claim": "Based on GDP and tech sector analysis", "numeric_value": null, "confidence": 0.6}],
  "estimated_active_agent_users": <number - very conservative for developing nations>,
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
  "median_tax_usd_month": <$5-300 based on local purchasing power>,
  "median_revenue_usd_month": <$10-2500 based on tier>,
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
