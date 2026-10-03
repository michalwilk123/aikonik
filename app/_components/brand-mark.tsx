// AiKonik wordmark: "Ai" in navy + "Konik" in Kraków red, Nunito 900.
export function Wordmark({ className = "text-2xl" }: { className?: string }) {
  return (
    <span
      className={`font-black tracking-tight whitespace-nowrap ${className}`}
    >
      <span className="text-foreground">Ai</span>
      <span className="text-primary">Konik</span>
    </span>
  );
}
