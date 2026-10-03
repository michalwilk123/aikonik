import type { IdeaGuide, IdeaGuideReply } from "@/application/ports/idea-guide";
import {
  canvasFields,
  createCanvas,
  type CanvasField,
  type CanvasValue,
  type SocialInnovationCanvas,
} from "@/domain/social-innovation-canvas";

const keyQuestionIds = [
  "main_user",
  "problem_intensity",
  "solution_value",
  "implementation_readiness",
  "main_revenue_stage",
] as const;

const inferredDefaults: SocialInnovationCanvas["answers"] = {
  problem_frequency: "often",
  problem_scale: "narrow_group",
  solution_clarity: "partially_clear",
  emotional_values: ["agency"],
  functional_values: ["accessibility", "effectiveness"],
  scaling_revenue_stage: "opportunities",
  individual_impact_level: "possible",
  community_impact_level: "possible",
  environmental_impact_level: "small",
};

const keyQuestions = new Map(
  keyQuestionIds.map((id) => {
    const field = canvasFields.find((item) => item.id === id);
    if (!field) throw new Error(`Missing canvas field: ${id}`);
    return [id, field];
  }),
);

function promptFor(field: CanvasField) {
  const index = keyQuestionIds.indexOf(field.id as (typeof keyQuestionIds)[number]);
  return `Pytanie ${index + 1} z 5: ${field.label}`;
}

function replyFor(canvas: SocialInnovationCanvas): IdeaGuideReply {
  const nextId = keyQuestionIds.find((id) => !canvas.answers[id]);
  const nextField = nextId ? keyQuestions.get(nextId) ?? null : null;
  if (!nextField) {
    return {
      canvas,
      complete: true,
      nextField: null,
      accepted: true,
      message: "Mamy komplet najważniejszych informacji. Możesz teraz wygenerować dokument.",
    };
  }

  return { canvas, complete: false, nextField, accepted: true, message: promptFor(nextField) };
}

function isMeaningfulIdea(idea: string) {
  const words = idea.match(/[\p{L}\p{N}]{2,}/gu) ?? [];
  return idea.length >= 24 && words.length >= 4 && /[aeiouyąęó]/iu.test(idea) && !/(.)\1{4,}/u.test(idea);
}

function isValidAnswer(field: CanvasField, value: CanvasValue) {
  if (!field.options) return false;
  const values = Array.isArray(value) ? value : [value];
  return values.length > 0
    && (field.type === "multiSelect" || values.length === 1)
    && values.every((item) => typeof item === "string" && field.options?.some((option) => option.value === item));
}

function rejectedReply(canvas: SocialInnovationCanvas, field: CanvasField): IdeaGuideReply {
  return {
    canvas,
    complete: false,
    nextField: field,
    accepted: false,
    validationMessage: "Proszę powtórz dokładnie, o co Ci chodziło.",
    message: promptFor(field),
  };
}

function inferSupportingAnswers(canvas: SocialInnovationCanvas, idea: string) {
  const text = idea.toLocaleLowerCase("pl-PL");
  Object.assign(canvas.answers, inferredDefaults);

  if (/(codzien|każdego dnia|na co dzień)/.test(text)) canvas.answers.problem_frequency = "very_often";
  if (/(miast\w*|region\w*|wielu|tysiąc\w*)/.test(text)) canvas.answers.problem_scale = "large_group";
  if (/(cał\w* polsk|w całym kraju|ogólnopolsk)/.test(text)) canvas.answers.problem_scale = "very_broad";
  if (/(skalow|powiel|kolejn\w* miast)/.test(text)) canvas.answers.scaling_revenue_stage = "real_paths";

  canvas.answers.individual_impact = `Rozwiązanie ma ułatwić codzienne funkcjonowanie odbiorców opisanych w pomyśle: ${idea}`;
  canvas.answers.community_impact = "Pomysł ma wzmacniać dostęp do wsparcia i współpracę w lokalnej społeczności.";
  canvas.answers.environmental_impact = "Wpływ środowiskowy wymaga doprecyzowania podczas kolejnej iteracji pomysłu.";
}

export const mockIdeaGuide: IdeaGuide = {
  async start(idea) {
    const canvas = createCanvas(idea);
    if (!isMeaningfulIdea(idea)) {
      return {
        canvas,
        complete: false,
        nextField: null,
        accepted: false,
        validationMessage: "Proszę powtórz dokładnie, o co Ci chodziło.",
        message: "Opisz proszę problem, odbiorców i planowane rozwiązanie w kilku zdaniach.",
      };
    }

    inferSupportingAnswers(canvas, idea);
    return replyFor(canvas);
  },
  async reply(canvas, fieldId, value) {
    const nextId = keyQuestionIds.find((id) => !canvas.answers[id]);
    const currentField = nextId ? keyQuestions.get(nextId) : undefined;
    if (!currentField || currentField.id !== fieldId || !isValidAnswer(currentField, value)) {
      return rejectedReply(canvas, currentField ?? keyQuestions.get(keyQuestionIds.at(-1)!)!);
    }

    const updated = {
      ...canvas,
      answers: { ...canvas.answers, [fieldId]: value },
    };
    return replyFor(updated);
  },
};
