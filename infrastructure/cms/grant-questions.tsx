"use client";

import { useField } from "@payloadcms/ui";
import type { JSONFieldClientProps } from "payload";
import type { GrantQuestion } from "@/domain/grants";

export function GrantQuestions({ path, readOnly }: JSONFieldClientProps) {
  const { value, setValue, errorMessage } = useField<GrantQuestion[]>({ path });
  const questions = Array.isArray(value) ? value : [];
  function update(index: number, change: Partial<GrantQuestion>) {
    setValue(
      questions.map((question, position) =>
        position === index ? { ...question, ...change } : question,
      ),
    );
  }
  return (
    <section className="staff-canvas">
      <h2>Pytania we wniosku</h2>
      <p>
        Każdy nabór ma własny formularz. Złożone wnioski zachowują pytania i
        odpowiedzi z chwili wysłania.
      </p>
      {errorMessage && <p role="alert">{errorMessage}</p>}
      {questions.map((question, index) => (
        <fieldset
          key={question.key}
          disabled={readOnly}
          className="staff-cell staff-grant-question"
        >
          <legend>Pytanie {index + 1}</legend>
          <label>
            Treść pytania
            <input
              value={question.label}
              maxLength={150}
              onChange={(event) => update(index, { label: event.target.value })}
              required
            />
          </label>
          <label>
            Podpowiedź
            <textarea
              value={question.help}
              maxLength={1000}
              onChange={(event) => update(index, { help: event.target.value })}
            />
          </label>
          <label>
            Limit znaków
            <input
              type="number"
              min={50}
              max={2000}
              value={question.maxLength}
              onChange={(event) =>
                update(index, { maxLength: Number(event.target.value) })
              }
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={question.required}
              onChange={(event) =>
                update(index, { required: event.target.checked })
              }
            />
            Wymagana odpowiedź
          </label>
          {!readOnly && (
            <button
              type="button"
              onClick={() =>
                setValue(questions.filter((_, position) => position !== index))
              }
            >
              Usuń pytanie
            </button>
          )}
        </fieldset>
      ))}
      {!readOnly && (
        <button
          type="button"
          disabled={questions.length >= 24}
          onClick={() =>
            setValue([
              ...questions,
              {
                key: `pytanie_${crypto.randomUUID().slice(0, 8)}`,
                label: "",
                help: "",
                required: true,
                maxLength: 2000,
              },
            ])
          }
        >
          Dodaj pytanie
        </button>
      )}
    </section>
  );
}
