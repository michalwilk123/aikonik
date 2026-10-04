import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isDevMode } from "@/infrastructure/chat/dev-mode";
import { createDevConversation } from "@/infrastructure/requests/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function DemoConversationPage() {
  const { env } = await getCloudflareContext({ async: true });
  if (!isDevMode(env.DEV)) notFound();
  const conversationURL = await createDevConversation(env.DB, {
    secret: env.PAYLOAD_SECRET,
    siteURL: env.SITE_URL,
    production: false,
    dev: true,
  });
  const url = new URL(conversationURL);
  redirect(`${url.pathname}${url.hash}`);
}
