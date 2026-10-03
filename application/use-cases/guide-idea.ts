import type { IdeaGuide } from "@/application/ports/idea-guide";
import { canvasFields, type CanvasValue, type SocialInnovationCanvas } from "@/domain/social-innovation-canvas";

function isCanvasValue(value: unknown): value is CanvasValue {
  if (typeof value === "string") return true;
  if (!Array.isArray(value)) return false;
  return value.every((item) => typeof item === "string")
    || value.every((item) => item && typeof item === "object" && !Array.isArray(item));
}

function isCanvas(value: unknown): value is SocialInnovationCanvas {
  if (!value || typeof value !== "object") return false;
  const canvas = value as Record<string, unknown>;
  return canvas.id === "social-innovation-canvas"
    && canvas.version === "1.0"
    && canvas.title === "Social Innovation Canvas"
    && canvas.language === "pl"
    && Boolean(canvas.answers)
    && typeof canvas.answers === "object"
    && !Array.isArray(canvas.answers);
}

function hasValidStoredAnswers(canvas: SocialInnovationCanvas) {
  return Object.entries(canvas.answers).every(([fieldId, value]) => {
    const field = canvasFields.find((item) => item.id === fieldId);
    if (!field || !isCanvasValue(value)) return false;
    const values = Array.isArray(value) ? value : [value];

    if (field.type === "singleSelect") {
      return typeof value === "string" && field.options?.some((option) => option.value === value);
    }
    if (field.type === "multiSelect") {
      return values.length > 0
        && values.every((item) => typeof item === "string" && field.options?.some((option) => option.value === item));
    }
    if (field.type === "textarea") return typeof value === "string";
    if (field.type === "repeatableList") return Array.isArray(value) && value.every((item) => typeof item === "string");
    return Array.isArray(value) && value.every((item) => item && typeof item === "object" && !Array.isArray(item));
  });
}

export function makeGuideIdea(guide: IdeaGuide) {
  return {
    start(idea: unknown) {
      return guide.start(typeof idea === "string" ? idea.trim() : "");
    },
    reply(canvas: unknown, fieldId: unknown, value: unknown) {
      if (!isCanvas(canvas) || !hasValidStoredAnswers(canvas) || typeof fieldId !== "string" || !isCanvasValue(value)) {
        return guide.start("");
      }
      return guide.reply(canvas, fieldId, value);
    },
  };
}
