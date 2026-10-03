// Builds the Worker with .env* files hidden so local secrets are never
// inlined into the deployable bundle.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, renameSync } from "node:fs";

const envFiles = readdirSync(".").filter(
  (f) => f.startsWith(".env") && !f.endsWith(".example"),
);
const hidden: string[] = [];

try {
  for (const f of envFiles) {
    renameSync(f, `${f}.build-hidden`);
    hidden.push(f);
  }
  const result = spawnSync("bunx", ["opennextjs-cloudflare", "build"], {
    stdio: "inherit",
  });
  process.exitCode = result.status ?? 1;
} finally {
  for (const f of hidden) {
    if (existsSync(`${f}.build-hidden`)) renameSync(`${f}.build-hidden`, f);
  }
}
