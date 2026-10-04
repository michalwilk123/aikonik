"use client";

import { type FormEvent, useRef, useState } from "react";
import {
  SubmissionReceipt,
  type SubmissionReceiptData,
} from "@/components/submission-receipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type GrantCall, validateGrantAnswers } from "@/domain/grants";

export function GrantApplicationForm({ call }: { call: GrantCall }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idea, setIdea] = useState("");
  const [suggestion, setSuggestion] = useState<{
    answers: Record<string, string>;
    guidance: string;
  } | null>(null);
  const [step, setStep] = useState<"draft" | "review">("draft");
  const [pending, setPending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SubmissionReceiptData | null>(null);
  const [contact, setContact] = useState({
    name: "",
    email: "",
    consent: false,
  });
  const submissionId = useRef<string | null>(null);
  const sending = useRef(false);

  async function draft() {
    if (drafting) return;
    setDrafting(true);
    setError(null);
    try {
      const response = await fetch(`/api/grant-calls/${call.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callVersion: call.updatedAt, idea, answers }),
      });
      const result = (await response.json()) as {
        answers?: Record<string, string>;
        guidance?: string;
        error?: string;
      };
      if (!response.ok || !result.answers)
        throw new Error(result.error ?? "Nie udało się przygotować szkicu.");
      setSuggestion({
        answers: result.answers,
        guidance: result.guidance ?? "",
      });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Nie udało się przygotować szkicu.",
      );
    } finally {
      setDrafting(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    setError(null);
    try {
      validateGrantAnswers(call, answers);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Sprawdź odpowiedzi.",
      );
      return;
    }
    if (step === "draft") {
      setStep("review");
      return;
    }
    sending.current = true;
    setPending(true);
    submissionId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/grant-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: submissionId.current,
          callId: call.id,
          callVersion: call.updatedAt,
          answers,
          ...contact,
        }),
      });
      const result = (await response.json()) as SubmissionReceiptData & {
        error?: string;
      };
      if (!response.ok || !result.id)
        throw new Error(result.error ?? "Nie udało się wysłać wniosku.");
      setReceipt(result);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Nie udało się wysłać wniosku.",
      );
    } finally {
      sending.current = false;
      setPending(false);
    }
  }
  if (receipt)
    return (
      <div className="mt-8">
        <SubmissionReceipt receipt={receipt} />
      </div>
    );
  return (
    <section
      className="mt-8 rounded-2xl border border-outline-variant bg-white p-5 sm:p-7"
      aria-label="Wniosek grantowy"
    >
      <h2 className="text-2xl font-bold">
        {step === "draft" ? "Przygotuj wniosek" : "Sprawdź i wyślij"}
      </h2>
      {step === "draft" && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl bg-surface-container p-4">
          <Label htmlFor="grant-idea">
            Opisz swój pomysł — opcjonalna pomoc asystenta
          </Label>
          <Textarea
            id="grant-idea"
            value={idea}
            maxLength={4000}
            rows={4}
            disabled={drafting}
            onChange={(event) => setIdea(event.target.value)}
          />
          <Button
            type="button"
            disabled={drafting || idea.trim().length < 20}
            onClick={() => void draft()}
            className="self-start"
          >
            {drafting ? "Przygotowywanie…" : "Zaproponuj odpowiedzi"}
          </Button>
          {suggestion && (
            <div className="flex flex-col gap-3">
              <p className="whitespace-pre-wrap text-sm leading-6">
                {suggestion.guidance}
              </p>
              {call.questions
                .filter((question) => suggestion.answers[question.key])
                .map((question) => (
                  <div key={question.key}>
                    <h3 className="text-sm font-semibold">{question.label}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                      {suggestion.answers[question.key]}
                    </p>
                  </div>
                ))}
              <Button
                type="button"
                variant="outline"
                className="self-start"
                onClick={() => {
                  setAnswers(suggestion.answers);
                  submissionId.current = null;
                  setSuggestion(null);
                }}
              >
                Użyj szkicu w formularzu
              </Button>
            </div>
          )}
        </div>
      )}
      <form
        onSubmit={submit}
        onChange={() => {
          if (!sending.current) submissionId.current = null;
        }}
        className="mt-6 flex flex-col gap-5"
      >
        <fieldset
          disabled={pending || drafting}
          className="flex min-w-0 flex-col gap-5"
        >
          {call.questions.map((question) => (
            <div className="flex flex-col gap-2" key={question.key}>
              <Label htmlFor={`grant-${question.key}`}>
                {question.label}
                {question.required ? " *" : " (opcjonalne)"}
              </Label>
              {step === "draft" ? (
                <>
                  {question.help && (
                    <p
                      id={`grant-${question.key}-help`}
                      className="text-sm leading-6 text-on-surface-variant"
                    >
                      {question.help}
                    </p>
                  )}
                  <Textarea
                    id={`grant-${question.key}`}
                    aria-describedby={
                      question.help ? `grant-${question.key}-help` : undefined
                    }
                    required={question.required}
                    maxLength={question.maxLength}
                    rows={4}
                    value={answers[question.key] ?? ""}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.key]: event.target.value,
                      }))
                    }
                  />
                  <span className="text-xs text-on-surface-variant">
                    {answers[question.key]?.length ?? 0} / {question.maxLength}
                  </span>
                </>
              ) : (
                <p className="whitespace-pre-wrap leading-7">
                  {answers[question.key] || "Nie podano"}
                </p>
              )}
            </div>
          ))}
          {step === "review" && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="grant-name">Imię i nazwisko</Label>
                <Input
                  id="grant-name"
                  required
                  maxLength={150}
                  autoComplete="name"
                  value={contact.name}
                  onChange={(event) =>
                    setContact((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="grant-email">Adres e-mail</Label>
                <Input
                  id="grant-email"
                  required
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  value={contact.email}
                  onChange={(event) =>
                    setContact((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
              <Label className="items-start text-sm leading-6 font-normal">
                <input
                  type="checkbox"
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
                Zgadzam się na przesłanie wniosku i danych kontaktowych do ROPS
                Kraków w celu obsługi zgłoszenia i kontaktu w jego sprawie.
              </Label>
            </>
          )}
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            {step === "review" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("draft")}
              >
                Wróć do edycji
              </Button>
            )}
            <Button type="submit">
              {pending
                ? "Wysyłanie…"
                : step === "draft"
                  ? "Sprawdź wniosek"
                  : "Wyślij wniosek"}
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
