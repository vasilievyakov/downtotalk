"use client";

import { useEffect, useState } from "react";

interface ServiceStatus {
  name: string;
  slug: string;
  status: "operational" | "degraded" | "outage" | "checking";
  statusText: string;
  url: string;
}

const SERVICES: ServiceStatus[] = [
  {
    name: "Claude",
    slug: "claude",
    status: "checking",
    statusText: "Checking...",
    url: "https://status.claude.com",
  },
  {
    name: "ChatGPT",
    slug: "chatgpt",
    status: "checking",
    statusText: "Checking...",
    url: "https://status.openai.com",
  },
  {
    name: "Gemini",
    slug: "gemini",
    status: "checking",
    statusText: "Checking...",
    url: "https://status.cloud.google.com",
  },
];

const STATUS_COLORS = {
  operational: "bg-green",
  degraded: "bg-yellow",
  outage: "bg-red",
  checking: "bg-muted",
};

const STATUS_TEXT_COLORS = {
  operational: "text-green",
  degraded: "text-yellow",
  outage: "text-red",
  checking: "text-muted",
};

export function StatusDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>(SERVICES);
  const [peopleReady, setPeopleReady] = useState(0);

  useEffect(() => {
    // TODO: Replace with real API call to our backend
    // For now, simulate fetching status
    const timer = setTimeout(() => {
      setServices((prev) =>
        prev.map((s) => ({
          ...s,
          status: "operational" as const,
          statusText: "Operational",
        }))
      );
      setPeopleReady(127);
    }, 1500);

    return () => clearTimeout(timer);
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
            key={service.slug}
            className="flex items-center justify-between py-3 border-b border-card-border last:border-0"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  STATUS_COLORS[service.status]
                } ${service.status === "checking" ? "pulse-dot" : ""}`}
              />
              <span className="font-medium">{service.name}</span>
            </div>
            <a
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-mono ${
                STATUS_TEXT_COLORS[service.status]
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
              {peopleReady}
            </span>{" "}
            <span className="text-muted">people are free right now</span>
          </p>
        ) : (
          <p className="text-muted">
            <span className="font-bold text-foreground">{peopleReady}</span>{" "}
            people ready for the next outage.{" "}
            <span className="text-green">Be one of them.</span>
          </p>
        )}
      </div>
    </div>
  );
}
