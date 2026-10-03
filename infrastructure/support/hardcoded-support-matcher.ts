import type { SupportMatcher } from "@/application/ports/support-matcher";
import type { SupportAnswer } from "@/domain/support-offer";

// Prepared answer returned for every query until the AI matcher lands.
const ANSWER: SupportAnswer = {
  areaLabel: "Krowodrza (Dzielnica V)",
  offers: [
    {
      id: "wolontariat-wytchnieniowy",
      title: "Sąsiedzki Wolontariat Wytchnieniowy",
      badge: "Bezpłatne",
      description:
        "Regularne wizyty domowe, pomoc w zakupach, spacerach i kontakt telefoniczny.",
      meta: "Koordynator: 12 422 06 36 · Czas reakcji do 48h",
      action: { kind: "request", label: "Zgłoś potrzebę" },
    },
    {
      id: "klub-seniora-aktywny-krakow",
      title: "Klub Seniora „Aktywny Kraków”",
      badge: "650 m od ul. Lea",
      description:
        "Spotkania integracyjne, warsztaty oraz asystent odprowadzający z domu.",
      meta: "ul. Kazimierza Wielkiego 44 · Wtorki i czwartki 10:00–14:00",
      action: { kind: "details", label: "Szczegóły" },
    },
    {
      id: "cieply-posilek-mops",
      title: "Ciepły Posiłek i Dobre Słowo (MOPS)",
      badge: "Bezpłatne",
      description:
        "Dowóz świeżych obiadów i doraźne wsparcie bez skomplikowanych formalności.",
      meta: "Filia MOPS: ul. Radzikowskiego 39 · tel. 12 633 46 05",
      action: { kind: "link", label: "Informacje" },
    },
  ],
};

export const hardcodedSupportMatcher: SupportMatcher = {
  async match() {
    return ANSWER;
  },
};
