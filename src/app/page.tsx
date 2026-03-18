import { StatusPanel } from "@/components/status-panel";
import { Manifesto } from "@/components/manifesto";
import { TerminalInput } from "@/components/terminal-input";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen max-w-2xl mx-auto px-6 py-12">
      {/* Header — minimal */}
      <header className="mb-12">
        <h1 className="text-sm text-muted">
          <span className="text-foreground">downtotalk</span>{" "}
          <span className="text-dimmed">— when AI sleeps, humans connect</span>
        </h1>
      </header>

      {/* Live Status Panel — the main event */}
      <StatusPanel />

      {/* Manifesto — serif, breathing space */}
      <Manifesto />

      {/* Terminal CTA */}
      <TerminalInput />

      {/* Footer */}
      <Footer />
    </main>
  );
}
