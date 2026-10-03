"use client";

import { CheckCircle2, FileText, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { answerIdeaGuide, startIdeaGuide } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { IdeaGuideReply } from "@/application/ports/idea-guide";
import type { CanvasField } from "@/domain/social-innovation-canvas";
import { generateCanvasHtml } from "./canvas-document";

type Message = { role: "assistant" | "user"; content: string };

function AnswerChoices({
  field,
  onAnswer,
  pending,
}: {
  field: CanvasField;
  onAnswer: (value: string | string[]) => void;
  pending: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const multiple = field.type === "multiSelect";
  const values = field.options ?? [];

  if (!multiple) {
    return (
      <div className="flex flex-wrap gap-2">
        {values.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            disabled={pending}
            onClick={() => onAnswer(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2">
        {values.map((option) => {
          const active = selected.includes(option.value);
          return (
            <Button
              key={option.value}
              variant={active ? "secondary" : "outline"}
              disabled={pending}
              onClick={() =>
                setSelected((current) =>
                  active ? current.filter((value) => value !== option.value) : [...current, option.value],
                )
              }
            >
              {option.label}
            </Button>
          );
        })}
      </div>
      <Button disabled={pending || selected.length === 0} onClick={() => onAnswer(selected)}>
        Potwierdź wybór
      </Button>
    </div>
  );
}

export function IdeaCreatorChat() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [reply, setReply] = useState<IdeaGuideReply | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const nextQuestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      nextQuestionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [messages.length, pending]);

  async function begin() {
    const text = idea.trim();
    if (!text || pending || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    setMessages([{ role: "user", content: text }]);
    try {
      const result = await startIdeaGuide(text);
      setReply(result);
      setMessages((current) => [...current, { role: "assistant", content: result.message }]);
      setIdea("");
    } catch {
      setError("Nie udało się rozpocząć rozmowy. Spróbuj ponownie.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  async function answer(value: string | string[]) {
    if (!reply?.nextField || pending || inFlight.current) return;
    const field = reply.nextField;
    const content = Array.isArray(value)
      ? value.map((item) => field.options?.find((option) => option.value === item)?.label ?? item).join(", ")
      : field.options?.find((option) => option.value === value)?.label ?? value;
    inFlight.current = true;
    setPending(true);
    setError(null);
    setMessages((current) => [...current, { role: "user", content }]);
    try {
      const result = await answerIdeaGuide(reply.canvas, field.id, value);
      setReply(result);
      setMessages((current) => [...current, { role: "assistant", content: result.message }]);
    } catch {
      setError("Nie udało się zapisać odpowiedzi. Spróbuj ponownie.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  function generateDocument() {
    if (!reply?.complete) return;
    sessionStorage.setItem("idea-creator-document", generateCanvasHtml(reply.canvas));
    router.push("/kreator-pomyslow/dokument");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <section className="rounded-3xl bg-surface-container-low p-6 sm:p-8">
        <p className="mb-2 text-sm font-semibold tracking-wider text-secondary uppercase">Kreator pomysłów</p>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Masz pomysł na innowację społeczną w Twoim regionie?</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">
          Opisz swój pomysł własnymi słowami i odpowiedz na pytania.
        </p>
          <p className="mt-3 max-w-2xl text-on-surface-variant">
              Pomysł zostanie przekazany do administratorów.
          </p>
      </section>

      {messages.length === 0 ? (
        <form
          className="rounded-2xl border border-outline-variant/40 bg-white p-4 shadow-soft"
          onSubmit={(event) => {
            event.preventDefault();
            begin();
          }}
        >
          <label htmlFor="idea" className="text-sm font-semibold text-primary">Od czego zaczynamy?</label>
          <Textarea
            id="idea"
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder="Np. chcemy pomóc seniorom z naszej dzielnicy łatwiej umawiać wizyty i załatwiać sprawy online."
            className="mt-3 min-h-32"
          />
          <Button className="mt-4" disabled={pending || !idea.trim()} type="submit">
            <Send /> Rozpocznij rozmowę
          </Button>
        </form>
      ) : (
        <section aria-live="polite" className="flex flex-col gap-5">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "user"
                  ? "max-w-xl self-end rounded-2xl bg-surface-container-low px-4 py-3 text-on-surface"
                  : "max-w-2xl rounded-2xl bg-white px-5 py-4 shadow-soft"
              }
            >
              {message.content}
            </div>
          ))}
          <div ref={nextQuestionRef} className="scroll-mt-24">
            {reply?.nextField ? (
              <AnswerChoices key={reply.nextField.id} field={reply.nextField} onAnswer={answer} pending={pending} />
            ) : null}
          </div>
          {pending ? <span className="text-sm text-on-surface-variant">Agent analizuje odpowiedź…</span> : null}
          {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
          {error && !reply ? (
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setMessages([]);
              }}
            >
              Spróbuj ponownie
            </Button>
          ) : null}
          {reply?.complete ? (
            <div ref={nextQuestionRef} className="rounded-2xl border border-secondary/30 bg-secondary-container/30 p-5 scroll-mt-24">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <CheckCircle2 className="text-secondary" /> Kanwa jest gotowa
              </div>
              <Button className="mt-4" onClick={generateDocument}>
                <FileText /> Generuj dokument
              </Button>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
