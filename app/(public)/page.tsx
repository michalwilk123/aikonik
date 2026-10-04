import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { agentHref, agents } from "@/agents/registry";
import type { AgentId } from "@/agents/types";
import { HeroArt } from "@/app/_components/hero-art";
import {
  RevealOnScroll,
  RevealText,
  ScrollProgress,
} from "@/app/_components/motion";
import {
  MunicipalityScene,
  NgoScene,
  ResidentsScene,
  SeniorsScene,
} from "@/app/_components/scenes-audiences";
import {
  DataScene,
  IdeaScene,
  RolloutScene,
  SupportScene,
  TestScene,
} from "@/app/_components/scenes-features";
import {
  StepContactScene,
  StepSearchScene,
  StepWriteScene,
} from "@/app/_components/scenes-steps";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "O aplikacji" };

const steps = [
  {
    Icon: StepWriteScene,
    title: "Opisz swój problem",
    text: "Napisz własnymi słowami, czego potrzebujesz. Nie musisz znać żadnych nazw ani przepisów.",
  },
  {
    Icon: StepSearchScene,
    title: "Asystent szuka rozwiązań",
    text: "Asystent sprawdza, jakie wsparcie i sprawdzone pomysły są w Małopolsce i pasują do Twojej sytuacji.",
  },
  {
    Icon: StepContactScene,
    title: "Dostajesz propozycje",
    text: "Dostajesz krótką listę pomysłów i informację, gdzie szukać pomocy.",
  },
] as const;

// One card per agent in agents/registry.ts; each opens that agent's tab.
const features = [
  {
    agent: "odkrywaj",
    text: "Opisz swoją sytuację, a asystent dobierze pasujące projekty i podpowie, gdzie szukać pomocy.",
    Art: SupportScene,
  },
  {
    agent: "wiedza",
    text: "Pytaj o dane i ciekawostki o Małopolsce. Asystent pokaże wyniki na wykresach i mapach.",
    Art: DataScene,
  },
  {
    agent: "dodaj-pomysl",
    text: "Masz pomysł na pomoc w swojej okolicy? Asystent pomoże go opisać na Canvie Innowacji Społecznej.",
    Art: IdeaScene,
  },
  {
    agent: "testuj-innowacje",
    text: "Zaplanuj mały pilotaż, sprawdź, co działa, i zbierz opinie uczestników.",
    Art: TestScene,
  },
  {
    agent: "wdrazanie-innowacji",
    text: "Dopasuj sprawdzone rozwiązanie do swojej gminy, CUS albo organizacji.",
    Art: RolloutScene,
  },
] as const satisfies readonly { agent: AgentId; text: string; Art: unknown }[];

const audiences = [
  {
    title: "Mieszkańcy",
    text: "Szukasz pomocy dla siebie lub bliskich i nie wiesz, od czego zacząć.",
    Art: ResidentsScene,
  },
  {
    title: "Seniorzy i opiekunowie",
    text: "Potrzebujesz wsparcia w codziennych sprawach albo opiekujesz się kimś bliskim.",
    Art: SeniorsScene,
  },
  {
    title: "Organizacje pozarządowe",
    text: "Chcesz pokazać swoje działania albo znaleźć sprawdzone pomysły do wykorzystania.",
    Art: NgoScene,
  },
  {
    title: "Gminy i Centra Usług Społecznych",
    text: "Szukasz gotowych rozwiązań, które możesz wdrożyć u siebie.",
    Art: MunicipalityScene,
  },
] as const;

const accessibility = [
  "Cały serwis działa z samą klawiaturą.",
  "Strony są przygotowane do czytników ekranu.",
  "Teksty mają mocny kontrast i można je powiększać.",
  "Piszemy prostym językiem: krótkie zdania, zwykłe słowa.",
] as const;

const sectionTitle =
  "text-3xl font-black tracking-tight text-foreground sm:text-4xl";

export default function HomePage() {
  return (
    <>
      <SiteHeader current="/" />
      <ScrollProgress />
      <RevealOnScroll />
      <main id="tresc" tabIndex={-1} className="flex-1 pt-16 outline-none">
        {/* Hero */}
        <section
          aria-labelledby="hero-title"
          className="bg-surface px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
            <div>
              <h1
                id="hero-title"
                className="intro-text text-5xl font-black tracking-tight text-foreground sm:text-6xl"
              >
                <RevealText text="Ai" by="letter" delay={120} step={60} />
                <span className="text-primary">
                  <RevealText text="Konik" by="letter" delay={240} step={60} />
                </span>
              </h1>
              <p className="intro-text mt-4 text-lg leading-relaxed text-on-surface-variant">
                <span className="block">
                  <RevealText
                    text="Opisz swój problem lub pomysł —"
                    by="line"
                    delay={420}
                  />
                </span>
                <span className="block">
                  <RevealText
                    text="AiKonik pomoże Ci znaleźć inicjatywy i aktywności społeczne dopasowane do Twoich potrzeb."
                    by="line"
                    delay={720}
                  />
                </span>
              </p>
              <div
                className="intro mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
                style={{ "--d": "950ms" } as CSSProperties}
              >
                <Button
                  nativeButton={false}
                  render={<Link href="/asystent" />}
                  className="h-14 px-8 text-lg"
                >
                  Zapytaj AiKonika →
                </Button>
                <a
                  href="#jak-to-dziala"
                  className="inline-flex min-h-12 items-center self-start rounded-md px-0 sm:self-auto sm:px-5 text-base font-bold text-primary underline underline-offset-4 hover:bg-primary-container"
                >
                  Jak to działa?
                </a>
              </div>
            </div>
            <div
              className="intro intro-art"
              style={{ "--d": "250ms" } as CSSProperties}
            >
              <HeroArt
                className="mx-auto h-auto w-full max-w-sm"
                title="Schemat: trzy potrzeby mieszkańców, na przykład opieka dla mamy, trafiają do AiKonika, który wskazuje pasujące rozwiązania w małopolskich miejscowościach."
              />
            </div>
          </div>
        </section>

        {/* What is it */}
        <section
          aria-labelledby="co-to-jest"
          className="px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-5xl">
            <h2 id="co-to-jest" className={sectionTitle} data-reveal>
              <RevealText text="Co to jest AiKonik?" />
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
              AiKonik to aplikacja przygotowana dla Małopolskiego Hubu Innowacji
              Społecznych. Ma pięciu asystentów: pomagają dopasować sprawdzone
              rozwiązania do Twojej sytuacji, znaleźć dane o Małopolsce, opisać
              własny pomysł, zaplanować jego test i wdrożyć go w instytucji.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
              Asystenci korzystają z Biblioteki Innowacji Społecznych
              Regionalnego Ośrodka Polityki Społecznej w Krakowie (115 opisanych
              rozwiązań), raportów ROPS i danych Obserwatora ROPS.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
              AiKonik wykorzystuje sztuczną inteligencję i najnowsze technologie
              chmurowe. Działa szybko na każdym urządzeniu.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section
          id="jak-to-dziala"
          aria-labelledby="jak-to-dziala-title"
          className="scroll-mt-20 bg-surface px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-5xl">
            <h2 id="jak-to-dziala-title" className={sectionTitle} data-reveal>
              <RevealText text="Jak to działa?" />
            </h2>
            <ol
              className="mt-8 grid gap-6 md:grid-cols-3"
              data-reveal="stagger"
            >
              {steps.map(({ Icon, title, text }, i) => (
                <li
                  key={title}
                  className="rounded-3xl bg-surface-container p-6"
                >
                  <Icon className="size-20" />
                  <h3 className="mt-4 text-xl font-extrabold text-foreground">
                    <span className="mr-2 text-primary">Krok {i + 1}.</span>
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
          className="bg-secondary-container/40 px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-5xl">
            <h2 id="co-mozesz" className={sectionTitle} data-reveal>
              <RevealText text="Co możesz zrobić" />
            </h2>
            <ul
              className="mt-8 grid gap-6 md:grid-cols-3"
              data-reveal="stagger"
            >
              {features.map((f) => (
                <li
                  key={f.agent}
                  className="flex flex-col rounded-3xl bg-surface-container p-6"
                >
                  <f.Art className="h-24 w-auto self-start" />
                  <h3 className="mt-4 text-xl font-extrabold text-foreground">
                    {agents[f.agent].label}
                  </h3>
                  <p className="mt-2 flex-1 leading-relaxed text-on-surface-variant">
                    {f.text}
                  </p>
                  <Button
                    nativeButton={false}
                    render={<Link href={agentHref(f.agent)} />}
                    className="mt-5 h-12 self-start px-6 text-base"
                  >
                    Dalej
                  </Button>
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
            <h2 id="tak-wyglada" className={sectionTitle} data-reveal>
              <RevealText text="Tak wygląda asystent" />
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              Na górze wybierasz, w czym AiKonik ma pomóc: odkrywanie potrzeb,
              nowy pomysł, testowanie albo wdrażanie. Możesz kliknąć gotowe
              pytanie albo wpisać własne w polu na dole.
            </p>
            <div
              className="mt-8 flex flex-col items-start gap-8 md:flex-row md:items-end"
              data-reveal="stagger"
            >
              <figure className="w-full md:flex-1">
                <Image
                  src="/screens/asystent-desktop.png"
                  width={1280}
                  height={800}
                  unoptimized
                  className="h-auto w-full rounded-2xl border border-outline-variant shadow-soft"
                  alt="Zrzut ekranu asystenta na komputerze. Na górze zakładki etapów: Odkrywaj, Dodaj pomysł, Testuj innowacje i Wdrażanie innowacji. Pośrodku białej kolumny nagłówek „Od potrzeby do możliwości.”, krótki opis i trzy przykładowe pytania, a na dole pole do wpisania wiadomości."
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
                  className="h-auto w-full rounded-3xl border border-outline-variant shadow-soft"
                  alt="Zrzut ekranu asystenta na telefonie. Widać zakładki etapów, nagłówek „Od potrzeby do możliwości.”, krótki opis, przykładowe pytania oraz pole do wpisania wiadomości na dole ekranu."
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
            <h2 id="dla-kogo" className={sectionTitle} data-reveal>
              <RevealText text="Dla kogo?" />
            </h2>
            <ul
              className="mt-8 grid gap-6 sm:grid-cols-2"
              data-reveal="stagger"
            >
              {audiences.map(({ title, text, Art }) => (
                <li
                  key={title}
                  className="flex items-center gap-5 rounded-3xl border border-outline-variant bg-white p-5"
                >
                  <Art className="h-28 w-20 shrink-0 sm:w-24" />
                  <div>
                    <h3 className="text-xl font-extrabold text-foreground">
                      {title}
                    </h3>
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
          <div className="mx-auto max-w-5xl">
            <h2 id="dostepnosc" className={sectionTitle} data-reveal>
              <RevealText text="Dostępny dla każdego" />
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
              Chcemy, żeby z AiKonika mógł korzystać każdy. Dlatego tworzymy go
              zgodnie ze standardem WCAG 2.1, na poziomie AA. To jest nasz cel.
              Prototyp jest jeszcze w trakcie prac.
            </p>
            <ul className="mt-6 space-y-3" data-reveal="stagger">
              {accessibility.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-lg leading-relaxed text-on-surface-variant"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white"
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
          className="bg-primary-container px-4 py-14 text-center sm:px-6"
        >
          <div className="mx-auto max-w-2xl">
            <h2
              id="zacznij"
              className="text-3xl font-black tracking-tight text-on-primary-container sm:text-4xl"
              data-reveal
            >
              <RevealText text="Zacznij od jednego pytania" />
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-on-primary-container/85">
              Opisz swoją sytuację. To nic nie kosztuje.
            </p>
            <Button
              nativeButton={false}
              render={<Link href="/asystent" />}
              className="mt-8 h-14 px-8 text-lg"
            >
              Zapytaj AiKonika →
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
