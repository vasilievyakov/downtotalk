"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    // TODO: Replace with real API endpoint (Supabase)
    await new Promise((resolve) => setTimeout(resolve, 800));

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="text-center py-4">
        <p className="text-green font-medium text-lg">
          You&apos;re on the list.
        </p>
        <p className="text-muted text-sm mt-2">
          We&apos;ll ping you when the next AI goes down. For real.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 px-4 py-3 rounded-lg bg-card border border-card-border text-foreground placeholder:text-muted focus:outline-none focus:border-green transition-colors font-mono text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 rounded-lg bg-green text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap cursor-pointer"
      >
        {loading ? "Joining..." : "Join Waitlist"}
      </button>
    </form>
  );
}
