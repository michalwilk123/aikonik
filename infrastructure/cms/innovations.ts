import type { CollectionConfig, Field } from "payload";
import catalog from "@/data/rops/catalog.json";
import { isStaff } from "@/infrastructure/cms/access";

const immutable = () => false;
const validURL = (value: unknown) => {
  if (typeof value !== "string") return "Podaj adres URL.";
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) ||
      "Użyj adresu HTTP lub HTTPS."
    );
  } catch {
    return "Podaj prawidłowy adres URL.";
  }
};

const links = (name: string, label: string): Field => ({
  name,
  label,
  type: "array",
  fields: [
    {
      name: "url",
      label: "Adres URL",
      type: "text",
      required: true,
      validate: validURL,
    },
  ],
});

export const innovations: CollectionConfig = {
  slug: "innovations",
  labels: { singular: "Innowacja społeczna", plural: "Innowacje społeczne" },
  lockDocuments: false,
  disableDuplicate: true,
  defaultSort: "title",
  access: {
    create: immutable,
    read: isStaff,
    update: isStaff,
    delete: immutable,
  },
  admin: {
    group: "Biblioteka wiedzy",
    useAsTitle: "title",
    defaultColumns: ["title", "categories", "updatedAt"],
    description:
      "Wspólna biblioteka dla wszystkich pracowników i administratorów. Zapisane zmiany są używane przez asystentów.",
  },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
      access: { update: immutable },
      admin: { hidden: true },
    },
    { name: "title", label: "Nazwa innowacji", type: "text", required: true },
    {
      name: "categories",
      label: "Kategorie",
      type: "select",
      hasMany: true,
      required: true,
      options: catalog.categories.map(({ title }) => ({
        label: title,
        value: title,
      })),
    },
    {
      name: "description",
      label: "Opis innowacji",
      type: "textarea",
      required: true,
      admin: {
        description:
          "Rozwiązanie, problem społeczny, odbiorcy, zastosowanie, wyniki testowania i autorzy.",
      },
    },
    {
      name: "url",
      label: "Strona źródłowa ROPS",
      type: "text",
      required: true,
      validate: validURL,
    },
    links("videos", "Filmy"),
    links("materials", "Materiały dodatkowe"),
    links("licenses", "Licencje"),
    {
      name: "pdfs",
      label: "Dokumentacja PDF (oryginalne źródło)",
      type: "json",
      access: { update: immutable },
      admin: { readOnly: true, hidden: true },
    },
  ],
};
