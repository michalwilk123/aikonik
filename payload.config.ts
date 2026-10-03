import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sqliteD1Adapter } from "@payloadcms/db-d1-sqlite";
import { pl } from "@payloadcms/translations/languages/pl";
import { buildConfig } from "payload";
import { staffAuthPlugins } from "@/infrastructure/cms/auth";
import { chatCollections } from "@/infrastructure/cms/chat-collections";
import { submissions, users } from "@/infrastructure/cms/collections";

const isCLI = process.argv.some(
  (value) =>
    value.endsWith("payload/bin.js") ||
    value.endsWith("payload/dist/bin/index.js") ||
    value.endsWith("/.bin/payload"),
);
const cloudflare = isCLI
  ? await import(
      /* webpackIgnore: true */ `${"__wrangler".replaceAll("_", "")}`
    ).then((wrangler: typeof import("wrangler")) =>
      wrangler.getPlatformProxy<CloudflareEnv>(),
    )
  : await getCloudflareContext({ async: true });
const secret = cloudflare.env.PAYLOAD_SECRET || process.env.PAYLOAD_SECRET;
const isProductionRuntime =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  !isCLI;
if (isProductionRuntime && !secret) {
  throw new Error("PAYLOAD_SECRET must be configured for production.");
}
const authSecret =
  secret || "local-development-only-payload-secret-change-on-production";
const baseURL =
  process.env.SITE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  (isProductionRuntime
    ? cloudflare.env.SITE_URL
    : `http://localhost:${process.env.PORT || "3000"}`);
if (!baseURL) throw new Error("SITE_URL must be configured for production.");
const workerLogger = {
  options: { level: "info" },
  destination: {
    write(message: string) {
      // biome-ignore lint/suspicious/noConsole: Workers logging must not start a Node transport thread.
      console.log(message.trim());
    },
  },
};

export default buildConfig({
  secret: authSecret,
  routes: { api: "/api/cms" },
  admin: {
    user: "users",
    meta: { titleSuffix: " · AIkonik", icons: { icon: "/icon.svg" } },
    theme: "light",
    components: {
      graphics: {
        Logo: "@/infrastructure/cms/branding#StaffLogo",
        Icon: "@/infrastructure/cms/branding#StaffIcon",
      },
      beforeNavLinks: ["@/infrastructure/cms/branding#StaffLogo"],
    },
    autoLogin: false,
  },
  i18n: { supportedLanguages: { pl }, fallbackLanguage: "pl" },
  collections: [submissions, users, ...chatCollections],
  plugins: staffAuthPlugins(authSecret, baseURL),
  logger: workerLogger,
  db: sqliteD1Adapter({ binding: cloudflare.env.DB, push: false }),
  typescript: { outputFile: "payload-types.ts" },
});
