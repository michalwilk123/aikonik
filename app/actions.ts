"use server";

import type { SupportAnswer } from "@/domain/support-offer";
import type { CanvasValue, SocialInnovationCanvas } from "@/domain/social-innovation-canvas";
import { findSupport, guideIdea } from "@/infrastructure/container";

export async function askAssistant(query: string): Promise<SupportAnswer> {
  return findSupport(query);
}

export async function startIdeaGuide(idea: string) {
  return guideIdea.start(idea);
}

export async function answerIdeaGuide(
  canvas: SocialInnovationCanvas,
  fieldId: string,
  value: CanvasValue,
) {
  return guideIdea.reply(canvas, fieldId, value);
}
