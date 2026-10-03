"use client";

import { type FormEvent, useRef, useState } from "react";
import type { AgentArtifact } from "@/agents/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AgentSubmissionForm({
  source,
  requestId,
  artifact,
  identity,
}: {
  source: "dodaj-pomysl" | "testuj-innowacje";
  requestId: string;
  artifact: AgentArtifact;
  identity: { conversationId: string; capability: string };
}) {
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submissionId = useRef<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const fields = new FormData(event.currentTarget);
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
          artifact,
          ...identity,
          name: fields.get("name"),
          email: fields.get("email"),
          consent: fields.get("consent") === "on",
        }),
      });
      const result = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !result.id)
        throw new Error(result.error ?? "Nie udało się wysłać zgłoszenia.");
      setReceipt(result.id);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Nie udało się wysłać zgłoszenia. Spróbuj ponownie.",
      );
    } finally {
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
    <details className="rounded-2xl border border-outline-variant bg-white p-5">
      <summary className="cursor-pointer font-semibold">
        Przekaż ten szkic do ROPS Kraków
      </summary>
      <form
        onSubmit={submit}
        onChange={() => {
          if (!pending) submissionId.current = null;
        }}
        className="mt-4 flex flex-col gap-4"
      >
        <p className="text-sm leading-6 text-on-surface-variant">
          Przejrzyj szkic powyżej. Wyślesz tę wersję wraz z imieniem i adresem
          e-mail do pracowników ROPS. To zgłoszenie do kontaktu, bez zapisu do
          programu lub obietnicy finansowania.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`submission-name-${requestId}`}>Imię</Label>
          <Input
            id={`submission-name-${requestId}`}
            name="name"
            required
            maxLength={150}
            autoComplete="given-name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`submission-email-${requestId}`}>Adres e-mail</Label>
          <Input
            id={`submission-email-${requestId}`}
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
          />
        </div>
        <Label className="items-start text-sm leading-6 font-normal">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-1 size-5 shrink-0"
          />
          Zgadzam się na przesłanie tego szkicu, imienia i adresu e-mail do ROPS
          Kraków w celu kontaktu w sprawie zgłoszenia.
        </Label>
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Wysyłanie…" : "Wyślij zgłoszenie do ROPS"}
        </Button>
      </form>
    </details>
  );
}
