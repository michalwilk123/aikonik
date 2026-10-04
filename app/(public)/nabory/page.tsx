import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { callIsActive } from "@/domain/grants";
import { formatSubmissionDate } from "@/infrastructure/cms/workflow";
import { listGrantCalls } from "@/infrastructure/grants/store";

export const metadata: Metadata = {
  title: "Nabory grantowe",
  description: "Przygotuj i złóż wniosek grantowy bez zakładania konta.",
};
export const dynamic = "force-dynamic";

export default async function GrantCallsPage() {
  const { env } = await getCloudflareContext({ async: true });
  const calls = await listGrantCalls(env.DB);
  return (
    <>
      <SiteHeader current="/nabory" />
      <main
        id="tresc"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl px-4 pt-28 pb-16 outline-none sm:px-6"
      >
        <h1 className="text-3xl font-extrabold sm:text-4xl">Nabory grantowe</h1>
        <p className="mt-4 max-w-prose text-lg leading-7 text-on-surface-variant">
          Masz pomysł na innowację społeczną? W trakcie naboru pomożemy
          przygotować wniosek. Wyślesz go bez zakładania konta, a rozmowę z
          zespołem Hubu otworzysz przez link z e-maila.
        </p>
        <div className="mt-8 grid gap-5">
          {calls.length === 0 && (
            <p className="rounded-2xl bg-surface-container p-6">
              Nie ma teraz opublikowanych naborów. Nadal możesz{" "}
              <Link
                className="font-semibold text-primary underline"
                href="/asystent/dodaj-pomysl"
              >
                zgłosić pomysł
              </Link>
              .
            </p>
          )}
          {calls.map((call) => {
            const active = callIsActive(call);
            const upcoming = Date.now() < Date.parse(call.opensAt);
            return (
              <article
                key={call.id}
                className="rounded-2xl border border-outline-variant bg-white p-6 shadow-soft"
              >
                <p className="text-sm font-semibold text-primary">
                  {active
                    ? "Nabór otwarty"
                    : upcoming
                      ? "Nabór planowany"
                      : "Nabór zakończony"}
                </p>
                <h2 className="mt-2 text-2xl font-bold">{call.title}</h2>
                <p className="mt-3 text-sm text-on-surface-variant">
                  Od {formatSubmissionDate(call.opensAt)} do{" "}
                  {formatSubmissionDate(call.closesAt)} (czas polski)
                </p>
                <p className="mt-3 whitespace-pre-wrap leading-7">
                  {call.description}
                </p>
                <Link
                  href={`/nabory/${call.id}`}
                  className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-semibold text-on-primary"
                >
                  {active ? "Przygotuj wniosek" : "Zobacz nabór"}
                </Link>
              </article>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
