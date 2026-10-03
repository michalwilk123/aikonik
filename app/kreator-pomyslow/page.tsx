import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { IdeaCreatorChat } from "./_components/idea-creator-chat";

export default function IdeaCreatorPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 pt-24 pb-16">
        <IdeaCreatorChat />
      </main>
      <SiteFooter />
    </>
  );
}
