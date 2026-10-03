"use client";

import { useEffect, useRef, useState } from "react";
import { askAssistant } from "@/app/actions";
import type { SupportAnswer, SupportOffer } from "@/domain/support-offer";
import {
  ResponseDeadlineError,
  withResponseDeadline,
} from "@/infrastructure/async/response-deadline";
import { ContactDialog } from "./contact-dialog";
import { PromptDock } from "./prompt-dock";
import { SupportOfferCard } from "./support-offer-card";
import { Welcome } from "./welcome";

type Turn = {
  id: number;
  query: string;
  answer: SupportAnswer | null;
  error?: string;
};

export function Chat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [contactOffer, setContactOffer] = useState<SupportOffer | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const pending = turns.some((t) => t.answer === null && !t.error);

  useEffect(() => {
    if (turns.length > 0) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [turns]);

  async function submit() {
    const query = draft.trim();
    if (!query) {
      inputRef.current?.focus();
      return;
    }
    if (pending) {
      return;
    }
    const id = turns.length;
    setTurns((prev) => [...prev, { id, query, answer: null }]);
    setDraft("");
    try {
      const answer = await withResponseDeadline(askAssistant(query));
      setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, answer } : t)));
    } catch (error) {
      setTurns((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                error:
                  error instanceof ResponseDeadlineError
                    ? "Odpowiedź trwa zbyt długo. Spróbuj ponownie za chwilę."
                    : "Nie udało się uzyskać odpowiedzi. Spróbuj ponownie za chwilę.",
              }
            : t,
        ),
      );
    }
  }

  return (
    <>
      {turns.length === 0 ? (
        <Welcome
          onPick={(text) => {
            setDraft(text);
            inputRef.current?.focus();
          }}
        />
      ) : (
        <div className="mx-auto flex max-w-3xl flex-col gap-8 py-8">
          {turns.map((turn) => (
            <div key={turn.id} className="flex flex-col gap-6">
              <div className="max-w-xl self-end rounded-2xl bg-surface-container-low px-4 py-2 whitespace-pre-wrap text-on-surface">
                {turn.query}
              </div>
              {turn.answer ? (
                <section className="flex flex-col gap-3">
                  <h2 className="text-xs font-semibold tracking-wider text-secondary uppercase">
                    Rekomendowane wsparcie · {turn.answer.areaLabel}
                  </h2>
                  <p className="whitespace-pre-wrap text-on-surface">
                    {turn.answer.message}
                  </p>
                  {turn.answer.offers.map((offer) => (
                    <SupportOfferCard
                      key={offer.id}
                      offer={offer}
                      onRequest={setContactOffer}
                    />
                  ))}
                </section>
              ) : turn.error ? (
                <p role="alert" className="text-on-surface">
                  {turn.error}
                </p>
              ) : (
                <div
                  role="status"
                  aria-label="Asystent szuka wsparcia"
                  className="flex gap-1.5 px-1"
                >
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      style={{ animationDelay: `${delay}ms` }}
                      className="size-2 animate-pulse rounded-full bg-outline"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} className="scroll-mb-56" />
        </div>
      )}
      <PromptDock
        value={draft}
        onChange={setDraft}
        onSubmit={submit}
        pending={pending}
        inputRef={inputRef}
      />
      <ContactDialog
        offerTitle={contactOffer?.title ?? null}
        onClose={() => setContactOffer(null)}
      />
    </>
  );
}
