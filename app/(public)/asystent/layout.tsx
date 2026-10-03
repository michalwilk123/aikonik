import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Metadata } from "next";
import { Chat } from "@/app/_components/chat";
import { SiteHeader } from "@/app/_components/site-header";
import { isDevMode } from "@/infrastructure/chat/dev-mode";

export const metadata: Metadata = { title: "Asystent" };

// Keep conversations and pending requests alive when navigating between agents.
export default async function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { env } = await getCloudflareContext({ async: true });
  return (
    <>
      <SiteHeader current="/asystent" />
      <main id="tresc" tabIndex={-1} className="flex flex-1 flex-col pt-16">
        {children}
        <Chat devMode={isDevMode(env.DEV)} />
      </main>
    </>
  );
}
