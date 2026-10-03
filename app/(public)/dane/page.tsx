import type { Metadata } from "next";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";

export const metadata: Metadata = {
  title: "Dane",
  description: "Źródła danych wykorzystywane przez aplikację.",
};

const sources = [
  {
    label: "Biblioteka innowacji społecznych — kategorie",
    href: "https://rops.krakow.pl/innowacje-spoleczne/biblioteka-innowacji-spolecznych/kategorie",
  },
  {
    label: "Raporty z badań",
    href: "https://rops.krakow.pl/badania-analizy-raporty/raporty-z-badan",
  },
  {
    label: "Publikacje ze świata innowacji",
    href: "https://rops.krakow.pl/innowacje-spoleczne/publikacje-ze-swiata-innowacji",
  },
  {
    label: "Arkusz innowacji społecznej (INNO AGH, PDF)",
    href: "https://rops.krakow.pl/mpliki/IS/Moj_folder/INNO_AGH_-_SOCIAL_CANVAS.pdf",
  },
  {
    label: "Mapa Wyzwań Społecznych (PDF)",
    href: "https://rops.krakow.pl/mpliki/IS/IWS_20/za._nr_2._Mapa_Wyzwa_Spoecznych.pdf",
  },
  {
    label: "Obserwator ROPS Kraków",
    href: "https://obserwator.rops.krakow.pl/",
  },
  {
    label: "Obserwator — analiza zróżnicowania",
    href: "https://obserwator.rops.krakow.pl/differenceanalysis/55",
  },
] as const;

export default function DanePage() {
  return (
    <>
      <SiteHeader />
      <main id="tresc" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-extrabold">Dane</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Źródła wykorzystywane przez aplikację.
        </p>
        <ul className="mt-6">
          {sources.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
