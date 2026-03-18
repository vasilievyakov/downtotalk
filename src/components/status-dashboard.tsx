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
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statusRes = await fetch("/api/status");
        const statusData = await statusRes.json();
        setServices(statusData.statuses);

        const wlRes = await fetch("/api/waitlist");
        if (wlRes.ok) {
          const wlData = await wlRes.json();
          setWaitlistCount(wlData.count || 0);
        }
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

      {/* Waitlist count */}
      {waitlistCount !== null && waitlistCount > 0 && (
        <div className="mt-6 pt-6 border-t border-card-border">
          <p className="text-sm">
            <span className="mr-2">&#x1f525;</span>
            <span className="font-bold text-green">{waitlistCount}</span>{" "}
            <span className="text-muted">people waiting for the next outage</span>
          </p>
        </div>
      )}
    </div>
  );
}
