import type { UIFieldServerProps } from "payload";
import { canvasSteps } from "@/agents/dodaj-pomysl/canvas";
import { artifactSchema } from "@/agents/types";

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
  const isIdea = data.source === "dodaj-pomysl";
  const sections = isIdea
    ? canvasSteps.map((step) => ({
        label: step.label,
        value: artifact.fields.find((field) => field.label === step.label)
          ?.value,
      }))
    : artifact.fields;
  const extraFields = isIdea
    ? artifact.fields.filter(
        (field) => !canvasSteps.some((step) => step.label === field.label),
      )
    : [];
  return (
    <section
      className="staff-canvas"
      aria-label={isIdea ? "Social Canvas pomysłu" : "Zgłoszenie do testowania"}
    >
      <div className="staff-section-heading">
        <div>
          <p className="staff-eyebrow">
            {isIdea
              ? "POMYSŁ MIESZKAŃCA · SOCIAL CANVAS"
              : "TESTOWANIE INNOWACJI"}
          </p>
          <h2>{artifact.title}</h2>
        </div>
        {isIdea && (
          <span className="staff-canvas-progress">
            {sections.filter((section) => section.value).length} /{" "}
            {canvasSteps.length} obszarów
          </span>
        )}
      </div>
      {isIdea && (
        <p className="staff-canvas-intro">
          Szkic przekazany przez mieszkańca. Niewypełnione obszary można
          uzupełnić podczas kontaktu; „nie wiem” oznacza odpowiedź wymagającą
          wspólnego dopracowania.
        </p>
      )}
      <div className="staff-canvas-grid">
        {[...sections, ...extraFields].map((section, index) => (
          <article
            className={`staff-canvas-section${section.value ? "" : " staff-canvas-section--empty"}`}
            key={section.label}
          >
            <p className="staff-eyebrow">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3>{section.label}</h3>
            <p className="staff-canvas-value">
              {section.value || "Nie omówiono w zgłoszeniu"}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
