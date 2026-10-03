type SupportOfferAction =
  | { kind: "request"; label: string }
  | { kind: "details"; label: string }
  | { kind: "link"; label: string };

export type SupportOffer = {
  id: string;
  title: string;
  description: string;
  meta: string;
  badge?: string;
  action: SupportOfferAction;
};

export type SupportAnswer = {
  areaLabel: string;
  offers: SupportOffer[];
};
