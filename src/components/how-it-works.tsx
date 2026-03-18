const steps = [
  {
    number: "01",
    title: "AI goes down",
    description:
      "We monitor Claude, ChatGPT, Gemini, and more. The moment a service goes down, we know.",
  },
  {
    number: "02",
    title: "You get notified",
    description:
      'Push notification: "Claude is down. 47 people are free right now." Your move.',
  },
  {
    number: "03",
    title: "Talk to a human",
    description:
      "See who's available, pick someone, choose your platform — Zoom, Meet, Telegram, WhatsApp. Just connect.",
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
