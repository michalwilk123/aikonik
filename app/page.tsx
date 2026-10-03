import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  HeroIllustration,
  LinkedCirclesIllustration,
  ParentChildIllustration,
  SeniorIllustration,
  SpeechBubblesIllustration,
  StepContactIllustration,
  StepSearchIllustration,
  StepWriteIllustration,
  TownHallIllustration,
  VolunteerIllustration,
} from "@/app/_components/illustrations";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "O aplikacji" };

const steps = [
  {
    Icon: StepWriteIllustration,
    title: "Opisz swój problem",
    text: "Napisz własnymi słowami, czego potrzebujesz. Nie musisz znać żadnych nazw ani przepisów.",
  },
  {
    Icon: StepSearchIllustration,
    title: "Asystent szuka rozwiązań",
    text: "Asystent sprawdza, jakie wsparcie i sprawdzone pomysły są w Małopolsce i pasują do Twojej sytuacji.",
  },
  {
    Icon: StepContactIllustration,
    title: "Dostajesz propozycje",
    text: "Dostajesz krótką listę pomysłów i informację, gdzie szukać pomocy.",
  },
] as const;

const features = [
  {
    title: "Znajdź wsparcie",
    text: "Opisz swoją sytuację, a asystent podpowie, gdzie szukać pomocy.",
    available: true,
    href: "/asystent",
    Art: LinkedCirclesIllustration,
  },
  {
    title: "Zasobnik wiedzy",
    text: "Biblioteka innowacji społecznych: opisy sprawdzonych rozwiązań z całej Małopolski.",
    available: false,
    Art: TownHallIllustration,
  },
  {
    title: "Kreator pomysłów",
    text: "Masz pomysł na pomoc w swojej okolicy? Kreator pomoże Ci go opisać na prostym formularzu (Social Canvas).",
    available: false,
    Art: SpeechBubblesIllustration,
  },
] as const;

const audiences = [
  {
    title: "Mieszkańcy",
    text: "Szukasz pomocy dla siebie lub bliskich i nie wiesz, od czego zacząć.",
    Art: ParentChildIllustration,
  },
  {
    title: "Seniorzy i opiekunowie",
    text: "Potrzebujesz wsparcia w codziennych sprawach albo opiekujesz się kimś bliskim.",
    Art: SeniorIllustration,
  },
  {
    title: "Organizacje pozarządowe",
    text: "Chcesz pokazać swoje działania albo znaleźć sprawdzone pomysły do wykorzystania.",
    Art: VolunteerIllustration,
  },
  {
    title: "Gminy i Centra Usług Społecznych",
    text: "Szukasz gotowych rozwiązań, które możesz wdrożyć u siebie.",
    Art: TownHallIllustration,
  },
] as const;

const accessibility = [
  "Cały serwis działa z samą klawiaturą.",
  "Strony są przygotowane do czytników ekranu.",
  "Teksty mają mocny kontrast i można je powiększać.",
  "Piszemy prostym językiem: krótkie zdania, zwykłe słowa.",
] as const;

const sectionTitle =
  "text-2xl font-bold tracking-tight text-primary sm:text-3xl";

export default function HomePage() {
  return (
    <>
      <SiteHeader current="/" />
      <main id="tresc" tabIndex={-1} className="flex-1 pt-16 outline-none">
        {/* Hero */}
        <section
          aria-labelledby="hero-title"
          className="bg-surface px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-secondary">
                Małopolski Hub Innowacji Społecznych
              </p>
              <h1
                id="hero-title"
                className="mt-3 text-4xl font-bold tracking-tight text-primary sm:text-5xl"
              >
                Hubmi
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
                Opisz, z czym masz kłopot. Asystent pomoże Ci znaleźć wsparcie i
                sprawdzone rozwiązania w Małopolsce.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  nativeButton={false}
                  render={<Link href="/asystent" />}
                  className="h-12 px-6 text-base"
                >
                  Zapytaj asystenta
                </Button>
                <a
                  href="#jak-to-dziala"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg px-4 text-base font-medium text-primary underline underline-offset-4 hover:bg-surface-container"
                >
                  Jak to działa?
                </a>
              </div>
            </div>
            <HeroIllustration
              className="h-auto w-full"
              title="Rysunek: urząd miasta w Małopolsce, a przed nim senior z laską, rodzic z dzieckiem i wolontariuszka."
            />
          </div>
        </section>

        {/* What is it */}
        <section
          aria-labelledby="co-to-jest"
          className="px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-3xl">
            <h2 id="co-to-jest" className={sectionTitle}>
              Co to jest Hubmi?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
              Hubmi to prototyp Małopolskiego Hubu Innowacji Społecznych. Tworzy
              go Regionalny Ośrodek Polityki Społecznej w Krakowie.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
              W Małopolsce działa już około 200 sprawdzonych pomysłów, które
              pomagają ludziom w codziennych sprawach. Trudno jest je znaleźć.
              Hubmi ma to ułatwić: łączy to, czego potrzebują mieszkańcy, z
              rozwiązaniami, które już działają.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section
          id="jak-to-dziala"
          aria-labelledby="jak-to-dziala-title"
          className="scroll-mt-20 bg-surface-container-low px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-5xl">
            <h2 id="jak-to-dziala-title" className={sectionTitle}>
              Jak to działa?
            </h2>
            <ol className="mt-8 grid gap-6 md:grid-cols-3">
              {steps.map(({ Icon, title, text }, i) => (
                <li
                  key={title}
                  className="rounded-2xl border border-outline-variant/60 bg-white p-6"
                >
                  <Icon className="size-20" />
                  <h3 className="mt-4 text-lg font-bold text-primary">
                    <span className="mr-2 text-secondary">Krok {i + 1}.</span>
                    {title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-on-surface-variant">
                    {text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section
          aria-labelledby="co-mozesz"
          className="px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-5xl">
            <h2 id="co-mozesz" className={sectionTitle}>
              Co możesz zrobić
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {features.map((f) => (
                <li
                  key={f.title}
                  className="flex flex-col rounded-2xl border border-outline-variant/60 bg-white p-6"
                >
                  <f.Art className="h-24 w-auto self-start" />
                  <h3 className="mt-4 text-lg font-bold text-primary">
                    {f.title}
                  </h3>
                  <p className="mt-2 flex-1 leading-relaxed text-on-surface-variant">
                    {f.text}
                  </p>
                  {f.available ? (
                    <Button
                      nativeButton={false}
                      render={<Link href={f.href} />}
                      className="mt-5 h-11 self-start px-5 text-base"
                    >
                      Otwórz asystenta
                    </Button>
                  ) : (
                    <p className="mt-5 inline-flex min-h-8 items-center self-start rounded-full bg-[#f6c453] px-3 text-sm font-semibold text-primary">
                      Wkrótce
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Screenshots */}
        <section
          aria-labelledby="tak-wyglada"
          className="bg-surface-container-low px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-5xl">
            <h2 id="tak-wyglada" className={sectionTitle}>
              Tak wygląda asystent
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              Ekran jest prosty. Na górze widzisz krótkie wyjaśnienie, a na dole
              pole, w którym piszesz swoją wiadomość.
            </p>
            <div className="mt-8 flex flex-col items-center gap-8 md:flex-row md:items-end">
              <figure className="w-full md:flex-1">
                <Image
                  src="/screens/asystent-desktop.png"
                  width={1280}
                  height={800}
                  unoptimized
                  className="h-auto w-full rounded-xl border border-outline-variant shadow-sm"
                  alt="Zrzut ekranu asystenta na komputerze. Na górze nagłówek „Dzień dobry. W czym możemy Ci dzisiaj pomóc?”, pod nim trzy karty z krokami: opisz potrzebę, darmowe dopasowanie, adres i telefon. Niżej przykładowe pytania mieszkańców, a na dole pole do wpisania wiadomości."
                />
                <figcaption className="mt-2 text-sm text-on-surface-variant">
                  Widok na komputerze.
                </figcaption>
              </figure>
              <figure className="w-48 shrink-0 sm:w-56">
                <Image
                  src="/screens/asystent-mobile.png"
                  width={780}
                  height={1688}
                  unoptimized
                  className="h-auto w-full rounded-2xl border border-outline-variant shadow-sm"
                  alt="Zrzut ekranu asystenta na telefonie. Widać powitanie „Dzień dobry. W czym możemy Ci dzisiaj pomóc?”, krótki opis, pierwsze karty z krokami oraz pole do wpisania wiadomości na dole ekranu."
                />
                <figcaption className="mt-2 text-sm text-on-surface-variant">
                  Widok na telefonie.
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* Audiences */}
        <section
          aria-labelledby="dla-kogo"
          className="px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-5xl">
            <h2 id="dla-kogo" className={sectionTitle}>
              Dla kogo?
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {audiences.map(({ title, text, Art }) => (
                <li
                  key={title}
                  className="flex items-center gap-5 rounded-2xl border border-outline-variant/60 bg-white p-5"
                >
                  <Art className="h-28 w-20 shrink-0 sm:w-24" />
                  <div>
                    <h3 className="text-lg font-bold text-primary">{title}</h3>
                    <p className="mt-1 leading-relaxed text-on-surface-variant">
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Accessibility */}
        <section
          aria-labelledby="dostepnosc"
          className="bg-surface-container-low px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-3xl">
            <h2 id="dostepnosc" className={sectionTitle}>
              Dostępny dla każdego
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
              Chcemy, żeby z Hubmi mógł korzystać każdy. Dlatego tworzymy go
              zgodnie ze standardem WCAG 2.1, na poziomie AA. To jest nasz cel.
              Prototyp jest jeszcze w trakcie prac.
            </p>
            <ul className="mt-6 space-y-3">
              {accessibility.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-lg leading-relaxed text-on-surface-variant"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-white"
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 leading-relaxed text-on-surface-variant">
              Znalazłeś barierę? Napisz do nas na stronie{" "}
              <Link
                href="/kontakt#dostepnosc"
                className="font-medium text-primary underline underline-offset-4"
              >
                Kontakt i dostępność
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section
          aria-labelledby="zacznij"
          className="bg-primary px-4 py-14 text-center sm:px-6"
        >
          <div className="mx-auto max-w-2xl">
            <h2
              id="zacznij"
              className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              Zacznij od jednego pytania
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-white/85">
              Opisz swoją sytuację. To nic nie kosztuje.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/asystent" />}
              className="mt-8 h-12 bg-secondary-container px-6 text-base font-semibold text-primary hover:bg-secondary-container/85"
            >
              Zapytaj asystenta
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
