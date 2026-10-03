// AIkonik wordmark: "AI" in navy + "konik" in Kraków red, Nunito 900.
export function Wordmark({ className = "text-2xl" }: { className?: string }) {
  return (
    <span
      className={`font-black tracking-tight whitespace-nowrap ${className}`}
    >
      <span className="text-foreground">AI</span>
      <span className="text-primary">konik</span>
    </span>
  );
}
