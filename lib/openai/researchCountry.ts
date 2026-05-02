/**
 * OpenAI Research Module for Agent Economy
 * Uses GPT-5.1 for accurate research estimates
 * 
 * LESSONS LEARNED (for future prompt improvements):
 * - Population is the #1 constraint - small countries cannot have large agent GDP
 * - Employment rates should be conservative (USA ~1%, major countries 0.5-0.9%)
 * - Tax/Revenue should be similar across similar economic regions
 * - All countries should have "Coding" as a top function
 * - Gulf states are wealthy but TINY populations
 * - Microstates (under 1M pop) have negligible agent economies
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

=== POPULATION IS THE #1 CONSTRAINT ===
A country's agent GDP CANNOT exceed these population-based limits:
- Wealthy nation: Pop × $0.05/month MAXIMUM
- Middle income: Pop × $0.01/month MAXIMUM  
- Poor nation: Pop × $0.001/month MAXIMUM

EXAMPLES:
- Switzerland (9M pop, wealthy): MAX 9M × $0.05 = $450K/month → we set ~$45M because strong tech
- Bahrain (1.5M pop, wealthy): MAX 1.5M × $0.05 = $75K/month → we set ~$500K with finance sector
- Albania (2.8M pop, poor): MAX 2.8M × $0.001 = $2.8K/month → we set ~$3K

=== GLOBAL DISTRIBUTION (MEMORIZE THIS) ===
Total Global Agent Economy: ~$10B/month

USA: $4B/month (40%) - 330M pop, tech dominant
China: $2.5B/month (25%) - 1.4B pop, massive AI investment  
UK: $500M/month (5%) - 67M pop, financial/tech hub
Germany: $450M/month (4.5%) - 83M pop, industrial tech
Japan: $350M/month (3.5%) - 125M pop, tech but aging
France: $250M/month (2.5%) - 67M pop
Canada: $200M/month (2%) - 40M pop, tech hubs
India: $145M/month (1.5%) - 1.4B pop but mostly poor
Australia: $120M/month (1.2%) - 26M pop
South Korea: $100M/month (1%) - 52M pop
All others combined: ~$900M/month (9%)

=== TIER REFERENCE SHEET (EXACT VALUES) ===

TIER 1 - USA ONLY:
- GDP: $4B/month, Employment: 1.0%
- Tax: $150/mo, Revenue: $1200/mo
- Functions: ["Coding", "Sales", "Legal"]

TIER 2 - CHINA ONLY:
- GDP: $2.5B/month, Employment: 0.9%
- Tax: $80/mo, Revenue: $800/mo
- Functions: ["Coding", "Manufacturing", "E-commerce"]

TIER 3 - MAJOR EUROPEAN (UK, Germany, France):
- UK: $500M, 0.7% emp, ["Coding", "Finance", "Legal"]
- Germany: $450M, 0.65% emp, ["Coding", "Manufacturing", "Operations"]
- France: $250M, 0.55% emp, ["Coding", "Research", "Marketing"]
- Tax: $100-120/mo, Revenue: $800-1000/mo

TIER 4 - ADVANCED ECONOMIES:
- Japan: $350M, 0.7% emp, ["Coding", "Manufacturing", "Operations"]
- Canada: $200M, 0.65% emp, ["Coding", "Research", "Finance"]
- Australia: $120M, 0.55% emp, ["Coding", "Finance", "Research"]
- South Korea: $100M, 0.6% emp, ["Coding", "Manufacturing", "Operations"]
- Netherlands: $50M, 0.5% emp
- Switzerland: $45M, 0.5% emp
- Israel: $50M, 0.8% emp (high tech density)
- Singapore: $30M, 0.5% emp (small but tech hub)
- Tax: $100-120/mo, Revenue: $800-950/mo

TIER 5 - LARGE EMERGING:
- India: $145M, 0.6% emp, ["Coding", "Support", "Research"]
- Brazil: $28M, 0.2% emp, ["Coding", "E-commerce", "Marketing"]
- Tax: $40-60/mo, Revenue: $400-600/mo

TIER 6 - MID-TIER DEVELOPED (Pop 5-20M, developed):
- Belgium, Sweden, Austria, Ireland, Norway, Denmark, Finland: $10-25M each
- Employment: 0.35-0.5%
- Tax: $100-150/mo, Revenue: $800-1000/mo

TIER 7 - EASTERN EUROPE (lower cost, growing tech):
- Poland: $18M, 0.3% emp
- Czechia: $12M, 0.35% emp  
- Romania: $8M, 0.25% emp
- Hungary, Greece: $10M each
- Tax: $50-80/mo, Revenue: $500-700/mo

TIER 8 - UPPER-MIDDLE MARKETS:
- Turkey: $22M, 0.2% emp
- Mexico: $15M, 0.15% emp
- Indonesia: $10M, 0.08% emp
- Thailand, Malaysia: $5-8M each
- Tax: $30-50/mo, Revenue: $300-500/mo

TIER 9 - SMALL WEALTHY STATES (wealthy but tiny pop):
- UAE (10M): MAX $15M, 0.3% emp
- Qatar (3M): MAX $2M, 0.3% emp
- Kuwait (4M): MAX $2M, 0.3% emp
- Luxembourg (650K): MAX $500K, 0.5% emp
- Malta (500K): MAX $200K, 0.35% emp
- Iceland (370K): MAX $300K, 0.4% emp
- Tax: $80-120/mo, Revenue: $700-900/mo

TIER 10 - MICROSTATES (under 500K pop):
- Andorra (80K): MAX $5K, 0.3% emp
- Monaco (40K): MAX $10K, 0.4% emp
- Liechtenstein (40K): MAX $5K, 0.3% emp
- San Marino (33K): MAX $2K, 0.2% emp

TIER 11 - DEVELOPING/FRONTIER:
- Vietnam: $6M, 0.1% emp
- Philippines: $5M, 0.08% emp
- Colombia, Chile, Peru: $2-4M each
- South Africa: $4M, 0.1% emp
- Most African countries: $10K-500K
- Most Central Asian: $10K-200K
- Tax: $20-40/mo, Revenue: $200-400/mo

TIER 12 - UNDERDEVELOPED (GDP per capita < $5,000):
- Algeria, Morocco: MAX $10K
- Albania, Bosnia: MAX $5K
- Most of Africa: MAX $10K
- Tax: $10-20/mo, Revenue: $100-200/mo

=== EMPLOYMENT RATE GUIDE ===
Employment % means "% of workforce using AI agents regularly"

- USA: 1.0% (the global leader)
- China: 0.9%
- Major tech hubs (UK, Germany, Japan, Canada, Israel): 0.5-0.8%
- Developed Europe: 0.35-0.55%
- Emerging large (India, Brazil): 0.15-0.6%
- Small wealthy (Gulf, microstates): 0.3-0.5%
- Developing: 0.05-0.2%
- Underdeveloped: 0.01-0.05%

NEVER exceed 1.0% for any country except USA.

=== TAX AND REVENUE NORMALIZATION ===
Tax and Revenue should be SIMILAR within economic regions:

- North America/Western Europe/Australia: Tax $100-150, Revenue $800-1200
- Eastern Europe: Tax $50-80, Revenue $500-700
- Asia Developed (Japan, Korea, Singapore): Tax $80-120, Revenue $700-900
- Emerging (India, Brazil, Mexico): Tax $30-60, Revenue $300-600
- Developing: Tax $15-40, Revenue $150-400
- Underdeveloped: Tax $5-20, Revenue $50-200

DO NOT make Switzerland significantly higher just because it's expensive - normalize within region.

=== TOP FUNCTIONS RULES ===
1. ALWAYS include "Coding" as the FIRST tag (all countries have developers)
2. Pick 2 more based on the country's actual economy:
   - Finance hubs: "Finance" (UK, Singapore, Switzerland, Luxembourg)
   - Manufacturing: "Manufacturing" (China, Germany, Japan, Korea)
   - Support outsourcing: "Support" (India, Philippines)
   - E-commerce: "E-commerce" (China, USA, UK)
   - Legal: "Legal" (USA, UK)
   - Research: "Research" (universities, R&D countries)
   - Operations: "Operations" (industrial countries)
   - Marketing: "Marketing" (consumer economies)

VALID TAGS ONLY: Coding, Sales, Research, Support, Marketing, Finance, Operations, Legal, Recruiting, Design, Content, Healthcare, E-commerce, Manufacturing

=== OUTPUT FORMAT ===
Return ONLY valid JSON. No markdown, no explanation.`;

  const userPrompt = `Estimate AI agent economy for: ${countryName} (ISO: ${countryIso3})

STEPS:
1. What is the population?
2. What is GDP per capita?
3. What tier does this country fall into from the reference sheet?
4. Apply the EXACT values from that tier (or interpolate)
5. Verify population constraint is satisfied

Return ONLY valid JSON:
{
  "country_iso3": "${countryIso3}",
  "evidence_items": [{"source_url": "https://worldbank.org", "source_title": "Economic indicators", "source_type": "estimate", "signal_type": "economic_analysis", "extracted_claim": "Based on tier reference and population analysis", "numeric_value": null, "confidence": 0.7}],
  "estimated_active_agent_users": <conservative number based on population and employment %>,
  "agent_gdp_components": {
    "agent_assisted_work_value_usd_month": <50% of total GDP>,
    "agent_generated_revenue_usd_month": <25% of total GDP>,
    "agent_service_revenue_usd_month": <20% of total GDP>,
    "agent_asset_revenue_usd_month": <5% of total GDP>
  },
  "employment_pct": <from tier guide, MAX 1.0% even for USA>,
  "deployed_agent_work_signals": <number>,
  "total_relevant_digital_work_signals": <number>,
  "top_functions": ["Coding", "<2nd tag>", "<3rd tag>"],
  "median_tax_usd_month": <from tier guide>,
  "median_revenue_usd_month": <from tier guide>,
  "confidence_score": 0.7,
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
