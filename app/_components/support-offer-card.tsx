import { Button } from "@/components/ui/button";
import type { SupportOffer } from "@/domain/support-offer";

type Props = {
  offer: SupportOffer;
  onRequest: (offer: SupportOffer) => void;
};

export function SupportOfferCard({ offer, onRequest }: Props) {
  const { action } = offer;
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-outline-variant/40 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-primary">
            {offer.title}
          </h3>
          {offer.badge && (
            <span className="rounded-full bg-secondary-container px-2 py-0.5 text-xs font-medium text-on-secondary-container">
              {offer.badge}
            </span>
          )}
        </div>
        <p className="text-[13px] leading-5 text-on-surface-variant">
          {offer.description}
        </p>
        <p className="text-[13px] leading-5 text-on-surface-variant">
          {offer.meta}
        </p>
      </div>
      {action?.kind === "request" && (
        <Button
          onClick={() => onRequest(offer)}
          className="h-11 shrink-0 px-5 text-sm font-semibold"
        >
          {action.label}
        </Button>
      )}
      {action?.kind === "details" && (
        <Button
          type="button"
          className="h-11 shrink-0 bg-surface-container px-5 text-sm font-semibold text-primary hover:bg-surface-container-high"
        >
          {action.label}
        </Button>
      )}
      {action?.kind === "link" && (
        <a
          href="/#"
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-secondary underline-offset-4 hover:underline"
        >
          {action.label}
        </a>
      )}
    </article>
  );
}
