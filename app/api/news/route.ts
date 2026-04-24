import { NextRequest, NextResponse } from "next/server";
import { fetchNewsData } from "@/lib/news";
import { rateLimit } from "@/lib/rate-limit";
import type { APIResponse, NewsFlags } from "@/lib/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<APIResponse<NewsFlags | null>>> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { success: false, data: null, error: "Too many requests. Please wait." },
      { status: 429 }
    );
  }

  const company = request.nextUrl.searchParams.get("company");

  if (!company || company.trim().length === 0) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Missing company query parameter",
      },
      { status: 400 }
    );
  }

  // Basic input length check to prevent abuse
  if (company.length > 200) {
    return NextResponse.json(
      { success: false, data: null, error: "Company name too long" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchNewsData(company.trim());
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[API /news] Error:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to fetch news data" },
      { status: 500 }
    );
  }
}
