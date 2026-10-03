import { ArrowUp } from "lucide-react";
import type { Ref } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  inputRef: Ref<HTMLTextAreaElement>;
};

export function PromptDock({
  value,
  onChange,
  onSubmit,
  pending,
  inputRef,
}: Props) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-linear-to-t from-background via-background/90 to-transparent px-6 pt-10 pb-5">
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex items-end gap-2 rounded-2xl border border-outline-variant/30 bg-white p-2 shadow-dock"
        >
          <label htmlFor="prompt" className="sr-only">
            Opisz sytuację lub potrzebę
          </label>
          <Textarea
            id="prompt"
            ref={inputRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="Napisz tutaj, czego szukasz... (np. opieka dla mamy, posiłki, klub seniora w mojej okolicy)"
            className="max-h-40 min-h-12 flex-1 resize-none border-0 bg-transparent px-3 py-3 text-[15px] focus-visible:ring-0"
          />
          <Button
            type="submit"
            disabled={pending}
            aria-label="Wyślij zapytanie do asystenta"
            className="size-12 shrink-0 rounded-full"
          >
            <ArrowUp className="size-5" />
          </Button>
        </form>
        <p className="text-center text-xs text-on-surface-variant">
          Wsparcie jest całkowicie bezpłatne · Regionalny Ośrodek Polityki
          Społecznej w Krakowie
        </p>
      </div>
    </div>
  );
}
