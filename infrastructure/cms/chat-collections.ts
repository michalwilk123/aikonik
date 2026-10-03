import type { CollectionConfig, Field } from "payload";
import { isAdmin } from "@/infrastructure/cms/access";

// Field names become snake_case SQL columns in Payload's SQLite adapter.
// These collections share the existing chat tables; they add no timestamps,
// relationships, document locks or version tables to that schema.
const id: Field = {
  name: "id",
  type: "text",
  required: true,
  defaultValue: () => crypto.randomUUID(),
};

function collection(
  slug: string,
  dbName: string,
  label: string,
  fields: Field[],
  defaultColumns: string[],
): CollectionConfig {
  return {
    slug,
    dbName,
    labels: { singular: label, plural: label },
    timestamps: false,
    lockDocuments: false,
    disableDuplicate: true,
    access: {
      create: isAdmin,
      read: isAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
    admin: {
      group: "Dane aplikacji",
      useAsTitle: "id",
      defaultColumns,
      hidden: ({ user }) => user?.role !== "admin",
    },
    fields: [id, ...fields],
  };
}

export const chatCollections: CollectionConfig[] = [
  collection(
    "conversations",
    "conversations",
    "Rozmowy",
    [
      {
        name: "agentId",
        type: "text",
        required: true,
        defaultValue: "support",
      },
      { name: "capabilityHash", type: "text", required: true },
      { name: "createdAt", type: "number", required: true },
      { name: "browser", type: "json", required: true },
    ],
    ["id", "agentId", "createdAt"],
  ),
  collection(
    "prompt-versions",
    "prompt_versions",
    "Wersje instrukcji",
    [
      { name: "instructions", type: "textarea", required: true },
      { name: "createdAt", type: "number", required: true },
    ],
    ["id", "createdAt"],
  ),
  collection(
    "turns",
    "turns",
    "Tury rozmów",
    [
      { name: "conversationId", type: "text", required: true },
      { name: "ordinal", type: "number", required: true },
      {
        name: "status",
        type: "select",
        required: true,
        options: ["running", "complete", "error", "interrupted"],
      },
      { name: "startedAt", type: "number", required: true },
      { name: "finishedAt", type: "number" },
      { name: "firstTextMs", type: "number" },
      { name: "durationMs", type: "number" },
      { name: "errorCode", type: "text" },
      { name: "errorType", type: "text" },
      { name: "errorStatus", type: "number" },
      { name: "promptVersion", type: "text", required: true },
    ],
    ["id", "conversationId", "ordinal", "status", "startedAt"],
  ),
  collection(
    "messages",
    "messages",
    "Wiadomości",
    [
      { name: "conversationId", type: "text", required: true },
      { name: "turnId", type: "text", required: true },
      { name: "sequence", type: "number", required: true },
      {
        name: "role",
        type: "select",
        required: true,
        options: ["user", "assistant"],
      },
      { name: "content", type: "textarea", required: true },
      { name: "answer", type: "json" },
      { name: "status", type: "text", required: true },
    ],
    ["id", "conversationId", "role", "status"],
  ),
  collection(
    "model-calls",
    "model_calls",
    "Wywołania modeli",
    [
      { name: "turnId", type: "text", required: true },
      { name: "step", type: "number", required: true },
      { name: "model", type: "text", required: true },
      { name: "provider", type: "text" },
      { name: "firstTokenMs", type: "number" },
      { name: "inputTokens", type: "number" },
      { name: "outputTokens", type: "number" },
      { name: "durationMs", type: "number", required: true },
      { name: "finishReason", type: "text", required: true },
      { name: "contextIds", type: "json", required: true },
    ],
    ["id", "turnId", "model", "durationMs", "finishReason"],
  ),
  collection(
    "tool-calls",
    "tool_calls",
    "Wywołania narzędzi",
    [
      { name: "turnId", type: "text", required: true },
      { name: "name", type: "text", required: true },
      { name: "durationMs", type: "number" },
      {
        name: "status",
        type: "text",
        required: true,
        defaultValue: "complete",
      },
      { name: "input", type: "json", required: true },
      { name: "output", type: "json" },
    ],
    ["id", "turnId", "name", "status"],
  ),
];
