import type { Metadata } from "next";
import { Chat } from "@/app/_components/chat";
import { SiteHeader } from "@/app/_components/site-header";

export const metadata: Metadata = { title: "Asystent" };

export default function AssistantPage() {
  return (
    <>
      <SiteHeader current="/asystent" />
      <main id="tresc" tabIndex={-1} className="flex-1 pt-16 pb-64">
        <Chat />
      </main>
    </>
  );
}
