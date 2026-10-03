import type { Where } from "payload";

export const submissionStatuses = [
  { label: "Nowe", value: "new" },
  { label: "W trakcie", value: "in-progress" },
  { label: "Czeka na odpowiedź", value: "waiting" },
  { label: "Zakończone", value: "completed" },
  { label: "Odrzucone", value: "rejected" },
];

export const submissionInboxes = [
  {
    source: "contact",
    label: "Zgłoszenia kontaktowe",
    icon: "✉",
    color: "blue",
  },
  {
    source: "dodaj-pomysl",
    label: "Pomysły mieszkańców",
    icon: "✦",
    color: "red",
  },
  {
    source: "testuj-innowacje",
    label: "Zgłoszenia do testowania",
    icon: "✓",
    color: "gold",
  },
] as const;

export function inboxURL(where: Where) {
  const params = new URLSearchParams();
  function append(value: unknown, path: string) {
    if (typeof value === "object" && value !== null) {
      for (const [key, child] of Object.entries(value))
        append(child, `${path}[${key}]`);
    } else {
      params.append(path, String(value));
    }
  }
  append(where, "where");
  return `/admin/collections/submissions?${params}`;
}

export function formatSubmissionDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Warsaw",
  }).format(new Date(value));
}
