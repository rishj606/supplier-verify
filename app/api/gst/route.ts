import { NextRequest, NextResponse } from "next/server";
import { fetchGSTData } from "@/lib/gst";
import { sanitizeGST, isValidGST } from "@/lib/types";
import { rateLimit } from "@/lib/rate-limit";
import type { APIResponse, GSTData } from "@/lib/types";

export async function GET(
  request: NextRequest
): Promise<NextResponse<APIResponse<GSTData | null>>> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { success: false, data: null, error: "Too many requests. Please wait." },
      { status: 429 }
    );
  }

  const gstRaw = request.nextUrl.searchParams.get("gst");

  if (!gstRaw) {
    return NextResponse.json(
      { success: false, data: null, error: "Missing gst query parameter" },
      { status: 400 }
    );
  }

  const gst = sanitizeGST(gstRaw);

  if (!isValidGST(gst)) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error:
          "Invalid GST number format. Must be 15 characters: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric",
      },
      { status: 400 }
    );
  }

  try {
    const data = await fetchGSTData(gst);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[API /gst] Error:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to fetch GST data" },
      { status: 500 }
    );
  }
}
