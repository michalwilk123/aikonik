import type { IdeaGuide } from "@/application/ports/idea-guide";
import type { CanvasValue, SocialInnovationCanvas } from "@/domain/social-innovation-canvas";

export function makeGuideIdea(guide: IdeaGuide) {
  return {
    start(idea: string) {
      const trimmed = idea.trim();
      if (!trimmed) throw new Error("Idea must not be empty");
      return guide.start(trimmed);
    },
    reply(canvas: SocialInnovationCanvas, fieldId: string, value: CanvasValue) {
      if (!fieldId || value.length === 0) throw new Error("Answer must not be empty");
      return guide.reply(canvas, fieldId, value);
    },
  };
}
