const steps = [
  {
    number: "01",
    title: "AI says wait",
    description:
      "Service goes down. Rate limit hits. Claude, ChatGPT, Gemini — doesn't matter which one. You're stuck.",
  },
  {
    number: "02",
    title: "You hit the button",
    description:
      '"I hit my limit" — one tap, and you\'re visible to people in your circle who are free right now.',
  },
  {
    number: "03",
    title: "Talk to a human",
    description:
      "Pick someone, choose your platform — Telegram, WhatsApp, Zoom. No scheduling. Just connect.",
  },
];

export function HowItWorks() {
  return (
    <div>
      <h2 className="text-sm font-mono text-muted uppercase tracking-wider mb-8 text-center">
        How it works
      </h2>
      <div className="grid gap-8 sm:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className="rounded-xl border border-card-border bg-card p-6 text-center"
          >
            <div className="text-green font-mono text-sm mb-2">
              {step.number}
            </div>
            <h3 className="font-bold text-lg mb-2">{step.title}</h3>
            <p className="text-muted text-sm leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
