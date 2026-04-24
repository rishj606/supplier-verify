import type { MCAData } from "./types";

// MCA data is only available for registered companies (Pvt Ltd, LLP, OPC)
// Sole proprietorships and partnership firms are NOT registered with MCA
// Currently no MCA API integrated — returns null
// Future: integrate Zaubacorp, Signzy, or similar service

export async function fetchMCAData(
  companyName: string,
  businessType: string
): Promise<MCAData | null> {
  // Proprietorships and partnerships won't have MCA records
  const noMCATypes = ["proprietorship", "partnership"];
  if (noMCATypes.some((t) => businessType.toLowerCase().includes(t))) {
    console.log(
      `[MCA] Business type "${businessType}" — no MCA records exist for this type`
    );
    return null;
  }

  // No MCA API integrated yet — return null
  console.log("[MCA] No MCA API integrated — skipping");
  return null;
}
