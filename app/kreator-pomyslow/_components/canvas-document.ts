import {
  canvasFields,
  optionLabel,
  type CanvasField,
  type CanvasValue,
  type SocialInnovationCanvas,
} from "@/domain/social-innovation-canvas";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function displayValue(field: CanvasField, value: CanvasValue) {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) {
      return value.map((item) => optionLabel(field, item)).join(", ");
    }
    return value.map((item) => JSON.stringify(item)).join(", ");
  }
  return optionLabel(field, value);
}

export function generateCanvasHtml(canvas: SocialInnovationCanvas) {
  const sections = [...new Map(canvasFields.map((field) => [field.sectionId, field])).values()];
  const content = sections
    .map((section) => {
      const fields = canvasFields
        .filter((field) => field.sectionId === section.sectionId && canvas.answers[field.id])
        .map(
          (field) =>
            `<dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(displayValue(field, canvas.answers[field.id]!))}</dd>`,
        )
        .join("");
      return fields ? `<section><h2>${escapeHtml(section.sectionTitle)}</h2><dl>${fields}</dl></section>` : "";
    })
    .join("");

  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(canvas.title)}</title>
  <style>
    body { max-width: 850px; margin: 48px auto; padding: 0 24px; color: #131b2e; font: 16px/1.6 Arial, sans-serif; }
    h1 { font-size: 32px; margin-bottom: 4px; } .meta { color: #45474c; margin-top: 0; }
    section { margin-top: 32px; padding-top: 20px; border-top: 1px solid #c5c6cd; }
    h2 { font-size: 21px; } dl { display: grid; grid-template-columns: minmax(180px, 35%) 1fr; gap: 12px 20px; }
    dt { font-weight: 700; } dd { margin: 0; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${escapeHtml(canvas.title)}</h1>
  <p class="meta">Wersja ${escapeHtml(canvas.version)} · język: ${escapeHtml(canvas.language)}</p>
  ${content}
</body>
</html>`;
}
