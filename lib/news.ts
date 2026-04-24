import type { NewsFlags } from "./types";

// Mock news data — used when BING_SEARCH_API_KEY is not set
function getMockNewsData(): NewsFlags {
  return {
    has_negative_news: false,
    headlines: [],
  };
}

export async function fetchNewsData(companyName: string): Promise<NewsFlags> {
  const apiKey = process.env.BING_SEARCH_API_KEY;

  if (!apiKey) {
    console.log("[News] No API key — returning mock data");
    return getMockNewsData();
  }

  // Search for negative news about the company
  const query = `"${companyName}" fraud OR scam OR dispute OR lawsuit OR cheating India`;
  const url = `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query)}&count=5&mkt=en-IN`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    console.error(`[News] Bing API returned ${response.status}`);
    return { has_negative_news: false, headlines: [] };
  }

  const raw = await response.json();
  const articles = raw.value || [];

  // Take top 3 headlines
  const headlines = articles
    .slice(0, 3)
    .map((article: { name: string }) => article.name);

  return {
    has_negative_news: headlines.length > 0,
    headlines,
  };
}
