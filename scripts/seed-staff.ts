import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashPassword } from "better-auth/crypto";

const password = process.env.STAFF_INITIAL_PASSWORD;
if (!password)
  throw new Error("Set STAFF_INITIAL_PASSWORD before seeding staff.");
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--remote")) {
  throw new Error("Usage: bun run cms:seed [--remote]");
}

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
const staff = [
  { name: "Pracownik CMS", email: "cms@hubmi.invalid", role: "cms" },
  { name: "Administrator", email: "admin@hubmi.invalid", role: "admin" },
];
const statements: string[] = [];
for (const user of staff) {
  const hash = await hashPassword(password);
  // Re-running preserves existing users, permissions and credential hashes.
  statements.push(
    `INSERT INTO users (name, email, email_verified, role)
    VALUES (${quote(user.name)}, ${quote(user.email)}, 1, ${quote(user.role)})
    ON CONFLICT (email) DO NOTHING;`,
    `INSERT INTO accounts (account_id, provider_id, user_id, password)
    SELECT CAST(id AS TEXT), 'credential', id, ${quote(hash)} FROM users
    WHERE email = ${quote(user.email)} AND NOT EXISTS (
      SELECT 1 FROM accounts WHERE accounts.user_id = users.id AND provider_id = 'credential'
    );`,
  );
}

// Wrangler imports the SQL file in a D1 transaction. Keep hashes out of process
// arguments and terminal output, and remove the private file after execution.
const directory = await mkdtemp(join(tmpdir(), "hubmi-staff-"));
try {
  const file = join(directory, "seed.sql");
  await writeFile(file, statements.join("\n"), { mode: 0o600 });
  const result = spawnSync(
    "bunx",
    [
      "wrangler",
      "d1",
      "execute",
      "hubmi",
      args.includes("--remote") ? "--remote" : "--local",
      "--file",
      file,
      "--yes",
    ],
    { stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Staff seed failed (exit ${result.status ?? "unknown"}).`);
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
