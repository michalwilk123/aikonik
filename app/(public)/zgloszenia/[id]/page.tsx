import type { Metadata } from "next";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
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
    <>
      <SiteHeader current="/kontakt" />
      <main
        id="tresc"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-28 pb-16 outline-none sm:px-6"
      >
        <h1 className="sr-only">Prywatna rozmowa</h1>
        <RequestConversation id={id} />
      </main>
      <SiteFooter />
    </>
  );
}
