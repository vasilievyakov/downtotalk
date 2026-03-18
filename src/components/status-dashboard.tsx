"use client";

import { useEffect, useState } from "react";

interface ServiceStatus {
  service: string;
  status: "operational" | "degraded" | "outage" | "checking";
  statusText: string;
  incidentTitle?: string;
}

const SERVICE_NAMES: Record<string, string> = {
  claude: "Claude",
  openai: "ChatGPT",
  gemini: "Gemini",
};

const SERVICE_URLS: Record<string, string> = {
  claude: "https://status.claude.com",
  openai: "https://status.openai.com",
  gemini: "https://status.cloud.google.com",
};

const STATUS_COLORS: Record<string, string> = {
  operational: "bg-green",
  degraded: "bg-yellow",
  outage: "bg-red",
  checking: "bg-muted",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  operational: "text-green",
  degraded: "text-yellow",
  outage: "text-red",
  checking: "text-muted",
};

export function StatusDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { service: "claude", status: "checking", statusText: "Checking..." },
    { service: "openai", status: "checking", statusText: "Checking..." },
    { service: "gemini", status: "checking", statusText: "Checking..." },
  ]);
  const [availableCount, setAvailableCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, availRes] = await Promise.all([
          fetch("/api/status"),
          fetch("/api/availability"),
        ]);
        const statusData = await statusRes.json();
        const availData = await availRes.json();
        setServices(statusData.statuses);
        setAvailableCount(availData.count || 0);
      } catch {
        // Keep checking state on error
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const anyDown = services.some(
    (s) => s.status === "outage" || s.status === "degraded"
  );

  return (
    <div className="rounded-xl border border-card-border bg-card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-mono text-muted uppercase tracking-wider">
          Live AI Status
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              anyDown ? "bg-red pulse-dot" : "bg-green pulse-dot"
            }`}
          />
          <span className="text-sm text-muted font-mono">
            {anyDown ? "Outage detected" : "All systems operational"}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {services.map((service) => (
          <div
            key={service.service}
            className="flex items-center justify-between py-3 border-b border-card-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  STATUS_COLORS[service.status] || "bg-muted"
                } ${service.status === "checking" ? "pulse-dot" : ""}`}
              />
              <span className="font-medium">
                {SERVICE_NAMES[service.service] || service.service}
              </span>
            </div>
            <a
              href={SERVICE_URLS[service.service] || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-mono ${
                STATUS_TEXT_COLORS[service.status] || "text-muted"
              } hover:underline`}
            >
              {service.statusText}
            </a>
          </div>
        ))}
      </div>

      {/* People counter */}
      <div className="mt-6 pt-6 border-t border-card-border text-center">
        {anyDown ? (
          <p className="text-lg">
            <span className="text-green font-bold text-2xl">
              {availableCount}
            </span>{" "}
            <span className="text-muted">people are free right now</span>
          </p>
        ) : (
          <p className="text-muted">
            <span className="font-bold text-foreground">{availableCount}</span>{" "}
            people ready for the next outage.{" "}
            <span className="text-green">Be one of them.</span>
          </p>
        )}
      </div>
    </div>
  );
}
