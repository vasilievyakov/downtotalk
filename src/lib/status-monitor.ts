export interface AIServiceStatus {
  service: string;
  status: "operational" | "degraded" | "outage" | "checking";
  statusText: string;
  incidentTitle?: string;
  lastChecked: string;
}

interface RSSItem {
  title: string;
  pubDate: string;
  description: string;
}

function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title =
      content.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || "";
    const pubDate =
      content.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
    const description =
      content.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim() ||
      "";
    items.push({ title, pubDate, description });
  }
  return items;
}

function inferStatusFromDescription(description: string): {
  status: "operational" | "degraded" | "outage";
  statusText: string;
} {
  const lower = description.toLowerCase();
  if (lower.includes("resolved") || lower.includes("completed")) {
    return { status: "operational", statusText: "Operational" };
  }
  if (
    lower.includes("major outage") ||
    lower.includes("service disruption") ||
    lower.includes("elevated errors")
  ) {
    return { status: "outage", statusText: "Major Outage" };
  }
  if (
    lower.includes("degraded") ||
    lower.includes("partial") ||
    lower.includes("investigating") ||
    lower.includes("identified")
  ) {
    return { status: "degraded", statusText: "Degraded" };
  }
  // Active incident without resolution
  return { status: "degraded", statusText: "Incident in progress" };
}

async function fetchRSSStatus(
  feedUrl: string,
  serviceName: string
): Promise<AIServiceStatus> {
  try {
    const response = await fetch(feedUrl, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    const items = parseRSSItems(xml);

    if (items.length === 0) {
      return {
        service: serviceName,
        status: "operational",
        statusText: "Operational",
        lastChecked: new Date().toISOString(),
      };
    }

    const latest = items[0];
    const pubDate = new Date(latest.pubDate);
    const now = new Date();
    const hoursAgo = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60);

    // If latest incident is older than 24h, assume operational
    if (hoursAgo > 24) {
      return {
        service: serviceName,
        status: "operational",
        statusText: "Operational",
        lastChecked: now.toISOString(),
      };
    }

    const { status, statusText } = inferStatusFromDescription(
      latest.title + " " + latest.description
    );

    return {
      service: serviceName,
      status,
      statusText,
      incidentTitle: latest.title,
      lastChecked: now.toISOString(),
    };
  } catch {
    return {
      service: serviceName,
      status: "checking",
      statusText: "Unable to check",
      lastChecked: new Date().toISOString(),
    };
  }
}

export async function checkAllStatuses(): Promise<AIServiceStatus[]> {
  const checks = await Promise.all([
    fetchRSSStatus("https://status.claude.com/history.rss", "claude"),
    fetchRSSStatus("https://status.openai.com/history.rss", "openai"),
    // Gemini doesn't have a simple RSS feed, use direct check
    checkGeminiStatus(),
  ]);
  return checks;
}

async function checkGeminiStatus(): Promise<AIServiceStatus> {
  try {
    // Google Cloud Status JSON endpoint for Vertex AI / Gemini
    const response = await fetch(
      "https://status.cloud.google.com/incidents.json",
      {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      return {
        service: "gemini",
        status: "operational",
        statusText: "Operational",
        lastChecked: new Date().toISOString(),
      };
    }

    const incidents = await response.json();
    // Check for recent Vertex AI / AI Platform incidents
    const recentAI = incidents
      .filter(
        (i: { service_name: string; end?: string }) =>
          (i.service_name?.toLowerCase().includes("vertex") ||
            i.service_name?.toLowerCase().includes("ai platform") ||
            i.service_name?.toLowerCase().includes("generative")) &&
          !i.end
      )
      .slice(0, 1);

    if (recentAI.length > 0) {
      return {
        service: "gemini",
        status: "degraded",
        statusText: "Incident",
        incidentTitle: recentAI[0].external_desc,
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      service: "gemini",
      status: "operational",
      statusText: "Operational",
      lastChecked: new Date().toISOString(),
    };
  } catch {
    return {
      service: "gemini",
      status: "operational",
      statusText: "Operational",
      lastChecked: new Date().toISOString(),
    };
  }
}
