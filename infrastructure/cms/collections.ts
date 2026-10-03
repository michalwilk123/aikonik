import { betterAuthStrategy } from "@delmaredigital/payload-better-auth";
import type { CollectionConfig, Field } from "payload";
import { adminField, isAdmin, isStaff } from "@/infrastructure/cms/access";
import {
  deleteStaffCredentials,
  prepareStaffPassword,
  saveStaffPassword,
} from "@/infrastructure/cms/user-hooks";
import { submissionStatuses } from "@/infrastructure/cms/workflow";

export const users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Użytkownik", plural: "Użytkownicy" },
  auth: {
    disableLocalStrategy: true,
    strategies: [betterAuthStrategy()],
  },
  lockDocuments: false,
  hooks: {
    afterChange: [saveStaffPassword],
    beforeDelete: [deleteStaffCredentials],
  },
  access: {
    admin: ({ req }) =>
      Boolean(req.user && ["cms", "admin"].includes(req.user.role)),
    create: isAdmin,
    read: isStaff,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: "name",
    group: "Administracja",
    hidden: ({ user }) => user?.role !== "admin",
    defaultColumns: ["name", "email", "role"],
  },
  fields: [
    {
      name: "newPassword",
      label: "Nowe hasło",
      type: "text",
      virtual: true,
      access: { create: adminField, update: adminField, read: adminField },
      minLength: 8,
      hooks: {
        beforeChange: [prepareStaffPassword],
        afterRead: [() => undefined],
      },
      admin: {
        autoComplete: "new-password",
        description:
          "Wpisz hasło przy tworzeniu konta lub aby zmienić hasło użytkownika. Zmiana wyloguje jego aktywne sesje.",
        components: { Field: "@payloadcms/ui#PasswordField" },
      },
    },
    { name: "name", label: "Nazwa", type: "text", required: true },
    {
      name: "role",
      label: "Uprawnienia",
      type: "select",
      required: true,
      defaultValue: "cms",
      saveToJWT: true,
      access: { create: adminField, update: adminField },
      options: [
        { label: "Obsługa zgłoszeń", value: "cms" },
        { label: "Administrator", value: "admin" },
      ],
    },
  ],
};

export const submissions: CollectionConfig = {
  slug: "submissions",
  labels: { singular: "Zgłoszenie", plural: "Zgłoszenia" },
  timestamps: false,
  lockDocuments: false,
  disableDuplicate: true,
  defaultSort: "-submittedAt",
  access: { create: isAdmin, read: isStaff, update: isStaff, delete: isAdmin },
  admin: {
    useAsTitle: "subject",
    defaultColumns: [
      "subject",
      "source",
      "status",
      "assignedTo",
      "name",
      "submittedAt",
    ],
    description:
      "Kontakt, pomysły mieszkańców i zgłoszenia do testowania. Filtruj według rodzaju, statusu i osoby prowadzącej.",
    pagination: { defaultLimit: 25, limits: [25, 50, 100] },
  },
  fields: [
    {
      name: "status",
      label: "Status sprawy",
      type: "select",
      required: true,
      defaultValue: "new",
      options: submissionStatuses,
      admin: { position: "sidebar" },
    },
    {
      name: "assignedTo",
      label: "Osoba prowadząca",
      type: "relationship",
      relationTo: "users",
      filterOptions: { role: { in: ["cms", "admin"] } },
      admin: {
        position: "sidebar",
        description: "Wybierz pracownika zajmującego się sprawą.",
      },
    },
    {
      name: "internalNotes",
      label: "Notatki wewnętrzne",
      type: "textarea",
      admin: {
        position: "sidebar",
        description: "Ustalenia zespołu. Niewidoczne dla zgłaszającego.",
      },
    },
    {
      name: "submissionPreview",
      type: "ui",
      admin: {
        components: {
          Field: "@/infrastructure/cms/submission-preview#SubmissionPreview",
        },
      },
    },
    ...(
      [
        {
          name: "id",
          type: "text",
          defaultValue: () => crypto.randomUUID(),
          required: true,
          admin: { hidden: true },
        },
        {
          name: "submittedAt",
          label: "Data zgłoszenia",
          type: "date",
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: { date: { displayFormat: "dd.MM.yyyy HH:mm" } },
        },
        {
          name: "source",
          label: "Rodzaj zgłoszenia",
          type: "select",
          required: true,
          options: [
            { label: "Zgłoszenia kontaktowe", value: "contact" },
            { label: "Pomysły mieszkańców", value: "dodaj-pomysl" },
            { label: "Zgłoszenia do testowania", value: "testuj-innowacje" },
          ],
        },
        { name: "subject", label: "Temat", type: "text", required: true },
        {
          name: "name",
          label: "Imię i nazwisko",
          type: "text",
          required: true,
        },
        { name: "email", label: "Adres e-mail", type: "email", required: true },
        {
          name: "message",
          label: "Wiadomość",
          type: "textarea",
          admin: { condition: (data) => data.source === "contact" },
        },
        {
          name: "details",
          label: "Treść zgłoszenia",
          type: "textarea",
          admin: { hidden: true },
        },
        {
          name: "artifact",
          type: "json",
          admin: { hidden: true },
          access: {
            read: ({ req }) =>
              Boolean(req.user && ["cms", "admin"].includes(req.user.role)),
          },
        },
        {
          name: "conversationId",
          type: "text",
          admin: { hidden: true },
          access: { read: adminField },
        },
        {
          name: "sourceTurnId",
          type: "text",
          unique: true,
          admin: { hidden: true },
          access: { read: adminField },
        },
        {
          name: "fingerprint",
          type: "text",
          admin: { hidden: true },
          access: { read: adminField },
        },
      ] satisfies Field[]
    ).map(
      (field): Field => ({
        ...field,
        access: {
          ...("access" in field ? field.access : {}),
          update: adminField,
        },
        admin: { ...field.admin, readOnly: true },
      }),
    ),
  ],
};
