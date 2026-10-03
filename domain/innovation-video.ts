import { z } from "zod";
import { getYouTubeVideoId } from "@/domain/youtube";

// Populated from cited catalog entries by the server, never from model URLs.
export const innovationVideoSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  url: z.url().refine((url) => getYouTubeVideoId(url) !== null),
});
