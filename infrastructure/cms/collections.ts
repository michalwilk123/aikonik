import { betterAuthStrategy } from "@delmaredigital/payload-better-auth";
import type { CollectionConfig } from "payload";
import { adminField, isAdmin, isStaff } from "@/infrastructure/cms/access";
import {
  deleteStaffCredentials,
  prepareStaffPassword,
  saveStaffPassword,
} from "@/infrastructure/cms/user-hooks";

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
    read: ({ req }) =>
      req.user?.role === "admin" ||
      (req.user ? { id: { equals: req.user.id } } : false),
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
        { label: "Odczyt zgłoszeń", value: "cms" },
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
  access: { create: isAdmin, read: isStaff, update: isAdmin, delete: isAdmin },
  admin: {
    useAsTitle: "subject",
    defaultColumns: ["submittedAt", "source", "subject", "name", "email"],
    description:
      "Wiadomości z kontaktu, zgłoszone pomysły i deklaracje testowania innowacji. Wybierz zgłoszenie, aby przeczytać jego treść.",
    pagination: { defaultLimit: 25, limits: [25, 50, 100] },
  },
  fields: [
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
        { label: "Kontakt", value: "contact" },
        { label: "Dodaj pomysł", value: "dodaj-pomysl" },
        { label: "Testuj innowacje", value: "testuj-innowacje" },
      ],
    },
    { name: "subject", label: "Temat", type: "text", required: true },
    { name: "name", label: "Imię i nazwisko", type: "text", required: true },
    { name: "email", label: "Adres e-mail", type: "email", required: true },
    { name: "message", label: "Wiadomość", type: "textarea" },
    { name: "details", label: "Treść zgłoszenia", type: "textarea" },
    {
      name: "artifact",
      type: "json",
      admin: { hidden: true },
      access: { read: adminField },
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
  ],
};
