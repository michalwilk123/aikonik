import type { CollectionConfig } from "payload";
import { grantQuestionsSchema } from "@/domain/grants";
import { isAdmin, isStaff } from "@/infrastructure/cms/access";

export const grantCalls: CollectionConfig = {
  slug: "grant-calls",
  labels: { singular: "Nabór grantowy", plural: "Nabory grantowe" },
  lockDocuments: false,
  access: {
    create: isAdmin,
    read: isStaff,
    update: isAdmin,
    delete: () => false,
  },
  admin: {
    group: "Administracja",
    useAsTitle: "title",
    defaultColumns: ["title", "published", "opensAt", "closesAt"],
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        const merged = { ...originalDoc, ...data };
        if (!(Date.parse(merged.opensAt) < Date.parse(merged.closesAt)))
          throw new Error("Koniec naboru musi przypadać po jego otwarciu.");
        return data;
      },
    ],
  },
  fields: [
    {
      name: "title",
      label: "Nazwa naboru",
      type: "text",
      required: true,
      maxLength: 200,
    },
    {
      name: "description",
      label: "Opis, warunki i zasady naboru",
      type: "textarea",
      required: true,
      maxLength: 12000,
    },
    {
      name: "opensAt",
      label: "Otwarcie naboru",
      type: "date",
      required: true,
      admin: { date: { pickerAppearance: "dayAndTime" } },
    },
    {
      name: "closesAt",
      label: "Zamknięcie naboru",
      type: "date",
      required: true,
      admin: { date: { pickerAppearance: "dayAndTime" } },
    },
    {
      name: "published",
      label: "Opublikowany",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "Generator przyjmuje wnioski od otwarcia do zamknięcia opublikowanego naboru.",
      },
    },
    {
      name: "questions",
      label: "Pytania we wniosku",
      type: "json",
      required: true,
      validate: (value) =>
        grantQuestionsSchema.safeParse(value).success ||
        "Dodaj 1–24 pytania z unikalnymi identyfikatorami i limitem 50–2000 znaków.",
      admin: {
        components: {
          Field: "@/infrastructure/cms/grant-questions#GrantQuestions",
        },
      },
    },
  ],
};
