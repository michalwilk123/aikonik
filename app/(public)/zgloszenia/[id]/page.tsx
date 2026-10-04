import type { Metadata } from "next";
import { RequestConversation } from "@/app/(public)/zgloszenia/[id]/request-conversation";

export const metadata: Metadata = {
  title: "Prywatna rozmowa",
  description: "Rozmowa w sprawie zgłoszenia do ROPS Kraków.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function RequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main
      id="tresc"
      tabIndex={-1}
      className="flex h-dvh w-full flex-col overflow-hidden outline-none"
    >
      <h1 className="sr-only">Prywatna rozmowa</h1>
      <RequestConversation id={id} />
    </main>
  );
}
