import Anthropic from "@anthropic-ai/sdk";
import type { GSTData, MCAData, NewsFlags } from "./types";
import type { ScoreBreakdown } from "./scoring";

const SYSTEM_PROMPT = `You are a supplier due diligence analyst for the Indian B2B market.
A scoring algorithm has already calculated a trust score for this business based on hard data.
Your job is to write the plain-English explanation of WHY the business received that score.

You must respond ONLY with a valid JSON object. No preamble, no explanation, no markdown. Just the JSON.`;

function buildUserPrompt(
  gstData: GSTData,
  mcaData: MCAData | null,
  newsData: NewsFlags,
  trustScore: number,
  recommendation: string,
  breakdown: ScoreBreakdown
): string {
  const mcaSection = mcaData
    ? `MCA Data: ${JSON.stringify(mcaData)}`
    : `MCA Data: Not available — this business type (${gstData.business_type}) either has no MCA records or the API is not integrated yet. Do not treat missing MCA data as a red flag.`;

  return `This supplier has been scored by our algorithm:

SCORE: ${trustScore}/100
RECOMMENDATION: ${recommendation}

SCORE BREAKDOWN (for your reference when writing the summary):
${Object.entries(breakdown)
  .filter(([k]) => k !== "total")
  .map(([k, v]) => `  ${k}: ${v}`)
  .join("\n")}

RAW BUSINESS DATA:
GST Data: ${JSON.stringify(gstData)}
${mcaSection}
News Scan: ${JSON.stringify(newsData)}

Write an explanation of this score. Return this exact JSON — no extra fields:

{
  "company_name": "<full legal name from GST data>",
  "ai_summary": "<2-3 paragraphs in plain English. Explain the score honestly — what is good about this business and what concerns exist. Do NOT mention the numeric score. Write as if advising a small business owner with no legal knowledge.>",
  "red_flags": ["<specific concern based on the data>", "..."],
  "positive_signals": ["<specific positive from the data>", "..."]
}

Rules:
- red_flags should only list things actually supported by the data (e.g. inactive GST, very new registration, negative news). If nothing is wrong, return an empty array [].
- positive_signals should reflect real positives (active GST, long registration, clean news etc).
- Do NOT flag missing filing history as a red flag — the GST API does not reliably return filing data for active businesses.
- Do NOT flag missing MCA data for proprietorships or partnerships — they are not registered with MCA.
- Keep ai_summary under 200 words. Simple English, no jargon.`;
}

export async function generateReport(
  gstData: GSTData,
  mcaData: MCAData | null,
  newsData: NewsFlags,
  trustScore: number,
  recommendation: string,
  breakdown: ScoreBreakdown
): Promise<{
  company_name: string;
  ai_summary: string;
  red_flags: string[];
  positive_signals: string[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(
          gstData,
          mcaData,
          newsData,
          trustScore,
          recommendation,
          breakdown
        ),
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text response");
  }

  let raw = textBlock.text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(raw);

  if (typeof parsed.ai_summary !== "string" || !parsed.ai_summary) {
    throw new Error("Missing ai_summary from Claude");
  }

  return {
    company_name: String(parsed.company_name || gstData.legal_name),
    ai_summary: parsed.ai_summary,
    red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : [],
    positive_signals: Array.isArray(parsed.positive_signals)
      ? parsed.positive_signals
      : [],
  };
}
