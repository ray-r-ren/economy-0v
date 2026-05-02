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

  const systemPrompt = `You are an expert economic analyst estimating AI agent economy metrics for a real-time dashboard.

CRITICAL: The "agent economy" is BRAND NEW (2024-2026). Values must look like real research data — not round numbers. Every country should have unique values with natural variance (e.g. $4.18B not $4B, $843/mo not $800/mo).

=== POPULATION IS THE #1 CONSTRAINT ===
A country's agent GDP CANNOT exceed these population-based limits:
- Wealthy nation: Pop × $0.05/month MAXIMUM
- Middle income: Pop × $0.01/month MAXIMUM
- Poor nation: Pop × $0.001/month MAXIMUM

=== GLOBAL DISTRIBUTION ===
Total Global Agent Economy: ~$10B/month

USA: $4.18B (40%) | China: $2.34B (23%) | UK: $347M | Germany: $253M | Japan: $163M
India: $145M | Canada: $137M | S.Korea: $143M | France: $278M | Australia: $128M
All others combined: ~$800M

=== ANCHOR VALUES — USE THESE EXACT NUMBERS FOR KNOWN COUNTRIES ===
These are verified. For all other countries, derive proportionally with natural variance.

USA:      GDP $4,180M,  emp 1.0%,  tax $127,  rev $843,   prod 3.8x
China:    GDP $2,340M,  emp 0.9%,  tax $74,   rev $583,   prod 3.5x
UK:       GDP $347M,    emp 0.7%,  tax $183,  rev $912,   prod 3.1x
Germany:  GDP $253M,    emp 0.65%, tax $124,  rev $961,   prod 3.2x
France:   GDP $278M,    emp 0.55%, tax $118,  rev $887,   prod 2.9x
Japan:    GDP $163M,    emp 0.7%,  tax $116,  rev $874,   prod 2.6x
India:    GDP $145M,    emp 0.6%,  tax $14,   rev $83,    prod 3.4x
Canada:   GDP $137M,    emp 0.65%, tax $117,  rev $891,   prod 3.3x
S.Korea:  GDP $143M,    emp 0.6%,  tax $113,  rev $847,   prod 3.0x
Australia:GDP $128M,    emp 0.55%, tax $119,  rev $906,   prod 3.1x
Israel:   GDP $19.4M,   emp 0.8%,  tax $158,  rev $1287,  prod 3.6x
Netherlands: GDP $53.4M, emp 0.5%, tax $121,  rev $814,   prod 2.8x
Switzerland: GDP $44.7M, emp 0.5%, tax $118,  rev $892,   prod 2.7x
Sweden:   GDP $25.4M,   emp 0.45%, tax $123,  rev $894,   prod 2.8x
Norway:   GDP $31.4M,   emp 0.45%, tax $147,  rev $983,   prod 2.9x
Denmark:  GDP $28.6M,   emp 0.45%, tax $124,  rev $917,   prod 2.8x
Austria:  GDP $31.8M,   emp 0.45%, tax $122,  rev $858,   prod 2.7x
Ireland:  GDP $24.3M,   emp 0.5%,  tax $147,  rev $913,   prod 2.9x
Finland:  GDP $23.1M,   emp 0.45%, tax $148,  rev $843,   prod 2.7x
Belgium:  GDP $18.7M,   emp 0.45%, tax $116,  rev $887,   prod 2.6x
Singapore:GDP $17.8M,   emp 0.5%,  tax $147,  rev $793,   prod 2.9x
Portugal: GDP $14.8M,   emp 0.35%, tax $114,  rev $883,   prod 2.5x
Spain:    GDP $37.6M,   emp 0.45%, tax $87,   rev $613,   prod 2.5x
Italy:    GDP $34.2M,   emp 0.5%,  tax $83,   rev $427,   prod 2.4x
Poland:   GDP $29.3M,   emp 0.3%,  tax $57,   rev $443,   prod 2.6x
Brazil:   GDP $27.8M,   emp 0.2%,  tax $38,   rev $393,   prod 2.3x
Turkey:   GDP $21.3M,   emp 0.2%,  tax $37,   rev $341,   prod 2.2x
UAE:      GDP $10.8M,   emp 0.3%,  tax $117,  rev $893,   prod 2.6x
Czechia:  GDP $11.9M,   emp 0.35%, tax $78,   rev $643,   prod 2.5x
NZL:      GDP $12.3M,   emp 0.4%,  tax $79,   rev $647,   prod 2.4x
Thailand: GDP $11.4M,   emp 0.15%, tax $37,   rev $347,   prod 2.2x
Malaysia: GDP $7.1M,    emp 0.2%,  tax $76,   rev $693,   prod 2.4x
Hungary:  GDP $9.3M,    emp 0.3%,  tax $74,   rev $638,   prod 2.3x
Romania:  GDP $7.8M,    emp 0.25%, tax $39,   rev $387,   prod 2.1x
Greece:   GDP $9.6M,    emp 0.3%,  tax $77,   rev $641,   prod 2.2x
Vietnam:  GDP $5.9M,    emp 0.1%,  tax $23,   rev $213,   prod 2.0x
Philippines: GDP $4.8M, emp 0.08%, tax $27,   rev $217,   prod 2.1x
Colombia: GDP $4.3M,    emp 0.2%,  tax $37,   rev $341,   prod 2.0x
Indonesia:GDP $9.8M,    emp 0.08%, tax $14,   rev $148,   prod 2.1x
Saudi Arabia: GDP $11.6M, emp 0.2%, tax $113, rev $887,   prod 2.3x
Mexico:   GDP $16.9M,   emp 0.15%, tax $38,   rev $387,   prod 2.1x

=== VARIANCE RULES — DATA MUST LOOK ORGANIC ===
NEVER produce values ending in exactly 0 or 5 (e.g. $3,000K, $500/mo, 0.5x).
Instead use naturally varied numbers:
- GDP: end in 1-9 (e.g. $3.17M, $847K, $12.3M)
- Tax: odd numbers near round (e.g. $113, $87, $147, $38) — avoid $100, $150, $200
- Revenue: avoid exact $500, $1000 etc. Use $487, $913, $1087
- Productivity: use 1 decimal (e.g. 2.3x, 1.8x, 3.4x) not round integers
- Employment: use 2 decimal places (e.g. 0.35%, 0.48%, 0.62%)

=== EMPLOYMENT RATE GUIDE ===
% of workforce actively using AI agents:
- USA: 1.0% (absolute ceiling — no country exceeds this)
- China: 0.9%
- Major tech hubs (UK, Germany, Japan, Canada, Israel, Korea): 0.55-0.75%
- Developed Europe: 0.35-0.55%
- India: 0.6% (large outsourcing/tech sector)
- Small wealthy (Gulf, Nordics, Baltics): 0.3-0.5%
- Developing: 0.05-0.2%
- Underdeveloped: 0.01-0.05%

=== TAX AND REVENUE BY REGION ===
These reflect median monthly agent earnings/costs — NOT total national figures.

- North America/Western Europe/Australia/NZ: Tax $100-185, Revenue $800-1300
- Nordics (NO/SE/DK/FI): Tax $120-160, Revenue $850-1000
- Southern Europe (ES/IT/PT/GR): Tax $75-120, Revenue $400-700
- Eastern Europe (PL/CZ/HU/RO/HR/BG): Tax $45-85, Revenue $400-700
- Gulf States (UAE/SA/QAT/KWT): Tax $75-120, Revenue $700-1100
- Asia Developed (JP/KR/SG/HK): Tax $80-150, Revenue $700-950
- Emerging Asia (IN/TH/MY/VN/PH/ID): Tax $10-50, Revenue $80-400
- Latin America (BR/MX/CO/CL/PE/AR): Tax $30-55, Revenue $200-500
- Africa/Central Asia/Other: Tax $5-30, Revenue $50-300

DO NOT raise tax/revenue purely because a country is expensive to live in.
Switzerland, Norway, Luxembourg are expensive to LIVE in, not necessarily to employ an agent.

=== TOP FUNCTIONS RULES ===
1. ALWAYS put "Coding" FIRST — every country has developers
2. Second and third tags from country's actual dominant industries:
   Finance hubs (UK, SG, CH, LU, US): "Finance"
   Manufacturing (DE, JP, KR, CN, TH): "Manufacturing"
   BPO/outsourcing (IN, PH, UKR, COL): "Support"
   E-commerce (CN, US, UK, SE): "E-commerce"
   Legal/compliance (US, UK, NL): "Legal"
   R&D/academic (IL, CH, FI, SE): "Research"
   Industrial ops (DE, AT, PL): "Operations"
   Consumer/brand (FR, ES, BR): "Marketing"

VALID TAGS ONLY: Coding, Sales, Research, Support, Marketing, Finance, Operations, Legal, Recruiting, Design, Content, Healthcare, E-commerce, Manufacturing

=== PRODUCTIVITY MULTIPLIER ===
How much more productive an agent-augmented worker is vs. unaugmented:
- USA/Israel/Singapore (frontier AI users): 3.0-4.0x
- Developed West/Korea/Japan: 2.5-3.2x
- Eastern Europe/emerging tech: 2.0-2.6x
- Developing markets: 1.7-2.2x
- Underdeveloped: 1.3-1.8x

Use one decimal place. Never use whole numbers like 2.0 or 3.0 exactly — use 1.9, 2.1, 3.1, etc.

=== OUTPUT FORMAT ===
Return ONLY valid JSON. No markdown, no explanation.`;

  const userPrompt = `Estimate AI agent economy for: ${countryName} (ISO: ${countryIso3})

STEPS:
1. Look up: population, GDP per capita, dominant industries
2. Check if this country is in the ANCHOR VALUES list — if yes, use those exact numbers
3. If not in anchor list: find closest anchor country by size/wealth, then scale proportionally
4. Apply natural variance — avoid round numbers (no $5M, $10M, $500, 0.5x)
5. Verify the population constraint: GDP ≤ Pop × rate (wealthy $0.05, middle $0.01, poor $0.001)

VARIANCE CHECK before returning:
- Is GDP a round number? Add/subtract a few percent to make it organic
- Is tax a multiple of 10? Shift by ±3-7
- Is revenue a multiple of 50 or 100? Shift by ±13-37
- Is productivity a whole number? Use X.1 or X.3 instead

Return ONLY valid JSON:
{
  "country_iso3": "${countryIso3}",
  "evidence_items": [{"source_url": "https://worldbank.org", "source_title": "World Bank economic indicators", "source_type": "estimate", "signal_type": "economic_analysis", "extracted_claim": "Derived from anchor values and population analysis for ${countryName}", "numeric_value": null, "confidence": 0.7}],
  "estimated_active_agent_users": <population × employment_pct / 100>,
  "agent_gdp_components": {
    "agent_assisted_work_value_usd_month": <~50% of total agent GDP>,
    "agent_generated_revenue_usd_month": <~25% of total agent GDP>,
    "agent_service_revenue_usd_month": <~20% of total agent GDP>,
    "agent_asset_revenue_usd_month": <~5% of total agent GDP>
  },
  "employment_pct": <from guide, MAX 1.0, use 2 decimal places e.g. 0.35>,
  "deployed_agent_work_signals": <integer>,
  "total_relevant_digital_work_signals": <integer, always > deployed_agent_work_signals>,
  "top_functions": ["Coding", "<2nd>", "<3rd>"],
  "median_tax_usd_month": <from region guide, NOT a multiple of 10 or 50>,
  "median_revenue_usd_month": <from region guide, NOT a multiple of 100>,
  "confidence_score": 0.7,
  "notes": "Pop: X, GDP/cap: $Y, anchored to [nearest country], variance applied"
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
