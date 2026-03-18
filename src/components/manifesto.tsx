export function Manifesto() {
  return (
    <div className="rounded-xl border border-card-border bg-card p-8 sm:p-12">
      <h2 className="text-sm font-mono text-muted uppercase tracking-wider mb-8 text-center">
        Manifesto
      </h2>
      <div className="max-w-xl mx-auto space-y-6 text-center">
        <p className="text-lg sm:text-xl leading-relaxed">
          We spend 8 hours a day talking to machines.
        </p>
        <p className="text-lg sm:text-xl leading-relaxed">
          When the machines stop talking back,
          <br />
          we stare at error messages.
        </p>
        <p className="text-lg sm:text-xl leading-relaxed text-green font-medium">
          What if we talked to each other instead?
        </p>
        <div className="pt-4 border-t border-card-border mt-8">
          <p className="text-muted text-sm leading-relaxed">
            Claude uptime is 99.64%. But rate limits hit thousands daily. Every
            limit is an opportunity to remember what screens were originally for
            — connecting people.
          </p>
        </div>
      </div>
    </div>
  );
}
