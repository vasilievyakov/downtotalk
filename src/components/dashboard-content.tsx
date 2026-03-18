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
}

interface Circle {
  id: string;
  name: string;
  inviteCode: string;
  isOwner: boolean;
  memberCount: number;
}

export function DashboardContent({ user }: { user: User }) {
  const [statuses, setStatuses] = useState<AIServiceStatus[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchStatuses = useCallback(async () => {
    const res = await fetch("/api/status");
    const data = await res.json();
    setStatuses(data.statuses);
  }, []);

  const fetchProfile = useCallback(async () => {
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
  }, []);

  const fetchCircles = useCallback(async () => {
    const res = await fetch("/api/circles");
    const data = await res.json();
    if (data.circles) {
      setCircles(data.circles);
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
        <h1 className="text-xl font-bold">
          Down<span className="text-green">To</span>Talk
        </h1>
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
              <div
                key={circle.id}
                className="flex items-center justify-between py-3 border-b border-card-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{circle.name}</p>
                  <p className="text-xs text-muted">
                    {circle.memberCount}{" "}
                    {circle.memberCount === 1 ? "member" : "members"}
                    {circle.isOwner && " · owner"}
                  </p>
                </div>

                {circle.isOwner && (
                  <button
                    onClick={() => copyInviteLink(circle.inviteCode)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-card-border hover:border-green hover:text-green transition-colors cursor-pointer"
                  >
                    {copied === circle.inviteCode
                      ? "Copied!"
                      : "Copy invite link"}
                  </button>
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
