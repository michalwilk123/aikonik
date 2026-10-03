"use client";

import { Send } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FieldName = "name" | "email" | "subject" | "message";
type Errors = Partial<Record<FieldName, string>>;

const ORDER: FieldName[] = ["name", "email", "subject", "message"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v: Record<FieldName, string>): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Wpisz swoje imię.";
  if (!v.email.trim()) e.email = "Wpisz adres e-mail.";
  else if (!EMAIL_RE.test(v.email.trim()))
    e.email = "Adres e-mail wygląda na niepełny. Przykład: anna@example.pl";
  if (!v.subject) e.subject = "Wybierz temat wiadomości.";
  if (!v.message.trim()) e.message = "Napisz wiadomość.";
  return e;
}

const fieldClass = "h-11 bg-white px-3 text-base";

function FieldError({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <p id={id} className="text-sm font-medium text-error">
      <span aria-hidden="true">Błąd: </span>
      {text}
    </p>
  );
}

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submissionId = useRef<string | null>(null);

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (pending) return;
    setSubmitError(null);
    setSent(false);
    const data = new FormData(ev.currentTarget);
    const values = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
    };
    const found = validate(values);
    setErrors(found);
    const first = ORDER.find((k) => found[k]);
    if (first) {
      setSent(false);
      const el = formRef.current?.querySelector<HTMLElement>(
        `[name="${first}"]`,
      );
      el?.focus();
      return;
    }
    setPending(true);
    submissionId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          id: submissionId.current,
          source: "contact",
        }),
      });
      const result = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !result.id)
        throw new Error(result.error ?? "Nie udało się wysłać wiadomości.");
      setSent(true);
      formRef.current?.reset();
      submissionId.current = null;
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="status">
        {sent && (
          <p className="rounded-2xl border border-gold bg-secondary-container p-4 font-medium text-on-surface">
            Dziękujemy. Wiadomość została zapisana i jest dostępna dla
            pracowników ROPS Kraków.
          </p>
        )}
      </div>
      {submitError && (
        <p role="alert" className="text-sm font-medium text-error">
          {submitError}
        </p>
      )}
      <form
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        onChange={() => {
          if (!pending) submissionId.current = null;
        }}
        className="flex flex-col gap-5"
      >
        <p className="text-sm text-on-surface-variant">
          Wszystkie pola są wymagane.
        </p>

        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Imię</Label>
          <Input
            id="name"
            name="name"
            autoComplete="given-name"
            required
            aria-required="true"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={fieldClass}
          />
          <FieldError id="name-error" text={errors.name} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Adres e-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={fieldClass}
          />
          <FieldError id="email-error" text={errors.email} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="subject">Temat</Label>
          <select
            id="subject"
            name="subject"
            defaultValue=""
            required
            aria-required="true"
            aria-invalid={errors.subject ? true : undefined}
            aria-describedby={errors.subject ? "subject-error" : undefined}
            className="h-11 w-full rounded-xl border border-input bg-white px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
          >
            <option value="" disabled>
              Wybierz temat
            </option>
            <option>Pytanie o Hub</option>
            <option>Chcę zgłosić inicjatywę</option>
            <option>Chcę zostać wolontariuszem</option>
            <option>Problem z dostępnością strony</option>
            <option>Inny temat</option>
          </select>
          <FieldError id="subject-error" text={errors.subject} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="message">Wiadomość</Label>
          <Textarea
            id="message"
            name="message"
            rows={5}
            required
            aria-required="true"
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "message-error" : undefined}
            className="min-h-32 bg-white px-3 py-2 text-base"
          />
          <FieldError id="message-error" text={errors.message} />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="h-11 self-start px-6 text-base"
        >
          <Send className="size-4" aria-hidden="true" />
          {pending ? "Wysyłanie…" : "Wyślij wiadomość"}
        </Button>
      </form>
    </div>
  );
}
