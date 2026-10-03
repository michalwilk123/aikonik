"use client";

import { Send } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FieldName = "name" | "email" | "subject" | "message" | "consent";
type Errors = Partial<Record<FieldName, string>>;

const ORDER: FieldName[] = ["name", "email", "subject", "message", "consent"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v: Record<FieldName, string>, consent: boolean): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Wpisz swoje imię.";
  if (!v.email.trim()) e.email = "Wpisz adres e-mail.";
  else if (!EMAIL_RE.test(v.email.trim()))
    e.email = "Adres e-mail wygląda na niepełny. Przykład: anna@example.pl";
  if (!v.subject) e.subject = "Wybierz temat wiadomości.";
  if (!v.message.trim()) e.message = "Napisz wiadomość.";
  if (!consent) e.consent = "Zaznacz zgodę, żeby wysłać wiadomość.";
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
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);

  function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    const values = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
      consent: "",
    };
    const found = validate(values, consent);
    setErrors(found);
    const first = ORDER.find((k) => found[k]);
    if (first) {
      setSent(false);
      const el = formRef.current?.querySelector<HTMLElement>(
        first === "consent" ? "#consent" : `[name="${first}"]`,
      );
      el?.focus();
      return;
    }
    // Prototype: nothing is sent anywhere.
    setSent(true);
    setConsent(false);
    formRef.current?.reset();
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="status">
        {sent && (
          <p className="rounded-xl border border-secondary bg-secondary-container p-4 font-medium text-on-surface">
            Dziękujemy. To jest prototyp, więc wiadomość nie została wysłana.
            Prawdziwa wiadomość trafi do ROPS Kraków.
          </p>
        )}
      </div>
      <form
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
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
            className="h-11 w-full rounded-lg border border-input bg-white px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
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

        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={setConsent}
              required
              aria-required="true"
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? "consent-error" : undefined}
              className="mt-0.5 size-6 bg-white"
            />
            <Label
              htmlFor="consent"
              className="items-start text-sm leading-6 font-normal"
            >
              Zgadzam się, żeby ROPS Kraków odpowiedział na moją wiadomość.
              Użyje do tego mojego imienia i adresu e-mail.
            </Label>
          </div>
          <FieldError id="consent-error" text={errors.consent} />
        </div>

        <Button
          type="submit"
          className="h-11 self-start bg-secondary px-6 text-base font-semibold text-on-secondary hover:bg-secondary/90"
        >
          <Send className="size-4" aria-hidden="true" />
          Wyślij wiadomość
        </Button>
      </form>
    </div>
  );
}
