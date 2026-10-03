export const canvasSource = {
  id: "social-canvas",
  title: "ROPS / INNO AGH — arkusz innowacji społecznej",
  url: "https://rops.krakow.pl/mpliki/IS/Moj_folder/INNO_AGH_-_SOCIAL_CANVAS.pdf",
  excerpt:
    "Arkusz obejmuje problem, odbiorców, rozwiązanie, koszty, wartość, kanały, partnerów i wpływ innowacji.",
};

// A short idea description is application context; the remaining steps group
// the fields of the three-page source worksheet for a simple interview.
export const canvasSteps = [
  {
    label: "Opis pomysłu",
    question:
      "Jaki masz pomysł na zmianę społeczną? Opisz go krótko własnymi słowami.",
  },
  {
    label: "Problem",
    question:
      "Jaki problem chcesz rozwiązać — jak mocno przeszkadza, jak często się pojawia i jak wielu osób dotyczy?",
  },
  {
    label: "Odbiorcy",
    question: "Kto będzie korzystać z Twojego rozwiązania?",
  },
  {
    label: "Rozwiązanie",
    question:
      "Jak rozwiązanie ma działać i na jakim jest etapie: pomysł, prototyp, testy czy gotowość do wdrożenia?",
  },
  {
    label: "Kto zapłaci i kto zdecyduje",
    question:
      "Kto może finansować rozwiązanie, a kto decyduje o jego użyciu? Jeśli jeszcze nie wiesz, możesz tak odpowiedzieć.",
  },
  {
    label: "Propozycja wartości",
    question:
      "Jakie maksymalnie trzy korzyści praktyczne i trzy korzyści dla samopoczucia otrzymają odbiorcy?",
  },
  {
    label: "Kto pomoże, a kto przeszkodzi",
    question:
      "Jakie grupy lub instytucje wspierają zmianę, a jakie mogą ją utrudniać?",
  },
  {
    label: "Struktura kosztów",
    question:
      "Jakie stałe koszty i koszty zależne od liczby odbiorców przewidujesz? Szacunki lub „nie wiem” też są odpowiedzią.",
  },
  {
    label: "Źródła dochodów",
    question:
      "Skąd planujesz pozyskać pieniądze na działanie i rozwój — i które źródła są już potwierdzone?",
  },
  {
    label: "Jak dotrzeć do odbiorców",
    question:
      "Jak dotrzesz do odbiorców bezpośrednio, przez pośredników lub dodatkowymi kanałami?",
  },
  {
    label: "Partnerzy",
    question:
      "Kto może pomóc w realizacji i co wniesie? Zaznacz, czy to potencjalny partner, trwa rozmowa czy współpraca jest potwierdzona.",
  },
  {
    label: "Cel",
    question:
      "Jaką zmianę przewidujesz dla osoby, społeczności i środowiska — i co już potwierdzają obserwacje lub dane?",
  },
] as const;
