export type CanvasValue = string | string[] | Record<string, unknown>[];

export type CanvasField = {
  id: string;
  label: string;
  sectionId: string;
  sectionTitle: string;
  type: "singleSelect" | "multiSelect" | "textarea" | "repeatableList" | "repeatableObjectList";
  required?: boolean;
  options?: { value: string; label: string }[];
};

export type SocialInnovationCanvas = {
  id: "social-innovation-canvas";
  version: "1.0";
  title: "Social Innovation Canvas";
  language: "pl";
  answers: Partial<Record<string, CanvasValue>>;
};

const problemOptions = [
  ["very_serious", "Bardzo poważny problem"],
  ["significant", "Mocno przeszkadza"],
  ["moderate", "Utrudnia działanie"],
  ["minor", "Lekko przeszkadza"],
];
const frequencyOptions = [
  ["very_often", "Bardzo często"],
  ["often", "Często"],
  ["sometimes", "Czasami"],
  ["rarely", "Rzadko"],
];
const scaleOptions = [
  ["individual", "Pojedyncze osoby"],
  ["narrow_group", "Wąska grupa"],
  ["large_group", "Duża grupa"],
  ["very_broad", "Bardzo szeroka grupa"],
];
const solutionClarityOptions = [
  ["unclear", "Rozwiązanie jest niejasne"],
  ["partially_clear", "Rozwiązanie jest częściowo jasne"],
  ["clear", "Rozwiązanie jest jasne"],
  ["self_explanatory", "Ludzie potrafią wyjaśnić sami"],
];
const solutionValueOptions = [
  ["cost_higher", "Koszt jest większy niż korzyść"],
  ["balanced", "Korzyść i koszt są podobne"],
  ["benefit_higher", "Korzyść jest większa niż koszt"],
  ["very_high_value", "Bardzo duża wartość przy małym koszcie"],
];
const readinessOptions = [
  ["idea", "Pomysł"],
  ["prototype", "Prototyp"],
  ["tested", "Przetestowane rozwiązanie"],
  ["ready", "Gotowe do wdrożenia"],
];
const recipientsOptions = [
  ["children", "Dzieci"], ["youth", "Młodzież"], ["parents", "Rodzice"],
  ["seniors", "Seniorzy"], ["people_with_disabilities", "Osoby z niepełnosprawnościami"],
  ["teachers", "Nauczyciele"], ["institution_workers", "Pracownicy instytucji"],
  ["people_in_crisis", "Osoby w kryzysie"], ["social_organizations", "Organizacje społeczne"],
  ["local_residents", "Mieszkańcy konkretnego miejsca"], ["other", "Inna grupa"],
];
const emotionalOptions = [
  ["safety", "Bezpieczeństwo"], ["independence", "Niezależność"], ["calm", "Spokój"],
  ["motivation", "Motywacja"], ["confidence", "Pewność"], ["social_inclusion", "Włączenie społeczne"],
  ["less_loneliness", "Zmniejszenie samotności"], ["being_seen", "Poczucie bycia widzianym"],
  ["agency", "Większa sprawczość"], ["better_mood", "Poprawa nastroju"],
  ["better_health", "Poprawa stanu zdrowia"], ["life_satisfaction", "Większe zadowolenie z życia"],
];
const functionalOptions = [
  ["lower_costs", "Obniża koszty"], ["reach", "Zwiększa zasięg pomocy"],
  ["time_saving", "Oszczędza czas"], ["reduces_burden", "Zmniejsza obciążenie"],
  ["effectiveness", "Zwiększa skuteczność"], ["safety", "Poprawia bezpieczeństwo"],
  ["quality", "Poprawia jakość"], ["social_impact", "Zwiększa wpływ społeczny"],
  ["simplifies_process", "Upraszcza proces"], ["environment", "Ogranicza negatywny wpływ na środowisko"],
  ["accessibility", "Zwiększa dostępność"], ["decision_support", "Pomaga w podejmowaniu lepszych decyzji"],
];
const revenueOptions = [
  ["unknown", "Nie wiemy jeszcze"], ["idea", "Mamy pomysł"],
  ["concrete", "Mamy konkretną propozycję"], ["confirmed", "Mamy potwierdzenie"],
];
const scalingOptions = [
  ["none", "Brak jasnych dodatkowych źródeł"], ["opportunities", "Są szanse na dodatkowe pieniądze"],
  ["real_paths", "Widzimy realne ścieżki rozwoju"], ["repeatable", "Nasz model działania można powielać"],
];
const impactOptions = [
  ["small", "Mały wpływ"], ["possible", "Możliwy wpływ"],
  ["clear", "Wyraźny wpływ"], ["strong", "Silny wpływ"],
];

function options(values: string[][]) {
  return values.map(([value, label]) => ({ value, label }));
}

function field(
  sectionId: string,
  sectionTitle: string,
  id: string,
  label: string,
  type: CanvasField["type"],
  required = false,
  optionValues?: string[][],
): CanvasField {
  return { id, label, sectionId, sectionTitle, type, required, options: optionValues ? options(optionValues) : undefined };
}

export const canvasFields: CanvasField[] = [
  field("overview", "Pomysł", "idea_summary", "Opis pomysłu", "textarea"),
  field("problem", "Problem", "problem_intensity", "Jak bardzo źle jest bez Waszego rozwiązania?", "singleSelect", true, problemOptions),
  field("problem", "Problem", "problem_frequency", "Jak często występuje problem?", "singleSelect", true, frequencyOptions),
  field("problem", "Problem", "problem_scale", "Ilu ludzi dotyka problem?", "singleSelect", true, scaleOptions),
  field("change_actors", "Aktorzy zmiany", "supporting_change", "Kto wspiera zmianę?", "repeatableList"),
  field("change_actors", "Aktorzy zmiany", "blocking_change", "Kto utrudnia zmianę?", "repeatableList"),
  field("solution", "Rozwiązanie", "solution_clarity", "Czy rozwiązanie jest proste i zrozumiałe?", "singleSelect", true, solutionClarityOptions),
  field("solution", "Rozwiązanie", "solution_value", "Jaka jest relacja wartości rozwiązania do kosztu?", "singleSelect", true, solutionValueOptions),
  field("solution", "Rozwiązanie", "implementation_readiness", "Gotowość do wdrożenia", "singleSelect", true, readinessOptions),
  field("cost_structure", "Struktura kosztów", "fixed_costs", "Stałe koszty", "repeatableList"),
  field("cost_structure", "Struktura kosztów", "variable_costs", "Zmienne koszty", "repeatableList"),
  field("recipients", "Odbiorcy", "main_user", "Główny użytkownik", "multiSelect", true, recipientsOptions),
  field("value_proposition", "Propozycja wartości", "emotional_values", "Wartość emocjonalna", "multiSelect", true, emotionalOptions),
  field("value_proposition", "Propozycja wartości", "functional_values", "Wartość funkcjonalna", "multiSelect", true, functionalOptions),
  field("revenue", "Źródła dochodów", "main_revenue_stage", "Jak dobrze określone jest główne źródło dochodu?", "singleSelect", true, revenueOptions),
  field("revenue", "Źródła dochodów", "main_revenue_source", "Główne źródło dochodu", "textarea"),
  field("revenue", "Źródła dochodów", "payer", "Klient / płatnik", "multiSelect", false, recipientsOptions),
  field("revenue", "Źródła dochodów", "scaling_revenue_stage", "Możliwości skalowania dochodu", "singleSelect", true, scalingOptions),
  field("revenue", "Źródła dochodów", "additional_revenue_source", "Dodatkowe źródła dochodu", "textarea"),
  field("decision_makers", "Autorytet / instytucja / decydent", "decision_makers", "Czyja zgoda, rekomendacja albo decyzja jest potrzebna?", "multiSelect"),
  field("channels", "Kanały", "direct_channels", "Jak ludzie trafiają do Was bezpośrednio?", "multiSelect"),
  field("channels", "Kanały", "additional_channels", "Jakie dodatkowe kanały możecie wykorzystać?", "multiSelect"),
  field("partners", "Konstelacja partnerów", "partners", "Partnerzy", "repeatableObjectList"),
  field("audience_reach", "Dotarcie do odbiorców", "audience_partners", "Kto może pomóc Wam dotrzeć do odbiorców?", "multiSelect"),
  field("impact", "Wpływ", "individual_impact", "Osoba", "textarea"),
  field("impact", "Wpływ", "community_impact", "Społeczność", "textarea"),
  field("impact", "Wpływ", "environmental_impact", "Środowisko", "textarea"),
  field("impact", "Wpływ", "individual_impact_level", "Siła wpływu na osobę", "singleSelect", true, impactOptions),
  field("impact", "Wpływ", "community_impact_level", "Siła wpływu na społeczność", "singleSelect", true, impactOptions),
  field("impact", "Wpływ", "environmental_impact_level", "Siła wpływu na środowisko", "singleSelect", true, impactOptions),
];

export function createCanvas(ideaSummary: string): SocialInnovationCanvas {
  return {
    id: "social-innovation-canvas",
    version: "1.0",
    title: "Social Innovation Canvas",
    language: "pl",
    answers: { idea_summary: ideaSummary },
  };
}

export function missingRequiredField(canvas: SocialInnovationCanvas) {
  return canvasFields.find((item) => item.required && !canvas.answers[item.id]);
}

export function optionLabel(field: CanvasField, value: string) {
  return field.options?.find((option) => option.value === value)?.label ?? value;
}
