export type GSTStatus = "active" | "inactive" | "cancelled" | "lookup_failed";

export type Recommendation = "approve" | "caution" | "reject";

export interface GSTData {
  gstin: string;
  legal_name: string;
  status: GSTStatus;
  registration_date: string;
  business_type: string;
  state: string;
  filing_frequency: string;
  last_filed: string;
}

export interface MCAData {
  company_name: string;
  cin: string;
  status: string;
  incorporation_date: string;
  directors: string[];
  paid_up_capital: string;
}

export interface NewsFlags {
  has_negative_news: boolean;
  headlines: string[];
}

export interface SupplierReport {
  id: string;
  gst_number: string;
  company_name: string;
  generated_at: string;
  trust_score: number;
  recommendation: Recommendation;
  gst_data: GSTData;
  mca_data: MCAData | null;
  news_flags: NewsFlags;
  ai_summary: string;
  red_flags: string[];
  positive_signals: string[];
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
}

// GST number format: 2 digits + 5 uppercase letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isValidGST(gst: string): boolean {
  return GST_REGEX.test(gst);
}

export function sanitizeGST(input: string): string {
  // Strip whitespace, convert to uppercase, remove any non-alphanumeric chars
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
