import type { Metadata } from "next";
import { Chat } from "@/app/_components/chat";
import { SiteHeader } from "@/app/_components/site-header";

export const metadata: Metadata = { title: "Asystent" };

export default function AssistantPage() {
  return (
    <>
      <SiteHeader current="/asystent" />
      <main id="tresc" tabIndex={-1} className="flex flex-1 flex-col pt-16">
        <Chat />
      </main>
    </>
  );
}
