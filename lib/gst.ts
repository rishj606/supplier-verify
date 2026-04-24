import type { GSTData } from "./types";

// Mock GST data — used when GST_API_KEY is not set
function getMockGSTData(gstNumber: string): GSTData {
  return {
    gstin: gstNumber,
    legal_name: "TEST SUPPLIER PVT LTD",
    status: "active",
    registration_date: "01/07/2017",
    business_type: "Private Limited Company",
    state: "Maharashtra",
    filing_frequency: "Monthly",
    last_filed: "2024-11-01",
  };
}

export async function fetchGSTData(gstNumber: string): Promise<GSTData> {
  const apiKey = process.env.GST_API_KEY;

  if (!apiKey) {
    console.log("[GST] No API key — returning mock data");
    return getMockGSTData(gstNumber);
  }

  const url = `https://appyflow.in/api/verifyGST?gstNo=${encodeURIComponent(gstNumber)}&key_secret=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    console.error(`[GST] API returned ${response.status}`);
    return failedLookup(gstNumber);
  }

  const raw = await response.json();

  if (raw.error) {
    console.error(`[GST] API error: ${raw.message}`);
    return failedLookup(gstNumber);
  }

  const info = raw.taxpayerInfo;
  if (!info) {
    return failedLookup(gstNumber);
  }

  // Extract the most recent filing date from the filing array (usually empty from Appyflow)
  const filings: Array<{ dof?: string; rtnprd?: string }> = Array.isArray(raw.filing)
    ? raw.filing
    : [];
  const latestFiling = filings.length > 0 ? filings[filings.length - 1] : null;
  const lastFiled = latestFiling?.dof || latestFiling?.rtnprd || "";

  // Appyflow compliance.filingFrequency is the actual frequency; info.dty is dealer type (Regular/Composition)
  const filingFreq =
    (raw.compliance?.filingFrequency as string | null | undefined) ||
    info.dty ||
    "";

  return {
    gstin: info.gstin || gstNumber,
    legal_name: info.lgnm || info.tradeNam || "Unknown",
    status: mapGSTStatus(info.sts),
    registration_date: info.rgdt || "",
    business_type: info.ctb || "",
    state: info.pradr?.addr?.stcd || "",
    filing_frequency: filingFreq,
    last_filed: lastFiled,
  };
}

function failedLookup(gstNumber: string): GSTData {
  return {
    gstin: gstNumber,
    legal_name: "Unknown",
    status: "lookup_failed",
    registration_date: "",
    business_type: "",
    state: "",
    filing_frequency: "",
    last_filed: "",
  };
}

function mapGSTStatus(
  status: string | undefined
): "active" | "inactive" | "cancelled" | "lookup_failed" {
  if (!status) return "lookup_failed";
  const lower = status.toLowerCase();
  if (lower === "active") return "active";
  if (lower === "cancelled") return "cancelled";
  if (lower === "inactive") return "inactive";
  return "inactive";
}
