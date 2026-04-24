import { NextRequest, NextResponse } from "next/server";
import { sanitizeGST, isValidGST } from "@/lib/types";
import { fetchGSTData } from "@/lib/gst";
import { fetchMCAData } from "@/lib/mca";
import { fetchNewsData } from "@/lib/news";
import { generateReport } from "@/lib/claude";
import { calculateTrustScore, SCORE_VERSION } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import {
  canCallClaude,
  canCallGST,
  recordClaudeCall,
  recordGSTCall,
} from "@/lib/spend-guard";
import type { APIResponse, SupplierReport } from "@/lib/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<APIResponse<SupplierReport | null>>> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const { allowed } = rateLimit(ip, { maxRequests: 5, windowMs: 60 * 1000 });

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Too many requests. Please wait a minute before trying again.",
      },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let body: { gst_number?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.gst_number) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Missing gst_number in request body",
      },
      { status: 400 }
    );
  }

  const gst = sanitizeGST(body.gst_number);

  if (!isValidGST(gst)) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error:
          "Invalid GST number format. Must be 15 characters matching the standard GSTIN pattern.",
      },
      { status: 400 }
    );
  }

  try {
    // Check Supabase cache — return cached report if less than 7 days old
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: cached } = await supabase
      .from("reports")
      .select("id, report_json")
      .eq("gst_number", gst)
      .eq("score_version", SCORE_VERSION)
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (cached?.report_json) {
      console.log(`[Verify] Cache hit for ${gst}`);
      // Always use the Supabase row id as the canonical report id.
      // Old records may have a different id inside report_json — this aligns them.
      const cachedReport = cached.report_json as SupplierReport;
      cachedReport.id = cached.id;
      return NextResponse.json({ success: true, data: cachedReport });
    }

    // Check daily spend limits before making any paid API calls
    if (!canCallGST()) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: "Daily GST lookup limit reached. Please try again tomorrow.",
        },
        { status: 503 }
      );
    }
    if (!canCallClaude()) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error:
            "Daily report generation limit reached. Please try again tomorrow.",
        },
        { status: 503 }
      );
    }

    console.log(`[Verify] Cache miss for ${gst} — fetching fresh data`);

    const gstData = await fetchGSTData(gst);
    recordGSTCall();

    const [mcaDataRaw, newsData] = await Promise.all([
      fetchMCAData(gstData.legal_name, gstData.business_type),
      fetchNewsData(gstData.legal_name),
    ]);

    // Score is calculated deterministically — same input always = same score.
    // Claude only writes the text explanation, never picks the number.
    const { trust_score, recommendation, breakdown } = calculateTrustScore(
      gstData,
      mcaDataRaw,
      newsData
    );

    const aiResult = await generateReport(
      gstData,
      mcaDataRaw,
      newsData,
      trust_score,
      recommendation,
      breakdown
    );
    recordClaudeCall();

    const reportId = crypto.randomUUID();

    const report: SupplierReport = {
      id: reportId,
      gst_number: gst,
      company_name: aiResult.company_name,
      generated_at: new Date().toISOString(),
      trust_score,
      recommendation,
      gst_data: gstData,
      mca_data: mcaDataRaw,
      news_flags: newsData,
      ai_summary: aiResult.ai_summary,
      red_flags: aiResult.red_flags,
      positive_signals: aiResult.positive_signals,
    };

    const { error: insertError } = await supabase.from("reports").insert({
      id: reportId,
      gst_number: gst,
      company_name: report.company_name,
      report_json: report,
      trust_score: report.trust_score,
      recommendation: report.recommendation,
      state: gstData.state,
      business_type: gstData.business_type,
      gst_status: gstData.status,
      context: "vendor_check",
      score_version: SCORE_VERSION,
    });

    if (insertError) {
      console.error("[Verify] Supabase insert error:", insertError.message);
      // Fallback: migration may not have run yet — retry with core columns only
      const { error: fallbackError } = await supabase.from("reports").insert({
        id: reportId,
        gst_number: gst,
        company_name: report.company_name,
        report_json: report,
      });
      if (fallbackError) {
        console.error("[Verify] Supabase fallback insert error:", fallbackError.message);
      }
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("[API /verify] Error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
