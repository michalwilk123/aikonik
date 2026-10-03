import type { IdeaGuide, IdeaGuideReply } from "@/application/ports/idea-guide";
import {
  createCanvas,
  missingRequiredField,
  type CanvasField,
  type CanvasValue,
  type SocialInnovationCanvas,
} from "@/domain/social-innovation-canvas";

const inferredDefaults: SocialInnovationCanvas["answers"] = {
  problem_intensity: "significant",
  problem_frequency: "often",
  problem_scale: "narrow_group",
  solution_clarity: "partially_clear",
  solution_value: "benefit_higher",
  implementation_readiness: "idea",
  emotional_values: ["agency"],
  functional_values: ["accessibility", "effectiveness"],
  main_revenue_stage: "idea",
  scaling_revenue_stage: "opportunities",
  individual_impact_level: "possible",
  community_impact_level: "possible",
  environmental_impact_level: "small",
};

const recipientKeywords = [
  ["children", ["dzieci", "dziecko", "przedszkol", "uczni"]],
  ["youth", ["młodzież", "nastolatk"]],
  ["parents", ["rodzic", "opiekun"]],
  ["seniors", ["senior", "osoby starsze", "emeryt"]],
  ["people_with_disabilities", ["niepełnosprawn"]],
  ["teachers", ["nauczyciel", "pedagog"]],
  ["institution_workers", ["pracowni", "urzędni"]],
  ["people_in_crisis", ["kryzys", "bezdomn", "przemoc"]],
  ["social_organizations", ["fundacj", "organizacj", "ngo"]],
  ["local_residents", ["mieszkań", "sąsiad", "dzielnic", "osiedl"]],
] as const;

function promptFor(field: CanvasField) {
  return `Żeby dobrze opisać pomysł, potrzebuję jeszcze jednej informacji: ${field.label}`;
}

function replyFor(canvas: SocialInnovationCanvas): IdeaGuideReply {
  const nextField = missingRequiredField(canvas);
  if (!nextField) {
    return {
      canvas,
      complete: true,
      nextField: null,
      message: "Mamy komplet wymaganych informacji. Możesz teraz wygenerować dokument.",
    };
  }
  return { canvas, complete: false, nextField, message: promptFor(nextField) };
}

function inferInitialAnswers(canvas: SocialInnovationCanvas, idea: string) {
  const text = idea.toLocaleLowerCase("pl-PL");
  Object.assign(canvas.answers, inferredDefaults);

  const recipients = recipientKeywords
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
    .map(([value]) => value);
  if (recipients.length) {
    canvas.answers.main_user = recipients;
  }

  if (/(codzien|każdego dnia|na co dzień)/.test(text)) canvas.answers.problem_frequency = "very_often";
  if (/(raz w tygodniu|co tydzień|regularnie)/.test(text)) canvas.answers.problem_frequency = "often";
  if (/(poważn|piln|wykluczen|krzywd|zagroże)/.test(text)) canvas.answers.problem_intensity = "very_serious";
  if (/(miast\w*|region\w*|wielu|tysiąc\w*)/.test(text)) canvas.answers.problem_scale = "large_group";
  if (/(cał\w* polsk|w całym kraju|ogólnopolsk)/.test(text)) canvas.answers.problem_scale = "very_broad";
  if (/(prototyp|mvp|pierwsza wersja)/.test(text)) canvas.answers.implementation_readiness = "prototype";
  if (/(testow|sprawdzon|użytkownik\w* już korzyst)/.test(text)) canvas.answers.implementation_readiness = "tested";
  if (/(gotow[ey]|wdroż|działa już)/.test(text)) canvas.answers.implementation_readiness = "ready";
  if (/(bezpłatn|darmo|grant|dotacj)/.test(text)) canvas.answers.main_revenue_stage = "unknown";
  if (/(sprzeda|abonament|płatn|kup)/.test(text)) canvas.answers.main_revenue_stage = "concrete";
  if (/(skalow|powiel|kolejn\w* miast)/.test(text)) canvas.answers.scaling_revenue_stage = "real_paths";

  canvas.answers.individual_impact = `Rozwiązanie ma ułatwić codzienne funkcjonowanie odbiorców opisanych w pomyśle: ${idea}`;
  canvas.answers.community_impact = "Pomysł ma wzmacniać dostęp do wsparcia i współpracę w lokalnej społeczności.";
  canvas.answers.environmental_impact = "Wpływ środowiskowy wymaga doprecyzowania podczas kolejnej iteracji pomysłu.";
}

export const mockIdeaGuide: IdeaGuide = {
  async start(idea) {
    const canvas = createCanvas(idea);
    inferInitialAnswers(canvas, idea);
    return replyFor(canvas);
  },
  async reply(canvas, fieldId, value) {
    const updated: SocialInnovationCanvas = {
      ...canvas,
      answers: { ...canvas.answers, [fieldId]: value },
    };
    return replyFor(updated);
  },
};
