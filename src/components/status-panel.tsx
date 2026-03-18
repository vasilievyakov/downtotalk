"use client";

import { useEffect, useState } from "react";

interface Service {
  name: string;
  status: "operational" | "degraded" | "down" | "checking";
  url: string;
}

const INITIAL_SERVICES: Service[] = [
  { name: "Claude", status: "checking", url: "https://status.claude.com" },
  { name: "ChatGPT", status: "checking", url: "https://status.openai.com" },
  { name: "Gemini", status: "checking", url: "https://status.cloud.google.com" },
];

export function StatusPanel() {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [downtimeSeconds, setDowntimeSeconds] = useState(170591); // 47h 23m 11s in seconds
  const [connections, setConnections] = useState(0);

  useEffect(() => {
    // TODO: Replace with real API polling
    const timer = setTimeout(() => {
      setServices([
        { name: "Claude", status: "operational", url: "https://status.claude.com" },
        { name: "ChatGPT", status: "operational", url: "https://status.openai.com" },
        { name: "Gemini", status: "operational", url: "https://status.cloud.google.com" },
      ]);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Tick the downtime counter
  useEffect(() => {
    const interval = setInterval(() => {
      setDowntimeSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  return (
    <section className="mb-16">
      <div className="border border-card-border rounded bg-card">
        {/* Services */}
        {services.map((service, i) => (
          <div
            key={service.name}
            className={`flex items-center justify-between px-4 py-3 ${
              i < services.length - 1 ? "border-b border-card-border" : ""
            } ${service.status === "down" ? "bg-red/5" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  service.status === "operational"
                    ? "bg-green-dim"
                    : service.status === "down"
                    ? "bg-red pulse-red"
                    : service.status === "degraded"
                    ? "bg-yellow-500"
                    : "bg-dimmed"
                }`}
              />
              <a
                href={service.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-foreground transition-colors"
              >
                {service.name}
              </a>
            </div>

            <div className="text-sm">
              {service.status === "checking" && (
                <span className="text-dimmed">checking...</span>
              )}
              {service.status === "operational" && (
                <span>
                  <span className="text-green-dim">operational</span>
                  <span className="text-dimmed ml-2 text-xs">unfortunately</span>
                </span>
              )}
              {service.status === "degraded" && (
                <span className="text-yellow-500">degraded</span>
              )}
              {service.status === "down" && (
                <span className="flex items-center gap-3">
                  <span className="text-red font-bold">DOWN</span>
                  <button className="text-xs border border-red text-red px-2 py-0.5 rounded hover:bg-red hover:text-background transition-colors cursor-pointer">
                    time to talk
                  </button>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Counters — terminal log style */}
      <div className="mt-4 text-xs text-dimmed space-y-1">
        <p>
          Total AI downtime in 2026:{" "}
          <span className="text-muted">{formatDuration(downtimeSeconds)}</span>
        </p>
        <p>
          Humans connected during outages:{" "}
          <span className="text-muted">{connections}</span>
        </p>
      </div>
    </section>
  );
}
