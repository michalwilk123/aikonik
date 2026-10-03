const links = ["Dostępność WCAG", "Prywatność", "Kontakt"];

export function SiteFooter() {
  return (
    <footer className="border-t border-outline-variant/40 bg-white px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 text-[13px] text-on-surface-variant md:flex-row md:items-center md:justify-between">
        <p>Regionalny Ośrodek Polityki Społecznej w Krakowie</p>
        <nav aria-label="Informacje" className="flex gap-6">
          {links.map((label) => (
            <a
              key={label}
              href="/#"
              className="hover:text-primary hover:underline"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
