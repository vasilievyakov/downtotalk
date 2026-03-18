"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface InviteInfo {
  circle: { id: string; name: string };
  owner: { name: string; image: string | null };
}

export function InviteClient({ code }: { code: string }) {
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/invite/${code}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invalid invite link");
        return res.json();
      })
      .then(setInfo)
      .catch(() => setError("This invite link is invalid or expired."));
  }, [code]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/invite/${code}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to join");
      setJoined(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setError("Failed to join circle. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Down<span className="text-green">To</span>Talk
          </h1>
          <p className="text-red text-sm">{error}</p>
        </div>
      </main>
    );
  }

  if (!info) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-muted text-sm">Loading...</p>
      </main>
    );
  }

  if (joined) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            Down<span className="text-green">To</span>Talk
          </h1>
          <p className="text-green font-medium">
            You joined &ldquo;{info.circle.name}&rdquo;!
          </p>
          <p className="text-muted text-sm mt-2">Redirecting to dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-6">
          Down<span className="text-green">To</span>Talk
        </h1>

        <div className="rounded-xl border border-card-border bg-card p-6 mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            {info.owner.image ? (
              <img
                src={info.owner.image}
                alt=""
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-card-border flex items-center justify-center text-sm text-muted">
                {info.owner.name[0]}
              </div>
            )}
            <div className="text-left">
              <p className="font-medium">{info.owner.name}</p>
              <p className="text-sm text-muted">invited you to join</p>
            </div>
          </div>

          <p className="text-lg font-medium mb-1">{info.circle.name}</p>
          <p className="text-sm text-muted">
            Join this circle to see when members are available for a call.
          </p>
        </div>

        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full px-6 py-3 rounded-lg bg-green text-background font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
        >
          {joining ? "Joining..." : "Join circle"}
        </button>
      </div>
    </main>
  );
}
