import type { UIFieldServerProps } from "payload";
import { canvasSteps } from "@/agents/dodaj-pomysl/canvas";
import { artifactSchema } from "@/agents/types";

// Zones follow the colour grouping of the printed canvas: who has the problem,
// the solution, the money, the value, the reach and the impact.
const zones: Record<string, string> = {
  Problem: "problem",
  Odbiorcy: "people",
  "Aktorzy zmiany": "people",
  Rozwiązanie: "solution",
  "Struktura kosztów": "money",
  "Płatnicy i decydenci": "money",
  "Źródła dochodów": "money",
  "Propozycja wartości": "value",
  "Kanały dotarcia": "reach",
  "Konstelacja partnerów": "reach",
  Wpływ: "impact",
};

// Position on the 4-column board, in reading order of the printed canvas.
const boardOrder = [
  "Problem",
  "Aktorzy zmiany",
  "Rozwiązanie",
  "Struktura kosztów",
  "Odbiorcy",
  "Płatnicy i decydenci",
  "Źródła dochodów",
  "Propozycja wartości",
  "Kanały dotarcia",
  "Konstelacja partnerów",
  "Wpływ",
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
  const artifact = parsed.data;
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
    <section className="staff-canvas" aria-label="Social Canvas pomysłu">
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
