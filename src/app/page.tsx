import Link from "next/link";
import { auth } from "@/lib/auth";
import { StatusDashboard } from "@/components/status-dashboard";
import { HowItWorks } from "@/components/how-it-works";
import { Manifesto } from "@/components/manifesto";
import { Footer } from "@/components/footer";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="max-w-3xl mx-auto px-6 pt-6 flex justify-between items-center">
        <span className="text-sm font-bold">
          Down<span className="text-green">To</span>Talk
        </span>
        {session ? (
          <Link
            href="/dashboard"
            className="text-sm text-green hover:underline"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
        )}
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-16 text-center">
        <div className="animate-fade-in-up">
          <p className="text-muted font-mono text-sm tracking-wider uppercase mb-6">
            When AI sleeps, humans connect
          </p>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
            Down<span className="text-green">To</span>Talk
          </h1>
          <p className="text-xl sm:text-2xl text-muted max-w-xl mx-auto mb-4">
            The app that only works when AI doesn&apos;t.
          </p>
          <p className="text-muted text-base max-w-lg mx-auto">
            When Claude, ChatGPT, or Gemini go down — we match you with real
            humans for spontaneous calls. No scheduling. No planning. Just talk.
          </p>
          <p className="text-muted text-sm max-w-md mx-auto mt-3">
            Invite your circle. When AI goes silent, you&apos;ll know who&apos;s free.
          </p>
        </div>
      </section>

      {/* Live Status Dashboard */}
      <section className="max-w-3xl mx-auto px-6 pb-16 animate-fade-in-up animate-delay-200">
        <StatusDashboard />
      </section>

      {/* Sign up CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-20 text-center animate-fade-in-up animate-delay-300">
        {session ? (
          <Link
            href="/dashboard"
            className="inline-block px-8 py-3 rounded-lg bg-green text-background font-medium hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
        ) : (
          <div>
            <Link
              href="/login"
              className="inline-block px-8 py-3 rounded-lg bg-green text-background font-medium hover:opacity-90 transition-opacity"
            >
              Join — it&apos;s free
            </Link>
            <p className="text-muted text-sm mt-3">
              Sign in with GitHub or Google. Free forever.
            </p>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-6 pb-20 animate-fade-in-up animate-delay-400">
        <HowItWorks />
      </section>

      {/* Manifesto */}
      <section className="max-w-3xl mx-auto px-6 pb-20 animate-fade-in-up animate-delay-500">
        <Manifesto />
      </section>

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-20 text-center animate-fade-in-up animate-delay-600">
        <h2 className="text-2xl font-bold mb-4">Ready for the next outage?</h2>
        <p className="text-muted mb-8">
          Next time AI says &quot;wait&quot; — don&apos;t. Talk to a human instead.
        </p>
        {session ? (
          <Link
            href="/dashboard"
            className="inline-block px-8 py-3 rounded-lg bg-green text-background font-medium hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
        ) : (
          <div>
            <Link
              href="/login"
              className="inline-block px-8 py-3 rounded-lg bg-green text-background font-medium hover:opacity-90 transition-opacity"
            >
              Join — it&apos;s free
            </Link>
            <p className="text-muted text-sm mt-3">
              Sign in with GitHub or Google. Invite 5 friends. Done.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
