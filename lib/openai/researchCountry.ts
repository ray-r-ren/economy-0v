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

CRITICAL: The "agent economy" is BRAND NEW (2024-2026). It exists ONLY where there are:
1. Significant tech companies and startups
2. Developer communities
3. High-speed internet infrastructure
4. Companies with AI/automation budgets

POPULATION IS A HARD CONSTRAINT:
- A country with 100,000 people CANNOT have $100K agent GDP (that's $1/person which is absurd)
- Use this formula as an UPPER BOUND: Max Agent GDP = Population × $0.10/month for rich countries, × $0.001/month for poor countries
- Microstates (under 500K population): MAX $50K/month even if wealthy
- Small countries (under 5M): MAX $5M/month even if wealthy

GLOBAL DISTRIBUTION:
- USA: $4B/month (~40%) - 330M pop, tech dominant
- China: $2.5B/month (~25%) - 1.4B pop, massive AI investment
- Europe combined: $1.5B/month (~15%) - Multiple large economies
- Rest of developed Asia: $800M/month (~8%)
- All other countries: ~$1.2B/month (~12%)

TIER SYSTEM WITH POPULATION LIMITS:

TIER 1 - USA: $3.5-4.5B/month

TIER 2 - China: $2-3B/month (huge population + AI investment)

TIER 3 - Major European (UK, Germany, France): $200-600M/month each

TIER 4 - Advanced Tech (Japan, Canada, S.Korea, Australia, Netherlands, Israel, Singapore, Sweden, Switzerland):
  - Large countries (pop >10M): $50-250M/month
  - Small countries (pop <10M): $5-50M/month
  - Singapore (6M pop): MAX $30M/month
  - Israel (9M pop): MAX $50M/month

TIER 5 - Developed Europe (Spain, Italy, Belgium, Austria, Ireland, Norway, Denmark, Finland, Poland, NZ):
  - $10-60M/month depending on population

TIER 6 - Large Emerging (India, Brazil):
  - India (1.4B pop): $30-80M/month (mostly poverty limits adoption)
  - Brazil (215M pop): $15-40M/month

TIER 7 - Upper-Middle (Mexico, Turkey, UAE, Saudi, Thailand, Malaysia, Indonesia):
  - Large pop (>30M): $5-25M/month
  - Small pop (<30M): $2-10M/month
  - Bahrain (1.5M pop): MAX $500K/month (wealthy but TINY)

TIER 8 - Middle Markets (Vietnam, Philippines, South Africa, Colombia, Chile):
  - $500K-5M/month depending on pop and development

TIER 9 - Lower-Middle (Nigeria, Kenya, Egypt, Pakistan, Bangladesh):
  - Large pop but poor: $100K-1M/month
  
TIER 10 - Frontier/Poor (Albania, Algeria, most African, Central Asia, Caribbean, Pacific):
  - MAXIMUM $10K/month regardless of anything
  - Algeria (45M pop but very poor): MAX $8K/month
  - Albania (2.8M pop, poor): MAX $3K/month

MICROSTATES - HARD LIMITS:
  - Andorra (80K pop): MAX $5K/month (wealthy but 80K people!)
  - Monaco (40K pop): MAX $10K/month
  - San Marino (33K pop): MAX $2K/month
  - Liechtenstein (40K pop): MAX $5K/month
  - Malta (500K pop): MAX $200K/month
  - Luxembourg (650K pop): MAX $500K/month
  - Iceland (370K pop): MAX $300K/month

GULF STATES - WEALTHY BUT SMALL:
  - UAE (10M pop): MAX $15M/month
  - Qatar (2.9M pop): MAX $2M/month
  - Kuwait (4.3M pop): MAX $2M/month
  - Bahrain (1.5M pop): MAX $500K/month
  - Oman (5M pop): MAX $1M/month

KEY RULES:
1. Population × $0.10 = ABSOLUTE MAX for wealthy nations
2. Population × $0.001 = MAX for poor nations
3. No tech sector = under $10K/month
4. GDP per capita < $5,000 = under $20K/month
5. ALWAYS use lower estimates when uncertain`;

  const userPrompt = `Estimate AI agent economy for: ${countryName} (ISO: ${countryIso3})

CRITICAL STEPS:
1. Look up approximate population
2. Look up GDP per capita
3. Identify tech sector presence (minimal/some/significant)
4. Apply population constraint: Max = Pop × $0.10 (rich) or Pop × $0.001 (poor)
5. Choose the LOWER of tier estimate vs population constraint

For poor/underdeveloped countries, values should be $1K-10K/month.
For microstates (<500K pop), values should be $2K-50K/month MAX.
For small Gulf states, values should be $500K-2M/month MAX.

TOP FUNCTIONS - Use ONLY these exact short tags (pick 2-3 most relevant for THIS specific country):
- "Coding" - Software dev, engineering (tech hubs like USA, India, Israel)
- "Sales" - Sales automation, outreach (commercial economies)
- "Research" - Data analysis, academic (countries with universities, R&D)
- "Support" - Customer service (outsourcing hubs like Philippines, India)
- "Marketing" - Content, ads, social (consumer economies)
- "Finance" - Banking, trading (financial centers like UK, Singapore, Switzerland)
- "Operations" - Workflow automation (manufacturing countries like Germany, Japan, China)
- "Legal" - Contract analysis (USA, UK, Western Europe)
- "Recruiting" - HR automation (large corporate economies)
- "Design" - Creative AI (design-focused economies)
- "Content" - Writing, media (media hubs)
- "Healthcare" - Medical AI (countries with advanced healthcare)
- "E-commerce" - Online retail (China, USA, UK)
- "Manufacturing" - Industrial AI (China, Germany, Japan, Korea)

COUNTRY-SPECIFIC FUNCTION EXAMPLES:
- USA: "Coding", "Sales", "Legal" (tech + commercial + legal)
- China: "Manufacturing", "E-commerce", "Coding"
- Germany: "Manufacturing", "Operations", "Research"
- UK: "Finance", "Legal", "Marketing"
- India: "Coding", "Support", "Research"
- Japan: "Manufacturing", "Operations", "Coding"
- Singapore: "Finance", "Operations", "E-commerce"
- Brazil: "E-commerce", "Marketing", "Support"
- Philippines: "Support", "Content", "Sales"
- Switzerland: "Finance", "Research", "Healthcare"

DO NOT use long descriptions like "Software development and code assistance". Use ONLY the short tags above.

Return ONLY valid JSON:
{
  "country_iso3": "${countryIso3}",
  "evidence_items": [{"source_url": "https://worldbank.org", "source_title": "Economic indicators", "source_type": "estimate", "signal_type": "economic_analysis", "extracted_claim": "Based on population and GDP analysis", "numeric_value": null, "confidence": 0.6}],
  "estimated_active_agent_users": <very conservative number>,
  "agent_gdp_components": {
    "agent_assisted_work_value_usd_month": <50% of total>,
    "agent_generated_revenue_usd_month": <25% of total>,
    "agent_service_revenue_usd_month": <20% of total>,
    "agent_asset_revenue_usd_month": <5% of total>
  },
  "employment_pct": <percentage>,
  "deployed_agent_work_signals": <number>,
  "total_relevant_digital_work_signals": <number>,
  "top_functions": ["Tag1", "Tag2", "Tag3"],
  "median_tax_usd_month": <$5-300>,
  "median_revenue_usd_month": <$10-2500>,
  "confidence_score": 0.65,
  "notes": "Pop: X, GDP/cap: $Y, Tier Z"
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
