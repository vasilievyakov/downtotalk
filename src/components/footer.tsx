export function Footer() {
  return (
    <footer className="max-w-3xl mx-auto px-6 py-12 border-t border-card-border">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">
            Down<span className="text-green">To</span>Talk
          </span>
          <span>&middot;</span>
          <span>When AI sleeps, humans connect</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/vasilievyakov/downtotalk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
