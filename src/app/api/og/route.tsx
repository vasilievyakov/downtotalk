import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { checkAllStatuses } from "@/lib/status-monitor";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const runtime = "edge";

const STATUS_DOT_COLORS: Record<string, string> = {
  operational: "#76AD2A",
  degraded: "#EAB308",
  outage: "#EF4444",
  checking: "#87867F",
};

const SERVICE_NAMES: Record<string, string> = {
  claude: "Claude",
  openai: "ChatGPT",
  gemini: "Gemini",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const event = searchParams.get("event");
  const service = searchParams.get("service");
  const countParam = searchParams.get("count");

  const VALID_SERVICES: Record<string, string> = {
    claude: "Claude",
    openai: "ChatGPT",
    gemini: "Gemini",
  };

  // Custom event OG images (existing behavior)
  if (event === "rate-limited" && service && VALID_SERVICES[service]) {
    return renderImage(
      `I just got rate-limited by ${VALID_SERVICES[service]}.`,
      "Talked to a human instead."
    );
  }
  if (event === "connected" && countParam) {
    const count = parseInt(countParam, 10);
    if (!isNaN(count) && count > 0 && count < 100000) {
      return renderImage(
        `Had ${count} human conversations`,
        "during AI downtime."
      );
    }
  }

  // Default OG: live status + available count
  const [statuses, availableResult] = await Promise.all([
    checkAllStatuses(),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isAvailable, true)),
  ]);

  const availableCount = Number(availableResult[0]?.count ?? 0);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          color: "#fafaf9",
          fontFamily: "sans-serif",
          padding: "48px",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 48,
            display: "flex",
          }}
        >
          <span>Down</span>
          <span style={{ color: "#76AD2A" }}>To</span>
          <span>Talk</span>
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 40,
            lineHeight: 1.2,
          }}
        >
          When AI sleeps, humans connect
        </div>
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginBottom: 32,
          }}
        >
          {statuses.map((s) => (
            <div
              key={s.service}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: 24,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor:
                    STATUS_DOT_COLORS[s.status] || "#87867F",
                }}
              />
              <span>{SERVICE_NAMES[s.service] || s.service}</span>
              <span style={{ color: "#87867F", fontSize: 20 }}>
                {s.statusText}
              </span>
            </div>
          ))}
        </div>
        {availableCount > 0 && (
          <div
            style={{
              fontSize: 22,
              color: "#76AD2A",
              display: "flex",
            }}
          >
            {availableCount} {availableCount === 1 ? "person" : "people"}{" "}
            free right now
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

function renderImage(headline: string, subtitle: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          color: "#fafaf9",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 48,
            display: "flex",
          }}
        >
          <span>Down</span>
          <span style={{ color: "#76AD2A" }}>To</span>
          <span>Talk</span>
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.2,
            marginBottom: 24,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#87867F",
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
