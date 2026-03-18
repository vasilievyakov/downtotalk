export function Footer() {
  return (
    <footer className="pt-12 border-t border-card-border text-xs text-dimmed">
      <p>
        built by{" "}
        <a
          href="https://t.me/nfg_ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-foreground transition-colors"
        >
          yakov
        </a>
        {" · "}
        <a
          href="https://t.me/nfg_ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-foreground transition-colors"
        >
          @nfg_ai
        </a>
        {" · "}
        <a
          href="https://github.com/vasilievyakov/downtotalk"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-foreground transition-colors"
        >
          github
        </a>
        {" · "}
        <span className="text-dimmed">
          built with claude code{" "}
          <span className="text-muted">(the irony)</span>
        </span>
      </p>
    </footer>
  );
}
