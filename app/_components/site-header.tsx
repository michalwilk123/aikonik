const links = [
  { label: "Asystent", active: true },
  { label: "Innowacje", active: false },
  { label: "Dla Instytucji", active: false },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-outline-variant/40 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-6">
        <div className="flex items-baseline gap-3">
          <span className="text-base font-bold tracking-tight text-primary">
            KRAKÓW SPOŁECZNY
          </span>
          <span className="text-[13px] text-on-surface-variant">ROPS</span>
        </div>
        <nav aria-label="Główna" className="hidden items-center gap-6 sm:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href="/#"
              aria-current={link.active ? "page" : undefined}
              className={
                link.active
                  ? "border-b-2 border-secondary py-1 text-sm font-semibold text-primary"
                  : "py-1 text-sm text-on-surface-variant hover:text-primary"
              }
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
