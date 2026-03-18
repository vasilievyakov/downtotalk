"use client";

import { useState } from "react";

interface UserProfile {
  id: string;
  name: string;
  telegramHandle: string | null;
  whatsappNumber: string | null;
  zoomLink: string | null;
  preferredPlatforms: string[];
  monitoredServices: string[];
  timezone: string | null;
  city: string | null;
  isAvailable: boolean;
  telegramChatId: string | null;
}

export function ProfileSetup({
  profile,
  onSave,
}: {
  profile: UserProfile | null;
  onSave: () => void;
}) {
  const [telegram, setTelegram] = useState(profile?.telegramHandle || "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsappNumber || "");
  const [zoom, setZoom] = useState(profile?.zoomLink || "");
  const [city, setCity] = useState(profile?.city || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const platforms: string[] = [];
    if (telegram) platforms.push("telegram");
    if (whatsapp) platforms.push("whatsapp");
    if (zoom) platforms.push("zoom");

    await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramHandle: telegram || null,
        whatsappNumber: whatsapp || null,
        zoomLink: zoom || null,
        city: city || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        preferredPlatforms: platforms.length > 0 ? platforms : ["telegram"],
      }),
    });

    setSaving(false);
    onSave();
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-6 mb-6">
      <h2 className="font-medium mb-1">Set up your profile</h2>
      <p className="text-sm text-muted mb-4">
        Add at least one way for people to reach you.
      </p>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted block mb-1">
            Telegram username
          </label>
          <div className="flex items-center gap-2">
            <span className="text-muted text-sm">@</span>
            <input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="username"
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-card-border text-sm focus:outline-none focus:border-green transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted block mb-1">
            WhatsApp number
          </label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+1234567890"
            className="w-full px-3 py-2 rounded-lg bg-background border border-card-border text-sm focus:outline-none focus:border-green transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-muted block mb-1">
            Zoom personal link
          </label>
          <input
            value={zoom}
            onChange={(e) => setZoom(e.target.value)}
            placeholder="https://zoom.us/j/..."
            className="w-full px-3 py-2 rounded-lg bg-background border border-card-border text-sm focus:outline-none focus:border-green transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-muted block mb-1">City</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Dubai, Berlin, NYC..."
            className="w-full px-3 py-2 rounded-lg bg-background border border-card-border text-sm focus:outline-none focus:border-green transition-colors"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || (!telegram && !whatsapp && !zoom)}
        className="mt-4 px-5 py-2 rounded-lg bg-green text-background font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>

      {/* Telegram notifications */}
      <div className="mt-6 pt-4 border-t border-card-border">
        <h3 className="text-sm font-medium mb-1">Telegram notifications</h3>
        {profile?.telegramChatId ? (
          <p className="text-sm text-green">
            &#10003; Connected — you&apos;ll get notified when someone in your circles is free.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted mb-3">
              Get notified instantly when someone in your circles becomes available or when an AI service goes down.
            </p>
            {profile?.id && (
              <a
                href={`https://t.me/Downtotalk_bot?start=${profile.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 rounded-lg bg-[#2AABEE] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Enable notifications
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
