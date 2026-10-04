"use client";

import { type FormEvent, useId, useRef, useState } from "react";
import type { AgentArtifact } from "@/agents/types";
import {
  SubmissionReceipt,
  type SubmissionReceiptData,
} from "@/components/submission-receipt";
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
  // Null when the form is filled in by hand before the assistant replied.
  requestId: string | null;
  artifact: AgentArtifact;
  identity: { conversationId: string; capability: string } | null;
  onCancel: () => void;
  onSubmitted: (receipt: SubmissionReceiptData) => void;
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
  const [receipt, setReceipt] = useState<SubmissionReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submissionId = useRef<string | null>(null);
  const submitting = useRef(false);
  const formId = useId();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (step === "draft") {
      if (draft.fields.some((field) => !field.value.trim())) {
        setError("Uzupełnij wszystkie pola.");
        return;
      }
      setError(null);
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
          artifact: draft,
          ...(requestId && identity ? { requestId, ...identity } : {}),
          ...contact,
        }),
      });
      const result = (await response.json()) as SubmissionReceiptData & {
        error?: string;
      };
      if (!response.ok || !result.id)
        throw new Error(result.error ?? "Nie udało się wysłać zgłoszenia.");
      setReceipt(result);
      onSubmitted(result);
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
  if (receipt) return <SubmissionReceipt receipt={receipt} />;
  return (
    <section
      className="rounded-2xl border border-outline-variant bg-white p-5"
      aria-label="Formularz zgłoszenia"
    >
      <h2 className="font-semibold">
        {step === "draft" ? draft.title : "Dane kontaktowe"}
      </h2>
      {step === "contact" && (
        <p className="mt-1 text-sm leading-6 text-on-surface-variant">
          Wyślesz szkic do ROPS Kraków w celu kontaktu. To nie jest zapis do
          programu ani obietnica finansowania.
        </p>
      )}
      <form
        onSubmit={submit}
        onChange={() => {
          if (!submitting.current) submissionId.current = null;
        }}
        className="mt-3 flex flex-col gap-3"
      >
        <fieldset disabled={pending} className="flex min-w-0 flex-col gap-3">
          {step === "draft" ? (
            draft.fields.map((field, index) => (
              <div
                key={field.label}
                className="flex flex-col gap-1 sm:grid sm:grid-cols-[9rem_1fr] sm:items-start sm:gap-3"
              >
                <Label
                  htmlFor={`submission-field-${formId}-${index}`}
                  className="sm:pt-2"
                >
                  {field.label}
                </Label>
                <Textarea
                  id={`submission-field-${formId}-${index}`}
                  required
                  maxLength={2000}
                  rows={1}
                  className="min-h-0 resize-none"
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
                <div
                  key={name}
                  className="flex flex-col gap-1 sm:grid sm:grid-cols-[9rem_1fr] sm:items-center sm:gap-3"
                >
                  <Label htmlFor={`submission-${name}-${formId}`}>
                    {label}
                  </Label>
                  <Input
                    id={`submission-${name}-${formId}`}
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
          <div className="flex justify-end gap-3">
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
