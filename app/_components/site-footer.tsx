import Link from "next/link";
import { BrandMark } from "@/app/_components/brand-mark";

const links = [
  { href: "/", label: "O aplikacji" },
  { href: "/asystent", label: "Asystent" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/kontakt#dostepnosc", label: "Deklaracja dostępności" },
] as const;

const linkClass =
  "inline-flex min-h-11 items-center rounded-md text-sm text-on-surface-variant underline-offset-4 hover:text-primary hover:underline";

export function SiteFooter() {
  return (
    <footer className="border-t border-outline-variant/40 bg-white px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark className="size-8 shrink-0" />
            <span className="text-base font-bold text-primary">Hubmi</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-on-surface-variant">
            Asystent, który łączy potrzeby mieszkańców Małopolski ze
            sprawdzonymi rozwiązaniami społecznymi.
          </p>
        </div>

        {/* TODO: verify these contact details with ROPS Kraków before release. */}
        <address className="text-sm leading-relaxed text-on-surface-variant not-italic">
          <h2 className="mb-3 text-sm font-semibold text-primary">Kontakt</h2>
          <p>Regionalny Ośrodek Polityki Społecznej w Krakowie</p>
          <p>ul. Piastowska 32</p>
          <p>30-070 Kraków</p>
          <p className="mt-2">
            tel.{" "}
            <a
              href="tel:+48124220636"
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-primary"
            >
              12 422 06 36
            </a>
          </p>
          <p>
            e-mail:{" "}
            <a
              href="mailto:rops@rops.krakow.pl"
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-primary"
            >
              rops@rops.krakow.pl
            </a>
          </p>
        </address>

        <nav aria-label="Stopka">
          <h2 className="mb-3 text-sm font-semibold text-primary">Na skróty</h2>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-8 flex max-w-5xl flex-col gap-1 border-t border-outline-variant/40 pt-6 text-[13px] text-on-surface-variant sm:flex-row sm:justify-between">
        <p>
          © {new Date().getFullYear()} Regionalny Ośrodek Polityki Społecznej w
          Krakowie
        </p>
        <p>Prototyp — projekt HackYeah</p>
      </div>
    </footer>
  );
}
