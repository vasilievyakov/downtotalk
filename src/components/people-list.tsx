"use client";

import { useEffect, useState, useCallback } from "react";

interface AvailableUser {
  id: string;
  name: string | null;
  image: string | null;
  city: string | null;
  timezone: string | null;
  preferredPlatforms: string[];
  telegramHandle: string | null;
  availableSince: string | null;
}

const PLATFORM_LABELS: Record<string, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  zoom: "Zoom",
  meet: "Google Meet",
};

export function PeopleList({
  currentUserId,
}: {
  currentUserId: string | undefined;
}) {
  const [people, setPeople] = useState<AvailableUser[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  const fetchPeople = useCallback(async () => {
    const res = await fetch("/api/availability");
    const data = await res.json();
    setPeople(data.users?.filter((u: AvailableUser) => u.id !== currentUserId) || []);
  }, [currentUserId]);

  useEffect(() => {
    fetchPeople();
    const interval = setInterval(fetchPeople, 15000);
    return () => clearInterval(interval);
  }, [fetchPeople]);

  const connect = async (userId: string, platform: string) => {
    setConnecting(userId);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: userId,
          platform,
          trigger: "manual",
        }),
      });
      const data = await res.json();
      if (data.callLink) {
        window.open(data.callLink, "_blank");
      }
    } finally {
      setConnecting(null);
    }
  };

  const timeSince = (dateStr: string | null) => {
    if (!dateStr) return "";
    const mins = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 60000
    );
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-mono text-muted uppercase tracking-wider">
          People available now
        </h2>
        <span className="text-sm text-muted font-mono">{people.length}</span>
      </div>

      {people.length === 0 ? (
        <p className="text-muted text-sm text-center py-8">
          No one is available right now.
          <br />
          Toggle your availability above — be the first.
        </p>
      ) : (
        <div className="space-y-3">
          {people.map((person) => (
            <div
              key={person.id}
              className="flex items-center justify-between py-3 border-b border-card-border last:border-0"
            >
              <div className="flex items-center gap-3">
                {person.image ? (
                  <img
                    src={person.image}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-card-border flex items-center justify-center text-xs text-muted">
                    {person.name?.[0] || "?"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {person.name || "Anonymous"}
                  </p>
                  <p className="text-xs text-muted">
                    {person.city && `${person.city} · `}
                    free {timeSince(person.availableSince)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {person.preferredPlatforms?.map((platform) => (
                  <button
                    key={platform}
                    onClick={() => connect(person.id, platform)}
                    disabled={connecting === person.id}
                    className="text-xs px-3 py-1.5 rounded-lg border border-card-border hover:border-green hover:text-green transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {PLATFORM_LABELS[platform] || platform}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
