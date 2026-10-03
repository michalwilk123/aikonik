import { canvasSteps } from "@/agents/dodaj-pomysl/canvas";
import { testPlanFields } from "@/agents/testuj-innowacje/plan";
import type { AgentArtifact } from "@/agents/types";

export type SubmissionSource = "dodaj-pomysl" | "testuj-innowacje";

export const submissionTemplates: Record<
  SubmissionSource,
  { title: string; labels: readonly string[] }
> = {
  "dodaj-pomysl": {
    title: "Mój pomysł",
    labels: canvasSteps.map((step) => step.label),
  },
  "testuj-innowacje": {
    title: "Plan testu innowacji",
    labels: testPlanFields,
  },
};

// Every field of the source's form, prefilled from the latest draft. Fields the
// assistant added outside the template are kept after the template fields.
export function manualDraft(
  source: SubmissionSource,
  artifact: AgentArtifact | null | undefined,
): AgentArtifact {
  const template = submissionTemplates[source];
  const fields = artifact?.fields ?? [];
  return {
    title: artifact?.title ?? template.title,
    fields: [
      ...template.labels.map((label) => ({
        label,
        value: fields.find((field) => field.label === label)?.value ?? "",
      })),
      ...fields.filter((field) => !template.labels.includes(field.label)),
    ],
  };
}
