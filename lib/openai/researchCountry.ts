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

  const systemPrompt = `You are an expert economic analyst. Estimate AI agent economy metrics based on REALISTIC economic data.

CRITICAL: The agent economy is NASCENT and CONCENTRATED in wealthy tech hubs. Most countries have MINIMAL agent adoption.

ABSOLUTE REFERENCE POINTS (monthly):
- USA: $4.2B Agent GDP, 18% employment, $287 tax, $2340 revenue (THE GLOBAL LEADER)
- UK: $890M (21% of USA)
- Germany: $720M (17% of USA)  
- Japan: $680M (16% of USA)
- China: $2.1B (50% of USA due to scale)

TIER CLASSIFICATION WITH REALISTIC MULTIPLIERS:

TIER 1 - USA Only: 
  Agent GDP: $4-5B/mo

TIER 2 - Major Tech Powers (China, UK, Germany, Japan):
  Agent GDP: $500M-2B/mo (10-50% of USA)

TIER 3 - Advanced Economies (France, Canada, Australia, S.Korea, Netherlands, Switzerland, Israel, Singapore, Sweden, Ireland):
  Agent GDP: $100M-400M/mo (2-10% of USA)

TIER 4 - Strong Economies (Spain, Italy, Belgium, Austria, Poland, Norway, Denmark, Finland, NZ, Taiwan):
  Agent GDP: $30M-100M/mo (0.7-2.5% of USA)

TIER 5 - Upper-Middle Economies (India, Brazil, Mexico, Turkey, Indonesia, Thailand, Malaysia, UAE, Saudi):
  Agent GDP: $10M-50M/mo (0.2-1.2% of USA)

TIER 6 - Middle Economies (Vietnam, Philippines, South Africa, Egypt, Colombia, Chile, Argentina, Poland, Czech):
  Agent GDP: $3M-15M/mo (0.07-0.4% of USA)

TIER 7 - Emerging Markets (Nigeria, Kenya, Pakistan, Bangladesh, Peru, Morocco, Romania, Hungary):
  Agent GDP: $500K-5M/mo (0.01-0.12% of USA)

TIER 8 - Frontier/Small Markets (Albania, Algeria, most of Africa, Central Asia, Caribbean, Pacific):
  Agent GDP: $50K-1M/mo (0.001-0.02% of USA)

KEY PRINCIPLE: A country's agent GDP roughly correlates with:
- Its nominal GDP (smaller GDP = smaller agent economy)
- Its tech sector maturity (no tech sector = almost no agent economy)
- Its internet/cloud adoption rates
- English proficiency and global tech integration

Albania ($18B GDP) should be ~$200K-500K/mo agent GDP (TIER 8)
Algeria ($190B GDP) should be ~$1M-3M/mo agent GDP (TIER 7-8)
Nigeria ($477B GDP, large population) should be ~$3M-8M/mo (TIER 7)`;

  const userPrompt = `Estimate AI agent economy for: ${countryName} (ISO: ${countryIso3})

FIRST determine the correct tier based on the country's:
1. Nominal GDP size
2. GDP per capita  
3. Tech sector maturity
4. Developer population
5. Internet penetration

Then provide estimates WITHIN that tier's range. Be CONSERVATIVE.

Return ONLY valid JSON:
{
  "country_iso3": "${countryIso3}",
  "evidence_items": [{"source_url": "https://worldbank.org", "source_title": "Economic indicators", "source_type": "estimate", "signal_type": "economic_analysis", "extracted_claim": "Based on GDP and tech sector data", "numeric_value": null, "confidence": 0.6}],
  "estimated_active_agent_users": <realistic number based on population and tech adoption>,
  "agent_gdp_components": {
    "agent_assisted_work_value_usd_month": <50% of total>,
    "agent_generated_revenue_usd_month": <25% of total>,
    "agent_service_revenue_usd_month": <20% of total>,
    "agent_asset_revenue_usd_month": <5% of total>
  },
  "employment_pct": <0.5-18 based on tier, most countries under 5%>,
  "deployed_agent_work_signals": <number>,
  "total_relevant_digital_work_signals": <number>,
  "top_functions": ["Function1", "Function2", "Function3"],
  "median_tax_usd_month": <$20-300 based on purchasing power>,
  "median_revenue_usd_month": <$50-2500 based on tier>,
  "confidence_score": 0.65,
  "notes": "Tier X - reasoning"
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
