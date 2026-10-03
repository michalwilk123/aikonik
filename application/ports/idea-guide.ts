import type { CanvasField, CanvasValue, SocialInnovationCanvas } from "@/domain/social-innovation-canvas";

export type IdeaGuideReply = {
  canvas: SocialInnovationCanvas;
  message: string;
  nextField: CanvasField | null;
  complete: boolean;
  accepted: boolean;
  validationMessage?: string;
};

export interface IdeaGuide {
  start(idea: string): Promise<IdeaGuideReply>;
  reply(canvas: SocialInnovationCanvas, fieldId: string, value: CanvasValue): Promise<IdeaGuideReply>;
}
