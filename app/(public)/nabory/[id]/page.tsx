import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/app/_components/site-header";
import { GrantApplicationForm } from "@/app/(public)/nabory/[id]/application-form";
import { callIsActive } from "@/domain/grants";
import { formatSubmissionDate } from "@/infrastructure/cms/workflow";
import { getGrantCall } from "@/infrastructure/grants/store";

export const metadata: Metadata = { title: "Wniosek grantowy" };
export const dynamic = "force-dynamic";
export default async function GrantApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const { env } = await getCloudflareContext({ async: true });
  const call = await getGrantCall(env.DB, Number(id));
  if (!call?.published) notFound();
  const active = callIsActive(call);
  return (
    <>
      <SiteHeader current="/nabory" />
      <main
        id="tresc"
        tabIndex={-1}
        className="mx-auto w-full max-w-3xl px-4 pt-24 pb-16 outline-none sm:px-6"
      >
        <Link
          href="/nabory"
          className="inline-flex min-h-11 items-center text-primary underline"
        >
          Wszystkie nabory
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold">{call.title}</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          Od {formatSubmissionDate(call.opensAt)} do{" "}
          {formatSubmissionDate(call.closesAt)} (czas polski)
        </p>
        <p className="mt-4 whitespace-pre-wrap leading-7">{call.description}</p>
        {active ? (
          <GrantApplicationForm call={call} />
        ) : (
          <p className="mt-8 rounded-2xl bg-surface-container p-5">
            Ten nabór nie przyjmuje teraz wniosków. Rozmowy dotyczące wysłanych
            zgłoszeń nadal są dostępne przez link z e-maila.
          </p>
        )}
      </main>
    </>
  );
}
