import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests." },
      { status: 429 }
    );
  }

  let body: { report_id?: string; gst_number?: string; context?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const { report_id, gst_number, context } = body;

  if (!gst_number || !context || !["vendor_check", "exploratory"].includes(context)) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  // Store the user-confirmed context in the feedback table
  const { error: feedbackError } = await supabase.from("feedback").insert({
    report_id: report_id ?? null,
    gst_number: gst_number.toUpperCase().trim(),
    context,
  });

  if (feedbackError) {
    console.error("[Feedback] Insert error:", feedbackError.message);
    return NextResponse.json(
      { success: false, error: "Failed to save feedback" },
      { status: 500 }
    );
  }

  // Also update the report's context tag so the record reflects user intent
  if (report_id) {
    await supabase
      .from("reports")
      .update({ context })
      .eq("id", report_id);
  }

  return NextResponse.json({ success: true, data: null });
}
