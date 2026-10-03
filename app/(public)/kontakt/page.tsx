import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { ContactPageScene } from "@/app/_components/scenes-steps";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { ContactForm } from "@/app/(public)/kontakt/contact-form";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Formularz kontaktowy i dane kontaktowe ROPS Kraków.",
};

const link =
  "inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-md";

export default function KontaktPage() {
  return (
    <>
      <SiteHeader current="/kontakt" />
      <main
        id="tresc"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pt-28 pb-16 outline-none sm:px-6"
      >
        <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              Kontakt
            </h1>
            <p className="max-w-prose text-lg leading-7 text-on-surface-variant">
              Masz pytanie? Napisz albo zadzwoń. Chętnie pomożemy. Odpowiadamy w
              dni robocze.
            </p>
          </div>
          <ContactPageScene className="size-40 shrink-0" />
        </header>

        <section aria-labelledby="formularz" className="flex flex-col gap-4">
          <h2
            id="formularz"
            className="scroll-mt-24 text-2xl font-extrabold text-foreground"
          >
            Napisz do nas
          </h2>
          <ContactForm />
        </section>

        <section
          aria-labelledby="dane"
          className="rounded-3xl bg-surface-container p-5 sm:p-6"
        >
          <h2
            id="dane"
            className="mb-4 text-2xl font-extrabold text-foreground"
          >
            Dane kontaktowe
          </h2>
          {/* TODO: verify all contact details and opening hours with ROPS Kraków before production. */}
          <address className="flex flex-col gap-4 text-base leading-6 text-on-surface not-italic">
            <p className="font-semibold">
              Regionalny Ośrodek Polityki Społecznej w Krakowie
            </p>
            <p className="flex items-start gap-3">
              <MapPin
                className="mt-0.5 size-5 shrink-0 text-primary"
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
                className="size-5 shrink-0 text-primary"
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
                className="size-5 shrink-0 text-primary"
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
                className="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span>Godziny pracy: poniedziałek–piątek, 8:00–16:00</span>
            </p>
          </address>
        </section>

        <section
          id="dostepnosc"
          aria-labelledby="dostepnosc-h"
          className="flex scroll-mt-24 flex-col gap-3 leading-6 text-on-surface"
        >
          <h2
            id="dostepnosc-h"
            className="text-2xl font-extrabold text-foreground"
          >
            Znalazłeś barierę?
          </h2>
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
