import { ArrowUp, Square } from "lucide-react";
import type { Ref } from "react";
import { agents } from "@/agents/registry";
import type { AgentId } from "@/agents/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function AgentComposer({
  agentId,
  value,
  onChange,
  onSubmit,
  onStop,
  pending,
  inputRef,
}: {
  agentId: AgentId;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  pending: boolean;
  inputRef: Ref<HTMLTextAreaElement>;
}) {
  const agent = agents[agentId];
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-linear-to-t from-background via-background/90 to-transparent px-4 pt-10 pb-5 sm:px-6">
      <div className="pointer-events-auto mx-auto max-w-3xl">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-dock"
        >
          <label htmlFor="agent-prompt" className="sr-only">
            Wiadomość · {agent.label}
          </label>
          <Textarea
            id="agent-prompt"
            ref={inputRef}
            rows={1}
            maxLength={4000}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder={agent.placeholder}
            className="field-sizing-content max-h-40 min-h-12 flex-1 resize-none border-0 bg-transparent px-3 py-3 text-[15px] focus-visible:ring-0"
          />
          <Button
            type={pending ? "button" : "submit"}
            onClick={pending ? onStop : undefined}
            disabled={!pending && !value.trim()}
            aria-label={
              pending
                ? `Zatrzymaj · ${agent.label}`
                : `Wyślij wiadomość · ${agent.label}`
            }
            style={{ backgroundColor: agent.color }}
            className="size-12 shrink-0 rounded-full"
          >
            {pending ? (
              <Square className="size-4" fill="currentColor" />
            ) : (
              <ArrowUp className="size-5" />
            )}
          </Button>
        </form>
        <p className="mt-2 text-center text-xs text-slate-500">
          {agent.label} · Enter wysyła · Rozmowy dostępne do odświeżenia strony
        </p>
      </div>
    </div>
  );
}
