"use client";

import { type FormEvent, useRef, useState } from "react";
import type { AgentArtifact } from "@/agents/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AgentSubmissionForm({
  source,
  requestId,
  artifact,
  identity,
  onCancel,
  onSubmitted,
}: {
  source: "dodaj-pomysl" | "testuj-innowacje";
  requestId: string;
  artifact: AgentArtifact;
  identity: { conversationId: string; capability: string };
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const [step, setStep] = useState<"draft" | "contact">("draft");
  const [draft, setDraft] = useState(artifact);
  const [contact, setContact] = useState({
    name: "",
    surname: "",
    email: "",
    consent: false,
  });
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submissionId = useRef<string | null>(null);
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (step === "draft") {
      setStep("contact");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError(null);
    submissionId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: submissionId.current,
          source,
          requestId,
          artifact: draft,
          ...identity,
          ...contact,
        }),
      });
      const result = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !result.id)
        throw new Error(result.error ?? "Nie udało się wysłać zgłoszenia.");
      setReceipt(result.id);
      onSubmitted();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Nie udało się wysłać zgłoszenia. Spróbuj ponownie.",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  if (receipt)
    return (
      <p
        role="status"
        className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"
      >
        Zgłoszenie zostało zapisane i jest dostępne dla pracowników ROPS Kraków.
        Numer zgłoszenia: {receipt}.
      </p>
    );
  return (
    <section
      className="rounded-2xl border border-outline-variant bg-white p-5"
      aria-label="Formularz zgłoszenia"
    >
      <h2 className="font-semibold">
        {step === "draft" ? draft.title : "Dane kontaktowe"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
        {step === "draft"
          ? "Sprawdź szkic przygotowany przez asystenta. Możesz zmienić każde pole, a następnie przejść do danych kontaktowych. Anuluj, aby wrócić do rozmowy."
          : "Podaj dane do kontaktu. Wyślesz zatwierdzony szkic do ROPS Kraków. To zgłoszenie do kontaktu, bez zapisu do programu lub obietnicy finansowania."}
      </p>
      <form
        onSubmit={submit}
        onChange={() => {
          if (!submitting.current) submissionId.current = null;
        }}
        className="mt-4 flex flex-col gap-4"
      >
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-4">
          {step === "draft" ? (
            draft.fields.map((field, index) => (
              <div key={field.label} className="flex flex-col gap-2">
                <Label htmlFor={`submission-field-${requestId}-${index}`}>
                  {field.label}
                </Label>
                <Textarea
                  id={`submission-field-${requestId}-${index}`}
                  required
                  maxLength={2000}
                  rows={3}
                  value={field.value}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      fields: current.fields.map((entry, i) =>
                        i === index
                          ? { ...entry, value: event.target.value }
                          : entry,
                      ),
                    }))
                  }
                />
              </div>
            ))
          ) : (
            <>
              {(
                [
                  ["name", "Imię", "given-name"],
                  ["surname", "Nazwisko", "family-name"],
                  ["email", "Adres e-mail", "email"],
                ] as const
              ).map(([name, label, autoComplete]) => (
                <div key={name} className="flex flex-col gap-2">
                  <Label htmlFor={`submission-${name}-${requestId}`}>
                    {label}
                  </Label>
                  <Input
                    id={`submission-${name}-${requestId}`}
                    name={name}
                    type={name === "email" ? "email" : "text"}
                    required
                    maxLength={name === "email" ? 254 : 150}
                    autoComplete={autoComplete}
                    value={contact[name]}
                    onChange={(event) =>
                      setContact((current) => ({
                        ...current,
                        [name]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))}
              <Label className="items-start text-sm leading-6 font-normal">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  checked={contact.consent}
                  onChange={(event) =>
                    setContact((current) => ({
                      ...current,
                      consent: event.target.checked,
                    }))
                  }
                  className="mt-1 size-5 shrink-0"
                />
                Zgadzam się na przesłanie tego szkicu, imienia, nazwiska i
                adresu e-mail do ROPS Kraków w celu kontaktu w sprawie
                zgłoszenia.
              </Label>
            </>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="flex justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={
                step === "draft"
                  ? onCancel
                  : () => {
                      setStep("draft");
                      setError(null);
                    }
              }
            >
              {step === "draft" ? "Anuluj" : "Wstecz"}
            </Button>
            <Button type="submit">
              {pending ? "Wysyłanie…" : step === "draft" ? "Dalej" : "Wyślij"}
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
