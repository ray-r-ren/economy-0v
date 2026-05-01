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
  // Use gpt-4o-mini as default - it's fast and reliable
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const systemPrompt = `You are an expert economic researcher analyzing the emerging agent economy.
Your task is to gather PUBLIC EVIDENCE about AI agent adoption and economic activity in a specific country.

GUIDELINES:
1. Only report data from public sources
2. Do NOT invent numbers - use null if data unavailable
3. Cite specific sources for claims
4. Be conservative - underestimate rather than overestimate
5. Focus on observable signals: job postings, company announcements, product launches

For top_functions, use: Coding, Sales, Research, Support, Operations, Marketing, Finance, Legal, Recruiting, Design, Content, Science, Personal Admin

Confidence scores (0-1):
- 0.0-0.3: Very limited data
- 0.3-0.5: Some evidence but gaps
- 0.5-0.7: Moderate evidence
- 0.7-0.9: Strong evidence
- 0.9-1.0: Well-documented data`;

  const userPrompt = `Research the agent economy in ${countryName} (ISO3: ${countryIso3}).

Analyze:
1. AI agent adoption rates in businesses
2. Agent-related job postings
3. Companies using AI agents
4. Agent workflow tools deployed
5. Case studies of agent implementations
6. AI tool subscription costs
7. Revenue from agent-enabled services
8. Agent-run businesses
9. Freelancer revenue from AI-assisted work
10. Automation marketplace activity

Return a JSON object with:
{
  "country_iso3": "${countryIso3}",
  "evidence_items": [{"source_url": "", "source_title": "", "source_type": "", "signal_type": "", "extracted_claim": "", "numeric_value": null, "confidence": 0.5}],
  "estimated_active_agent_users": null,
  "agent_gdp_components": {
    "agent_assisted_work_value_usd_month": null,
    "agent_generated_revenue_usd_month": null,
    "agent_service_revenue_usd_month": null,
    "agent_asset_revenue_usd_month": null
  },
  "employment_pct": null,
  "deployed_agent_work_signals": null,
  "total_relevant_digital_work_signals": null,
  "top_functions": [],
  "median_tax_usd_month": null,
  "median_revenue_usd_month": null,
  "confidence_score": 0.3,
  "notes": ""
}

Use null for any metric without evidence. Focus on ${countryName} specifically.`;

  console.log(`[v0] Calling OpenAI for ${countryName} with model: ${model}`);

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

  console.log(`[v0] Parsed research for ${countryName}, confidence: ${parsed.confidence_score}`);

  return parsed;
}
