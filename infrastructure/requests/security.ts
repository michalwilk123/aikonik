import { ChatConflict } from "@/domain/chat/types";

export async function hash(value: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
export async function linkToken(secret: string, id: string) {
  if (!secret) throw new Error("Missing request token signing secret");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`request-link/${id}`),
    ),
  );
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
export function guardWrite(request: Request) {
  const origin = request.headers.get("origin");
  if (
    origin !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new ChatConflict(403, "Niedozwolone źródło żądania.");
}
export async function rateLimit(
  db: D1Database,
  key: string,
  limit: number,
  seconds = 3600,
) {
  const window = Math.floor(Date.now() / 1000 / seconds);
  const row = await db
    .prepare(
      "INSERT INTO request_rate_limits(key,window,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET window=excluded.window,count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END RETURNING count",
    )
    .bind(key, window)
    .first<{ count: number }>();
  if (!row || row.count > limit)
    throw new ChatConflict(429, "Za dużo prób. Spróbuj ponownie później.");
}
export async function exchangeAccess(
  db: D1Database,
  id: string,
  token: string,
) {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new ChatConflict(403, "Link wygasł lub został już użyty.");
  const session = crypto.randomUUID() + crypto.randomUUID();
  const expires = new Date(Date.now() + 7 * 86400000).toISOString();
  const now = new Date().toISOString();
  const results = await db.batch([
    db
      .prepare(
        "INSERT INTO request_sessions(token_hash,submission_id,expires_at) SELECT ?,submission_id,? FROM request_notifications WHERE submission_id=? AND token_hash=? AND consumed_at IS NULL AND expires_at>?",
      )
      .bind(await hash(session), expires, id, await hash(token), now),
    db
      .prepare(
        "UPDATE request_notifications SET consumed_at=? WHERE submission_id=? AND token_hash=? AND consumed_at IS NULL AND expires_at>?",
      )
      .bind(now, id, await hash(token), now),
  ]);
  if (!results[0].meta.changes)
    throw new ChatConflict(403, "Link wygasł lub został już użyty.");
  return session;
}
export async function authorizeCustomer(
  db: D1Database,
  request: Request,
  id: string,
) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith("request_session="))
    ?.slice("request_session=".length);
  if (
    !cookie ||
    !(await db
      .prepare(
        "SELECT 1 FROM request_sessions WHERE submission_id=? AND token_hash=? AND expires_at>?",
      )
      .bind(id, await hash(cookie), new Date().toISOString())
      .first())
  )
    throw new ChatConflict(403, "Otwórz prywatny link z wiadomości e-mail.");
}
