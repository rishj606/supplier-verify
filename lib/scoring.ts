import type { GSTData, MCAData, NewsFlags } from "./types";

// Bump this number whenever you change the scoring algorithm.
// The cache check will automatically ignore reports scored with an older version.
export const SCORE_VERSION = 1;

export interface ScoreBreakdown {
  gst_status: number;       // max 30
  registration_age: number; // max 25
  business_type: number;    // max 15
  verification: number;     // max 15 — MCA when available, neutral until then
  news: number;             // max 15
  total: number;
}

export interface ScoringResult {
  trust_score: number;
  recommendation: "approve" | "caution" | "reject";
  breakdown: ScoreBreakdown;
}

// ─── Individual scoring functions ────────────────────────────────────────────

function scoreGSTStatus(status: string): number {
  switch (status) {
    case "active":        return 30;
    case "inactive":      return 5;
    case "cancelled":     return 0;
    case "lookup_failed": return 12; // neutral — can't confirm, don't punish
    default:              return 12;
  }
}

function parseRegistrationDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Appyflow returns DD/MM/YYYY
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function getAgeYears(dateStr: string): number | null {
  const date = parseRegistrationDate(dateStr);
  if (!date) return null;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

function scoreRegistrationAge(dateStr: string): number {
  const years = getAgeYears(dateStr);
  if (years === null) return 8; // unknown date — give partial credit
  if (years < 0.5)  return 0;
  if (years < 1)    return 5;
  if (years < 2)    return 10;
  if (years < 3)    return 15;
  if (years < 5)    return 20;
  return 25;
}

function scoreBusinessType(businessType: string): number {
  const t = businessType.toLowerCase();
  if (t.includes("private") || t.includes("pvt") || t.includes("public limited")) return 15;
  if (t.includes("llp") || t.includes("limited liability"))                        return 13;
  if (t.includes("opc") || t.includes("one person"))                               return 12;
  if (t.includes("partnership"))                                                    return 8;
  if (t.includes("proprietor") || t.includes("sole"))                              return 5;
  return 7; // unknown
}

function scoreVerification(gstData: GSTData, mcaData: MCAData | null): number {
  // When Probe42 / MCA is integrated, this function will use real director &
  // compliance data. For now, give a neutral score.
  // Companies (Pvt Ltd / LLP) that SHOULD have MCA records but don't yet = 7.
  // Non-company types that CAN'T have MCA records = 7 (not penalised).
  if (mcaData) {
    const active = mcaData.status?.toLowerCase() === "active";
    return active ? 15 : 4;
  }
  return 7;
}

function scoreNews(news: NewsFlags): number {
  return news.has_negative_news ? 0 : 15;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function calculateTrustScore(
  gstData: GSTData,
  mcaData: MCAData | null,
  news: NewsFlags
): ScoringResult {
  const breakdown = {
    gst_status:        scoreGSTStatus(gstData.status),
    registration_age:  scoreRegistrationAge(gstData.registration_date),
    business_type:     scoreBusinessType(gstData.business_type),
    verification:      scoreVerification(gstData, mcaData),
    news:              scoreNews(news),
    total:             0,
  };

  let total =
    breakdown.gst_status +
    breakdown.registration_age +
    breakdown.business_type +
    breakdown.verification +
    breakdown.news;

  // Hard caps so a cancelled/inactive GST cannot escape the right tier
  if (gstData.status === "cancelled") total = Math.min(total, 35);
  if (gstData.status === "inactive")  total = Math.min(total, 52);

  // Negative news hard cap — can't get "approve" if news is bad
  if (news.has_negative_news) total = Math.min(total, 62);

  const trust_score = Math.round(Math.max(0, Math.min(100, total)));
  breakdown.total = trust_score;

  const recommendation: "approve" | "caution" | "reject" =
    trust_score >= 70 ? "approve" :
    trust_score >= 45 ? "caution" :
    "reject";

  return { trust_score, recommendation, breakdown };
}

// Helper used by the Claude prompt — plain-text breakdown for context
export function formatBreakdownForPrompt(breakdown: ScoreBreakdown): string {
  return [
    `GST status score: ${breakdown.gst_status}/30`,
    `Registration age score: ${breakdown.registration_age}/25`,
    `Business type score: ${breakdown.business_type}/15`,
    `Verification score: ${breakdown.verification}/15`,
    `News scan score: ${breakdown.news}/15`,
    `Total: ${breakdown.total}/100`,
  ].join("\n");
}
