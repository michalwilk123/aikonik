import { betterAuthStrategy } from "@delmaredigital/payload-better-auth";
import type { CollectionConfig, Field } from "payload";
import {
  adminField,
  adminOrSelf,
  assignedStaff,
  isAdmin,
  isStaff,
  ownSettingsField,
} from "@/infrastructure/cms/access";
import {
  readSubmissionChat,
  replySubmissionChat,
  retrySubmissionNotification,
} from "@/infrastructure/cms/chat-endpoints";
import { changeStaffPassword } from "@/infrastructure/cms/password-endpoint";
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
  endpoints: [
    {
      path: "/:id/change-password",
      method: "post",
      handler: changeStaffPassword,
    },
  ],
  hooks: {
    afterChange: [saveStaffPassword],
    beforeDelete: [deleteStaffCredentials],
  },
  access: {
    admin: ({ req }) =>
      Boolean(req.user && ["cms", "admin"].includes(req.user.role)),
    create: isAdmin,
    read: isStaff,
    update: adminOrSelf,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: "name",
    group: "Administracja",
    // StaffNav hides the directory for workers; admin.hidden also blocks their own settings page.
    defaultColumns: ["name", "surname", "email", "role"],
  },
  fields: [
    {
      name: "newPassword",
      label: "Nowe hasło",
      type: "text",
      virtual: true,
      access: { create: adminField, update: adminField, read: adminField },
      minLength: 8,
      maxLength: 128,
      hooks: {
        beforeChange: [prepareStaffPassword],
        afterRead: [() => undefined],
      },
      admin: {
        condition: (_data, _siblingData, { operation }) =>
          operation === "create",
        autoComplete: "new-password",
        description: "Ustaw początkowe hasło konta (od 8 do 128 znaków).",
        components: { Field: "@payloadcms/ui#PasswordField" },
      },
    },
    { name: "name", label: "Imię", type: "text", required: true },
    { name: "surname", label: "Nazwisko", type: "text" },
    {
      name: "emailNotifications",
      label: "Wysyłaj powiadomienia e-mail",
      type: "checkbox",
      defaultValue: false,
      access: { read: ownSettingsField, update: ownSettingsField },
      admin: {
        description:
          "Powiadomienia wymagają podania adresu poniżej. Lokalnie wiadomości nie są wysyłane.",
      },
    },
    {
      name: "notificationEmail",
      label: "Adres e-mail do powiadomień",
      type: "email",
      access: { read: ownSettingsField, update: ownSettingsField },
      admin: {
        description:
          "Pozostaw puste, aby nie otrzymywać wiadomości. Adres logowania nie jest używany jako zastępczy.",
      },
    },
    {
      name: "passwordChange",
      type: "ui",
      admin: {
        components: {
          Field: "@/infrastructure/cms/password-form#StaffPasswordForm",
        },
      },
    },
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
  endpoints: [
    { path: "/:id/chat", method: "get", handler: readSubmissionChat },
    { path: "/:id/chat", method: "post", handler: replySubmissionChat },
    {
      path: "/:id/chat/retry",
      method: "post",
      handler: retrySubmissionNotification,
    },
  ],
  labels: { singular: "Zgłoszenie", plural: "Zgłoszenia" },
  timestamps: false,
  lockDocuments: false,
  disableDuplicate: true,
  defaultSort: "-submittedAt",
  access: {
    create: isAdmin,
    read: assignedStaff,
    update: assignedStaff,
    delete: isAdmin,
  },
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
      access: { create: adminField, update: adminField },
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "internalNotes",
      label: "Notatki wewnętrzne",
      type: "textarea",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "submissionPreview",
      type: "ui",
      admin: {
        condition: () => false,
        components: {
          Field: "@/infrastructure/cms/submission-preview#SubmissionPreview",
        },
      },
    },
    {
      name: "customerChat",
      type: "ui",
      admin: {
        components: {
          Field: "@/infrastructure/cms/submission-chat#SubmissionChat",
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
          admin: {
            position: "sidebar",
            date: { displayFormat: "dd.MM.yyyy HH:mm" },
          },
        },
        {
          name: "source",
          label: "Rodzaj zgłoszenia",
          type: "select",
          required: true,
          admin: { position: "sidebar" },
          options: [
            { label: "Wnioski o grant", value: "grant-application" },
            { label: "Zgłoszenia kontaktowe", value: "contact" },
            { label: "Pomysły mieszkańców", value: "dodaj-pomysl" },
            { label: "Zgłoszenia do testowania", value: "testuj-innowacje" },
          ],
        },
        {
          name: "grantCall",
          label: "Nabór grantowy",
          type: "relationship",
          relationTo: "grant-calls",
          admin: {
            position: "sidebar",
            condition: (data) => data.source === "grant-application",
          },
        },
        {
          name: "callSnapshot",
          label: "Nabór w dniu zgłoszenia",
          type: "json",
          admin: { hidden: true },
        },
        {
          name: "subject",
          label: "Temat",
          type: "text",
          required: true,
          admin: { position: "sidebar" },
        },
        {
          name: "name",
          label: "Imię i nazwisko",
          type: "text",
          required: true,
          admin: { position: "sidebar" },
        },
        {
          name: "email",
          label: "Adres e-mail",
          type: "email",
          required: true,
          admin: { position: "sidebar" },
        },
        {
          name: "message",
          label: "Wiadomość",
          type: "textarea",
          admin: { hidden: true },
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
