import { type GrantCall, grantQuestionsSchema } from "@/domain/grants";

type CallRow = {
  id: number;
  title: string;
  description: string;
  opens_at: string;
  closes_at: string;
  published: number;
  questions: string;
  updated_at: string;
};
function decode(row: CallRow): GrantCall {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    published: Boolean(row.published),
    questions: grantQuestionsSchema.parse(JSON.parse(row.questions)),
    updatedAt: row.updated_at,
  };
}
export async function listGrantCalls(db: D1Database) {
  const rows = await db
    .prepare(
      "SELECT * FROM grant_calls WHERE published = 1 ORDER BY closes_at DESC",
    )
    .all<CallRow>();
  return rows.results.map(decode);
}
export async function getGrantCall(db: D1Database, id: number) {
  const row = await db
    .prepare("SELECT * FROM grant_calls WHERE id = ?")
    .bind(id)
    .first<CallRow>();
  return row ? decode(row) : null;
}
