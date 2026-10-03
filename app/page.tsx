import { Chat } from "./_components/chat";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 pt-20 pb-64">
        <Chat />
      </main>
      <SiteFooter />
    </>
  );
}
