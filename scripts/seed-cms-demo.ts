import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { demoStatements } from "@/scripts/cms-demo-data";

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--remote")) {
  throw new Error("Usage: bun run cms:seed:demo [--remote]");
}
const target = args.includes("--remote") ? "--remote" : "--local";
const check = spawnSync(
  "bunx",
  [
    "wrangler",
    "d1",
    "execute",
    "hubmi",
    target,
    "--command",
    "SELECT id FROM users WHERE email='cms@hubmi.invalid' AND role='cms'",
    "--json",
  ],
  { encoding: "utf8" },
);
if (check.error) throw check.error;
if (check.status !== 0) throw new Error(check.stderr || check.stdout);
const result = JSON.parse(check.stdout) as { results: { id: number }[] }[];
if (!result[0]?.results.length)
  throw new Error(
    "The existing CMS user cms@hubmi.invalid was not found. Seed staff first.",
  );

const directory = await mkdtemp(join(tmpdir(), "hubmi-cms-demo-"));
try {
  const file = join(directory, "seed.sql");
  await writeFile(file, demoStatements().join("\n"), { mode: 0o600 });
  const imported = spawnSync(
    "bunx",
    ["wrangler", "d1", "execute", "hubmi", target, "--file", file, "--yes"],
    { stdio: "inherit" },
  );
  if (imported.error) throw imported.error;
  if (imported.status !== 0)
    throw new Error(`CMS demo seed failed (exit ${imported.status}).`);
} finally {
  await rm(directory, { recursive: true, force: true });
}
