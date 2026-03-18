"use client";

import { useState, useRef, useEffect } from "react";

export function TerminalInput() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount for desktop
    if (window.innerWidth > 768) {
      inputRef.current?.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);

    // TODO: Replace with Supabase insert
    await new Promise((resolve) => setTimeout(resolve, 600));

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <section className="mb-16">
        <div className="border border-card-border rounded bg-card px-4 py-3 text-sm">
          <span className="text-green">✓</span>{" "}
          <span className="text-muted">
            added to waitlist. we&apos;ll ping you when the next AI goes down.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <form onSubmit={handleSubmit}>
        <div className="border border-card-border rounded bg-card px-4 py-3 flex items-center gap-2 focus-within:border-muted transition-colors">
          <span className="text-dimmed text-sm select-none">$</span>
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="enter your email to join"
            required
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-dimmed focus:outline-none caret-foreground"
          />
          {loading ? (
            <span className="text-dimmed text-sm">sending...</span>
          ) : (
            <span className="cursor-blink text-muted text-sm">&#9608;</span>
          )}
        </div>
        <p className="text-xs text-dimmed mt-2">
          press enter to subscribe. we only email when AI is down.
        </p>
      </form>
    </section>
  );
}
