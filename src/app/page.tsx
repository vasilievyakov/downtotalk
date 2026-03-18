import { StatusDashboard } from "@/components/status-dashboard";
import { HowItWorks } from "@/components/how-it-works";
import { Manifesto } from "@/components/manifesto";
import { WaitlistForm } from "@/components/waitlist-form";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
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
        </div>
      </section>

      {/* Live Status Dashboard */}
      <section className="max-w-3xl mx-auto px-6 pb-16 animate-fade-in-up animate-delay-200">
        <StatusDashboard />
      </section>

      {/* Waitlist CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-20 animate-fade-in-up animate-delay-300">
        <WaitlistForm />
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
          Join the waitlist. We&apos;ll notify you when it&apos;s time to be human.
        </p>
        <WaitlistForm />
      </section>

      <Footer />
    </main>
  );
}
