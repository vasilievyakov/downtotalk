"use client";

import { useEffect, useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import type { AIServiceStatus } from "@/lib/status-monitor";
import { ProfileSetup } from "./profile-setup";
import { PeopleList } from "./people-list";

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

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

interface Circle {
  id: string;
  name: string;
  inviteCode: string;
  isOwner: boolean;
  memberCount: number;
}

interface CircleMember {
  id: string;
  name: string | null;
  image: string | null;
  city: string | null;
  isAvailable: boolean;
}

export function DashboardContent({ user }: { user: User }) {
  const [statuses, setStatuses] = useState<AIServiceStatus[]>([]);
  const [expandedCircle, setExpandedCircle] = useState<string | null>(null);
  const [circleMembers, setCircleMembers] = useState<Record<string, CircleMember[]>>({});
  const [isAvailable, setIsAvailable] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [rateLimitConfirm, setRateLimitConfirm] = useState<{
    service: string;
    othersAvailable: number;
  } | null>(null);
  const [rateLimitLoading, setRateLimitLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStatuses(data.statuses);
    } catch {
      setError("Failed to load AI status.");
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/users/profile");
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        setIsAvailable(data.user.isAvailable || false);
        if (
          !data.user.telegramHandle &&
          !data.user.whatsappNumber &&
          !data.user.zoomLink
        ) {
          setShowProfile(true);
        }
      }
    } catch {
      setError("Failed to load your profile.");
    }
  }, []);

  const fetchCircles = useCallback(async () => {
    try {
      const res = await fetch("/api/circles");
      const data = await res.json();
      if (data.circles) {
        setCircles(data.circles);
      }
    } catch {
      // Non-critical — circles section will show empty state
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    fetchProfile();
    fetchCircles();
    const interval = setInterval(fetchStatuses, 60000);
    return () => clearInterval(interval);
  }, [fetchStatuses, fetchProfile, fetchCircles]);

  const toggleAvailability = async () => {
    const newState = !isAvailable;
    setIsAvailable(newState);
    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: newState }),
    });
  };

  const reportRateLimit = async (service: string) => {
    setRateLimitLoading(service);
    try {
      const res = await fetch("/api/rate-limited", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsAvailable(true);
        setRateLimitConfirm({
          service,
          othersAvailable: data.othersAvailable,
        });
        setTimeout(() => setRateLimitConfirm(null), 5000);
      }
    } finally {
      setRateLimitLoading(null);
    }
  };

  const shareOnX = (service: string) => {
    const serviceName =
      service === "claude"
        ? "Claude"
        : service === "openai"
          ? "ChatGPT"
          : "Gemini";
    const ogUrl = `${window.location.origin}/api/og?event=rate-limited&service=${service}`;
    const text = `I just got rate-limited by ${serviceName}. Time to talk to humans instead.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin)}`;
    window.open(url, "_blank");
  };

  const toggleCircle = async (circleId: string) => {
    if (expandedCircle === circleId) {
      setExpandedCircle(null);
      return;
    }
    setExpandedCircle(circleId);
    if (!circleMembers[circleId]) {
      const res = await fetch(`/api/circles/${circleId}`);
      const data = await res.json();
      if (data.members) {
        setCircleMembers((prev) => ({ ...prev, [circleId]: data.members }));
      }
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const url = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(inviteCode);
    setTimeout(() => setCopied(null), 2000);
  };

  const anyDown = statuses.some(
    (s) => s.status === "outage" || s.status === "degraded"
  );

  const STATUS_DOT: Record<string, string> = {
    operational: "bg-green",
    degraded: "bg-yellow",
    outage: "bg-red pulse-dot",
    checking: "bg-muted",
  };

  const STATUS_TEXT: Record<string, string> = {
    operational: "text-green",
    degraded: "text-yellow",
    outage: "text-red",
    checking: "text-muted",
  };

  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <a href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
          Down<span className="text-green">To</span>Talk
        </a>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {user.name || user.email}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-muted hover:text-red transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red/30 bg-red/5 p-4 mb-6 text-center">
          <p className="text-red text-sm">{error}</p>
          <button
            onClick={() => { setError(null); fetchStatuses(); fetchProfile(); }}
            className="text-xs text-muted hover:text-foreground mt-2 underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Telegram notification banner */}
      {profile && !profile.telegramChatId && !showProfile && (
        <div className="rounded-xl border border-[#2AABEE]/30 bg-[#2AABEE]/5 p-4 mb-6 flex items-center justify-between">
          <p className="text-sm">
            Get notified when someone&apos;s free to talk.
          </p>
          <a
            href={`https://t.me/Downtotalk_bot?start=${profile.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg bg-[#2AABEE] text-white hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Enable Telegram
          </a>
        </div>
      )}

      {/* Profile Setup (expandable) */}
      {showProfile && (
        <ProfileSetup
          profile={profile}
          onSave={() => {
            setShowProfile(false);
            fetchProfile();
          }}
        />
      )}

      {/* AI Status */}
      <div className="rounded-xl border border-card-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono text-muted uppercase tracking-wider">
            AI Status
          </h2>
          <span
            className={`text-xs font-mono ${anyDown ? "text-red" : "text-green"}`}
          >
            {anyDown ? "OUTAGE DETECTED" : "All operational"}
          </span>
        </div>
        <div className="space-y-3">
          {statuses.map((s) => (
            <div key={s.service} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[s.status] || "bg-muted"}`}
                />
                <span className="capitalize font-medium">{s.service}</span>
              </div>
              <span
                className={`text-sm font-mono ${STATUS_TEXT[s.status] || "text-muted"}`}
              >
                {s.statusText}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* I hit my limit */}
      <div className="mb-6">
        {rateLimitConfirm ? (
          <div className="rounded-xl border border-green/30 bg-green/5 p-6 text-center">
            <p className="text-green font-medium">
              You&apos;re free to talk.{" "}
              {rateLimitConfirm.othersAvailable > 0
                ? `${rateLimitConfirm.othersAvailable} ${rateLimitConfirm.othersAvailable === 1 ? "other is" : "others are"} free too.`
                : "Be the first one online!"}
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            {(profile?.monitoredServices || ["claude"]).map((svc) => {
              const name =
                svc === "claude"
                  ? "Claude"
                  : svc === "openai"
                    ? "ChatGPT"
                    : "Gemini";
              return (
                <button
                  key={svc}
                  onClick={() => reportRateLimit(svc)}
                  disabled={rateLimitLoading !== null}
                  className="flex-1 py-4 rounded-xl text-lg font-bold transition-all cursor-pointer disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, #E86235 0%, #E04343 100%)",
                    color: "#fff",
                  }}
                >
                  {rateLimitLoading === svc ? "..." : name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Availability Toggle */}
      <div className="rounded-xl border border-card-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium mb-1">Your availability</h2>
            <p className="text-sm text-muted">
              {isAvailable
                ? "You're visible to others. Someone might reach out!"
                : "Toggle on to let others know you're free to talk."}
            </p>
          </div>
          <button
            onClick={toggleAvailability}
            className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${
              isAvailable ? "bg-green" : "bg-card-border"
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-foreground transition-transform ${
                isAvailable ? "left-7.5" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Your Circles */}
      <div className="rounded-xl border border-card-border bg-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono text-muted uppercase tracking-wider">
            Your circles
          </h2>
          <span className="text-sm text-muted font-mono">
            {circles.length}
          </span>
        </div>

        {circles.length === 0 ? (
          <p className="text-muted text-sm text-center py-4">
            No circles yet. They&apos;ll be created automatically.
          </p>
        ) : (
          <div className="space-y-3">
            {circles.map((circle) => (
              <div key={circle.id}>
                <div className="flex items-center justify-between py-3 border-b border-card-border last:border-0">
                  <button
                    onClick={() => toggleCircle(circle.id)}
                    className="text-left cursor-pointer"
                  >
                    <p className="text-sm font-medium">{circle.name}</p>
                    <p className="text-xs text-muted">
                      {circle.memberCount}{" "}
                      {circle.memberCount === 1 ? "member" : "members"}
                      {circle.isOwner && " · owner"}
                      <span className="ml-1">{expandedCircle === circle.id ? "▾" : "▸"}</span>
                    </p>
                  </button>

                  {circle.isOwner && (
                    <button
                      onClick={(e) => { e.stopPropagation(); copyInviteLink(circle.inviteCode); }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-card-border hover:border-green hover:text-green transition-colors cursor-pointer"
                    >
                      {copied === circle.inviteCode
                        ? "Copied!"
                        : "Copy invite link"}
                    </button>
                  )}
                </div>

                {expandedCircle === circle.id && (
                  <div className="py-2 pl-4 space-y-2">
                    {!circleMembers[circle.id] ? (
                      <p className="text-xs text-muted">Loading...</p>
                    ) : circleMembers[circle.id].length === 0 ? (
                      <p className="text-xs text-muted">No members yet. Share your invite link!</p>
                    ) : (
                      circleMembers[circle.id].map((member) => (
                        <div key={member.id} className="flex items-center gap-3 py-1">
                          {member.image ? (
                            <img src={member.image} alt="" className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-card-border flex items-center justify-center text-xs text-muted">
                              {member.name?.[0] || "?"}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{member.name || "Anonymous"}</span>
                            {member.city && <span className="text-xs text-muted">{member.city}</span>}
                            {member.isAvailable && (
                              <span className="w-2 h-2 rounded-full bg-green" title="Available" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* People List */}
      <PeopleList currentUserId={user.id} />
    </main>
  );
}
