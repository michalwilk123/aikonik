import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["jose", "pg-cloudflare"],
};

initOpenNextCloudflareForDev();

const config = withPayload(nextConfig, { devBundleServerPackages: false });

// Payload's D1 adapter references migration tooling even with push: false.
// Keep it out of the Worker; database migrations run through the local CLI.
if (process.env.NODE_ENV === "production") {
  config.serverExternalPackages = config.serverExternalPackages?.filter(
    (name) => name !== "drizzle-kit" && name !== "drizzle-kit/api",
  );
  config.turbopack = {
    ...config.turbopack,
    resolveAlias: {
      ...config.turbopack?.resolveAlias,
      "drizzle-kit/api": "./infrastructure/cms/drizzle-kit-runtime.ts",
    },
  };
}

export default config;
