import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { ContactForm } from "@/app/kontakt/contact-form";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Dane kontaktowe ROPS Kraków, formularz kontaktowy i deklaracja dostępności.",
};

const link =
  "inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm";

function Illustration() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 200 140"
      className="h-auto w-40 shrink-0"
    >
      <rect width="200" height="140" rx="16" fill="#eaedff" />
      <rect
        x="22"
        y="36"
        width="104"
        height="72"
        rx="8"
        fill="#ffffff"
        stroke="#131b2e"
        strokeWidth="3"
      />
      <path
        d="M26 42 74 80l48-38"
        fill="none"
        stroke="#131b2e"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect
        x="116"
        y="52"
        width="60"
        height="68"
        rx="10"
        fill="#006f66"
        stroke="#131b2e"
        strokeWidth="3"
      />
      <rect x="124" y="62" width="44" height="40" rx="4" fill="#86f2e4" />
      <circle cx="146" cy="111" r="4" fill="#ffffff" />
    </svg>
  );
}

export default function KontaktPage() {
  return (
    <>
      <SiteHeader current="/kontakt" />
      <main
        id="tresc"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 pt-28 pb-16 outline-none sm:px-6"
      >
        <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold text-primary sm:text-4xl">
              Kontakt
            </h1>
            <p className="max-w-prose text-lg leading-7 text-on-surface-variant">
              Masz pytanie? Napisz albo zadzwoń. Chętnie pomożemy. Odpowiadamy w
              dni robocze.
            </p>
          </div>
          <Illustration />
        </header>

        <section
          aria-labelledby="dane"
          className="rounded-2xl bg-surface-container-low p-5 sm:p-6"
        >
          <h2 id="dane" className="mb-4 text-2xl font-semibold text-primary">
            Dane kontaktowe
          </h2>
          {/* TODO: verify all contact details and opening hours with ROPS Kraków before production. */}
          <address className="flex flex-col gap-4 text-base leading-6 text-on-surface not-italic">
            <p className="font-semibold">
              Regionalny Ośrodek Polityki Społecznej w Krakowie
            </p>
            <p className="flex items-start gap-3">
              <MapPin
                className="mt-0.5 size-5 shrink-0 text-secondary"
                aria-hidden="true"
              />
              <span>
                <span className="sr-only">Adres: </span>
                ul. Piastowska 32
                <br />
                30-070 Kraków
              </span>
            </p>
            <p className="flex items-center gap-3">
              <Phone
                className="size-5 shrink-0 text-secondary"
                aria-hidden="true"
              />
              <span>
                Telefon:{" "}
                <a href="tel:+48124220636" className={link}>
                  12 422 06 36
                </a>
              </span>
            </p>
            <p className="flex items-center gap-3">
              <Mail
                className="size-5 shrink-0 text-secondary"
                aria-hidden="true"
              />
              <span>
                E-mail:{" "}
                <a href="mailto:rops@rops.krakow.pl" className={link}>
                  rops@rops.krakow.pl
                </a>
              </span>
            </p>
            <p className="flex items-start gap-3">
              <Clock
                className="mt-0.5 size-5 shrink-0 text-secondary"
                aria-hidden="true"
              />
              <span>Godziny pracy: poniedziałek–piątek, 8:00–16:00</span>
            </p>
          </address>
        </section>

        <section aria-labelledby="formularz" className="flex flex-col gap-4">
          <h2 id="formularz" className="text-2xl font-semibold text-primary">
            Napisz do nas
          </h2>
          <ContactForm />
        </section>

        <section
          aria-labelledby="naglo"
          className="rounded-2xl border-2 border-primary bg-white p-5 sm:p-6"
        >
          <h2 id="naglo" className="mb-3 text-2xl font-semibold text-primary">
            W nagłych sytuacjach
          </h2>
          <p className="mb-4 leading-6 text-on-surface">
            Ten formularz nie służy do pilnej pomocy. Jeśli ktoś jest w
            niebezpieczeństwie, zadzwoń od razu.
          </p>
          <ul className="flex flex-col gap-3 text-base leading-6 text-on-surface">
            <li>
              <a href="tel:112" className={link}>
                112
              </a>{" "}
              – numer alarmowy. Policja, straż pożarna, pogotowie.
            </li>
            <li>
              <a href="tel:116123" className={link}>
                116 123
              </a>{" "}
              – kryzysowy telefon zaufania dla dorosłych.
            </li>
            <li>
              <a href="tel:116111" className={link}>
                116 111
              </a>{" "}
              – telefon zaufania dla dzieci i młodzieży.
            </li>
          </ul>
        </section>

        <section
          id="dostepnosc"
          aria-labelledby="dostepnosc-h"
          className="flex scroll-mt-24 flex-col gap-3 leading-6 text-on-surface"
        >
          <h2 id="dostepnosc-h" className="text-2xl font-semibold text-primary">
            Deklaracja dostępności
          </h2>
          <p>
            To jest prototyp. Nie jest jeszcze gotową stroną ROPS Kraków.
            Chcemy, żeby każdy mógł z niej korzystać. Naszym celem jest zgodność
            ze standardem WCAG 2.1 na poziomie AA.
          </p>
          <h3 className="mt-2 text-lg font-semibold text-primary">
            Co już zrobiliśmy
          </h3>
          <ul className="list-disc space-y-1 pl-6">
            <li>Całą stronę obsłużysz klawiaturą.</li>
            <li>Strona jest opisana dla czytników ekranu.</li>
            <li>Kolory mają wysoki kontrast.</li>
            <li>Piszemy prostym językiem.</li>
          </ul>
          <p>
            Prototyp nie został jeszcze w pełni sprawdzony przez ekspertów. Mogą
            w nim być błędy.
          </p>
          <h3 className="mt-2 text-lg font-semibold text-primary">
            Znalazłeś barierę?
          </h3>
          <p>
            Napisz do nas na{" "}
            <a href="mailto:rops@rops.krakow.pl" className={link}>
              rops@rops.krakow.pl
            </a>{" "}
            lub zadzwoń pod numer{" "}
            <a href="tel:+48124220636" className={link}>
              12 422 06 36
            </a>
            . Opisz, co sprawia Ci trudność. Postaramy się pomóc.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
