import Link from "next/link";

export function AgentContact() {
  return (
    <aside
      aria-label="Kontakt z naszym zespołem"
      className="mt-3 flex flex-wrap items-center justify-center gap-x-4 text-xs text-on-surface-variant"
    >
      <p>Wolisz kontakt z naszym zespołem?</p>
      <div className="flex flex-wrap items-center gap-x-4">
        <a
          href="tel:+48124220636"
          className="inline-flex min-h-11 items-center rounded-md underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="sr-only">Zadzwoń: </span>
          12 422 06 36
        </a>
        <Link
          href="/kontakt#formularz"
          className="inline-flex min-h-11 items-center rounded-md underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Napisz do nas
        </Link>
      </div>
    </aside>
  );
}
