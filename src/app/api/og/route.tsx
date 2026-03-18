import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const event = searchParams.get("event");
  const service = searchParams.get("service");
  const countParam = searchParams.get("count");

  let headline = "When AI sleeps, humans connect";
  let subtitle = "downtotalk.com";

  if (event === "rate-limited" && service) {
    const serviceName =
      service === "claude"
        ? "Claude"
        : service === "openai"
          ? "ChatGPT"
          : "Gemini";
    headline = `I just got rate-limited by ${serviceName}.`;
    subtitle = "Talked to a human instead.";
  } else if (event === "connected" && countParam) {
    headline = `Had ${countParam} human conversations`;
    subtitle = "during AI downtime.";
  }

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
