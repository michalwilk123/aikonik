import type { UIFieldServerProps } from "payload";
import { canvasSteps } from "@/agents/dodaj-pomysl/canvas";
import { artifactSchema } from "@/agents/types";

// Zones follow the colour grouping of the printed canvas: who has the problem,
// the solution, the money, the value, the reach and the impact.
const zones: Record<string, string> = {
  Problem: "problem",
  Odbiorcy: "people",
  "Kto pomoże, a kto przeszkodzi": "people",
  Rozwiązanie: "solution",
  "Struktura kosztów": "money",
  "Kto zapłaci i kto zdecyduje": "money",
  "Źródła dochodów": "money",
  "Propozycja wartości": "value",
  "Jak dotrzeć do odbiorców": "reach",
  Partnerzy: "reach",
  Cel: "impact",
};

// Labels renamed to plainer Polish; older submissions still use the originals.
const renamedLabels: Record<string, string> = {
  "Płatnicy i decydenci": "Kto zapłaci i kto zdecyduje",
  "Aktorzy zmiany": "Kto pomoże, a kto przeszkodzi",
  "Kanały dotarcia": "Jak dotrzeć do odbiorców",
  "Konstelacja partnerów": "Partnerzy",
  Wpływ: "Cel",
};

// Position on the 4-column board, in reading order of the printed canvas.
const boardOrder = [
  "Problem",
  "Kto pomoże, a kto przeszkodzi",
  "Rozwiązanie",
  "Struktura kosztów",
  "Odbiorcy",
  "Kto zapłaci i kto zdecyduje",
  "Źródła dochodów",
  "Propozycja wartości",
  "Jak dotrzeć do odbiorców",
  "Partnerzy",
  "Cel",
];

export function SubmissionPreview({ data }: UIFieldServerProps) {
  if (data.source === "contact") return null;
  const parsed = artifactSchema.safeParse(data.artifact);
  if (!parsed.success) {
    return (
      <section className="staff-canvas">
        <h2>Treść zgłoszenia</h2>
        <p className="staff-canvas-value">
          {data.details || "Brak opisu w zgłoszeniu."}
        </p>
      </section>
    );
  }
  const artifact = {
    ...parsed.data,
    fields: parsed.data.fields.map((field) => ({
      ...field,
      label: renamedLabels[field.label] ?? field.label,
    })),
  };
  if (data.source !== "dodaj-pomysl") {
    return (
      <section className="staff-canvas" aria-label="Zgłoszenie do testowania">
        <h2>{artifact.title}</h2>
        <div className="staff-canvas-list">
          {artifact.fields.map((field) => (
            <div className="staff-cell" key={field.label}>
              <h3>{field.label}</h3>
              <p className="staff-canvas-value">{field.value}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }
  const answerFor = (label: string) =>
    artifact.fields.find((field) => field.label === label)?.value;
  const known = new Set<string>(canvasSteps.map((step) => step.label));
  const extra = artifact.fields.filter((field) => !known.has(field.label));
  const filled = canvasSteps.filter((step) => answerFor(step.label)).length;
  const description = answerFor("Opis pomysłu");
  return (
    <section className="staff-canvas" aria-label="Szkic pomysłu">
      <header className="staff-canvas-head">
        <h2>{artifact.title}</h2>
        {description && <p className="staff-canvas-lede">{description}</p>}
        <div
          className="staff-coverage"
          role="img"
          aria-label={`Wypełnione obszary: ${filled} z ${canvasSteps.length}`}
        >
          {canvasSteps.map((step) => (
            <span
              key={step.label}
              title={step.label}
              className={`staff-coverage-seg staff-zone--${zones[step.label] ?? "idea"}${answerFor(step.label) ? " is-filled" : ""}`}
            />
          ))}
          <b>
            {filled}/{canvasSteps.length}
          </b>
        </div>
      </header>
      <div className="staff-board">
        {boardOrder.map((label) => {
          const value = answerFor(label);
          return (
            <article
              key={label}
              className={`staff-cell staff-zone--${zones[label]}${value ? "" : " staff-cell--empty"}`}
            >
              <h3>{label}</h3>
              <p className="staff-canvas-value">
                {value || "Nie omówiono w zgłoszeniu"}
              </p>
            </article>
          );
        })}
        {extra.map((field) => (
          <article className="staff-cell staff-zone--idea" key={field.label}>
            <h3>{field.label}</h3>
            <p className="staff-canvas-value">{field.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
