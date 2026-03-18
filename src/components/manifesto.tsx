export function Manifesto() {
  return (
    <section className="my-24 py-16 text-center">
      <p className="font-serif text-2xl sm:text-3xl leading-relaxed italic text-foreground">
        We spend 8 hours a day talking to machines.
      </p>
      <p className="font-serif text-2xl sm:text-3xl leading-relaxed italic text-foreground mt-4">
        When the machines stop — we stare at error messages.
      </p>
      <p className="font-serif text-2xl sm:text-3xl leading-relaxed italic text-red mt-4">
        What if we talked to each other instead?
      </p>
      <span className="cursor-blink text-muted mt-6 inline-block">&#9608;</span>
    </section>
  );
}
