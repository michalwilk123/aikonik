import { ChatConflict } from "@/domain/chat/types";
import {
  type RequestMessage,
  type RequestNotification,
  type RequestThread,
  requestMessageSchema,
} from "@/domain/requests";
import { emailDeliveryEnabled } from "@/infrastructure/email/idea-notifications";
import {
  deliverCustomerNotification,
  ensureCustomerNotification,
  type RequestNotificationConfig,
} from "@/infrastructure/email/request-notifications";
import { hash, linkToken } from "@/infrastructure/requests/security";

export type StaffIdentity = { id: number; role: "cms" | "admin" };
async function authorizeStaff(
  db: D1Database,
  id: string,
  staff: StaffIdentity,
) {
  if (!staff || !["cms", "admin"].includes(staff.role))
    throw new ChatConflict(403, "Brak dostępu.");
  const row = await db
    .prepare("SELECT assigned_to_id FROM submissions WHERE id=?")
    .bind(id)
    .first<{ assigned_to_id: number | null }>();
  if (!row || (staff.role !== "admin" && row.assigned_to_id !== staff.id))
    throw new ChatConflict(403, "Brak dostępu do tej rozmowy.");
}
type ThreadRow = {
  id: string;
  subject: string;
  submitted_at: string;
  status: string;
  message: string | null;
  artifact: string | null;
};
type MessageRow = {
  id: string;
  author: "customer" | "staff";
  body: string;
  created_at: string;
  internal: number;
  author_name: string;
};
async function readThread(db: D1Database, id: string, staff?: StaffIdentity) {
  if (staff && !["cms", "admin"].includes(staff.role))
    throw new ChatConflict(403, "Brak dostępu.");
  const access = staff ? "AND (?='admin' OR s.assigned_to_id=?)" : "";
  const bindings = staff ? [id, staff.role, staff.id] : [id];
  const statements = [
    db
      .prepare(
        `SELECT s.id,s.subject,s.submitted_at,s.status,s.message,s.artifact FROM submissions s WHERE s.id=? ${access}`,
      )
      .bind(...bindings),
    db
      .prepare(
        `SELECT m.id,m.author,m.body,m.created_at,m.internal, CASE WHEN m.author='customer' THEN s.name ELSE COALESCE(NULLIF(trim(u.name || ' ' || COALESCE(u.surname,'')),''),'Zespół Hubu') END AS author_name FROM request_messages m JOIN submissions s ON s.id=m.submission_id LEFT JOIN users u ON u.id=m.staff_id WHERE m.submission_id=? ${access} ${staff ? "" : "AND m.internal=0"} ORDER BY m.rowid`,
      )
      .bind(...bindings),
  ];
  if (staff)
    statements.push(
      db
        .prepare(
          `SELECT n.id,n.message_id AS messageId,n.kind,n.status,n.created_at AS createdAt,n.sent_at AS sentAt,n.attempts,n.last_error AS lastError FROM request_notifications n JOIN submissions s ON s.id=n.submission_id WHERE n.submission_id=? ${access} ORDER BY n.rowid DESC`,
        )
        .bind(...bindings),
    );
  // D1 executes this batch transactionally: assignment, transcript, and delivery
  // records share one authorization snapshot even if an admin reassigns the chat.
  const results = await db.batch(statements);
  const row = results[0].results[0] as ThreadRow | undefined;
  if (!row)
    throw new ChatConflict(
      staff ? 403 : 404,
      staff ? "Brak dostępu do tej rozmowy." : "Nie znaleziono zgłoszenia.",
    );
  const messages = results[1].results as MessageRow[];
  const thread: RequestThread = {
    id: row.id,
    subject: row.subject,
    submittedAt: row.submitted_at,
    status: row.status,
    message: row.message,
    artifact: row.artifact ? JSON.parse(row.artifact) : null,
    messages: messages.map((m) => ({
      id: m.id,
      author: m.author,
      body: m.body,
      createdAt: m.created_at,
      authorName: m.author_name,
      ...(staff ? { internal: Boolean(m.internal) } : {}),
    })),
  };
  return {
    ...thread,
    notifications: (results[2]?.results ?? []) as RequestNotification[],
  };
}
export async function getThread(
  db: D1Database,
  id: string,
): Promise<RequestThread> {
  const { notifications: _notifications, ...thread } = await readThread(db, id);
  return thread;
}
export async function getStaffThread(
  db: D1Database,
  id: string,
  staff: StaffIdentity,
) {
  if (!staff) throw new ChatConflict(403, "Brak dostępu.");
  return readThread(db, id, staff);
}
async function append(
  db: D1Database,
  id: string,
  input: { id: string; body: string },
  author: RequestMessage["author"],
  staff?: StaffIdentity,
  internal = false,
  config?: RequestNotificationConfig,
) {
  const parsed = requestMessageSchema.parse({ id: input.id, body: input.body });
  const now = new Date().toISOString();
  const statements = [
    db
      .prepare(
        "INSERT INTO request_messages(id,submission_id,author,staff_id,body,internal,created_at) SELECT ?,id,?,?,?,?,? FROM submissions WHERE id=? AND (?='customer' OR ?='admin' OR assigned_to_id=?) ON CONFLICT DO NOTHING",
      )
      .bind(
        parsed.id,
        author,
        staff?.id ?? null,
        parsed.body,
        Number(internal),
        now,
        id,
        author,
        staff?.role ?? null,
        staff?.id ?? null,
      ),
  ];
  if (config && author === "staff" && !internal) {
    const notificationId = `reply:${parsed.id}`;
    statements.push(
      db
        .prepare(
          "INSERT INTO request_notifications(id,submission_id,message_id,kind,status,token_hash,expires_at,created_at) SELECT ?,submission_id,id,'reply',?,?,?,? FROM request_messages WHERE id=? AND submission_id=? AND body=? AND author='staff' AND staff_id=? AND internal=0 ON CONFLICT DO NOTHING",
        )
        .bind(
          notificationId,
          emailDeliveryEnabled(config) ? "pending" : "disabled",
          await hash(await linkToken(config.secret, notificationId)),
          new Date(Date.now() + 7 * 86400000).toISOString(),
          now,
          parsed.id,
          id,
          parsed.body,
          staff?.id ?? null,
        ),
    );
  }
  await db.batch(statements);
  const saved = await db
    .prepare(
      "SELECT submission_id,body,author,staff_id,internal FROM request_messages WHERE id=?",
    )
    .bind(parsed.id)
    .first<{
      submission_id: string;
      body: string;
      author: string;
      staff_id: number | null;
      internal: number;
    }>();
  if (!saved) throw new ChatConflict(403, "Brak dostępu do rozmowy.");
  if (
    saved.submission_id !== id ||
    saved.body !== parsed.body ||
    saved.author !== author ||
    saved.staff_id !== (staff?.id ?? null) ||
    Boolean(saved.internal) !== internal
  )
    throw new ChatConflict(
      409,
      "Wiadomość została już zapisana z inną treścią.",
    );
}
export async function postCustomerReply(
  db: D1Database,
  id: string,
  input: { id: string; body: string },
) {
  await append(db, id, input, "customer");
  return getThread(db, id);
}
export async function postStaffReply(
  db: D1Database,
  id: string,
  input: { id: string; body: string; internal?: boolean },
  staff: StaffIdentity,
  config: RequestNotificationConfig,
) {
  await authorizeStaff(db, id, staff);
  await append(db, id, input, "staff", staff, input.internal === true, config);
  if (!input.internal) {
    const notification = await ensureCustomerNotification(
      db,
      id,
      "reply",
      config,
      input.id,
    );
    await deliverCustomerNotification(db, notification, config);
  }
  return getStaffThread(db, id, staff);
}
export async function retryCustomerNotification(
  db: D1Database,
  id: string,
  notificationId: string,
  staff: StaffIdentity,
  config: RequestNotificationConfig,
) {
  await authorizeStaff(db, id, staff);
  const row = await db
    .prepare(
      "SELECT id,expires_at,consumed_at FROM request_notifications WHERE id=? AND submission_id=?",
    )
    .bind(notificationId, id)
    .first<{ id: string; expires_at: string; consumed_at: string | null }>();
  if (!row) throw new ChatConflict(404, "Nie znaleziono powiadomienia.");
  if (row.consumed_at || row.expires_at <= new Date().toISOString())
    throw new ChatConflict(
      409,
      "Link został użyty lub wygasł. Klient może poprosić o nowy link.",
    );
  await deliverCustomerNotification(db, row.id, config);
  return getStaffThread(db, id, staff);
}

export async function createDevConversation(
  db: D1Database,
  config: RequestNotificationConfig,
) {
  if (!config.dev || process.env.NODE_ENV !== "development")
    throw new ChatConflict(404, "Nie znaleziono strony.");
  const id = crypto.randomUUID();
  const submittedAt = new Date(Date.now() - 3600000).toISOString();
  const artifact = {
    title: "Sąsiedzka pomoc seniorom",
    fields: [
      {
        label: "Opis pomysłu",
        value:
          "Chcę stworzyć sieć sąsiadów, którzy pomogą seniorom w zakupach i drobnych sprawach.",
      },
      {
        label: "Problem",
        value:
          "Osoby starsze mieszkające samotnie często nie mają kogo poprosić o codzienną pomoc.",
      },
      {
        label: "Odbiorcy",
        value: "Seniorzy mieszkający na osiedlu w Krakowie.",
      },
      {
        label: "Rozwiązanie",
        value:
          "Dyżury pięciu wolontariuszy i telefon, pod którym można zgłosić potrzebę pomocy.",
      },
      {
        label: "Cel",
        value:
          "Pomóc dziesięciu seniorom i sprawdzić, czy taki sposób wsparcia odpowiada ich potrzebom.",
      },
    ],
  };
  await db
    .prepare(
      "INSERT INTO submissions(id,submitted_at,source,name,email,subject,artifact,fingerprint) VALUES(?,?,'dodaj-pomysl','Jan Nowak','demo@example.invalid',?,?,'dev-demo')",
    )
    .bind(id, submittedAt, artifact.title, JSON.stringify(artifact))
    .run();
  await db
    .prepare(
      "INSERT INTO users(name,surname,email,role) VALUES('Anna','Kowalska','chat-demo-worker@hubmi.invalid','cms') ON CONFLICT(email) DO NOTHING",
    )
    .run();
  const demoStaff = await db
    .prepare(
      "SELECT id FROM users WHERE email='chat-demo-worker@hubmi.invalid'",
    )
    .first<{ id: number }>();
  if (demoStaff) {
    await db.batch([
      db
        .prepare("UPDATE submissions SET assigned_to_id=? WHERE id=?")
        .bind(demoStaff.id, id),
      db
        .prepare(
          "INSERT INTO request_messages(id,submission_id,author,staff_id,body,created_at) VALUES(?,?,'staff',?,'Dzień dobry, Panie Janie. Przeczytałam zgłoszenie dotyczące sąsiedzkiej pomocy seniorom. Na początek proponuję ustalić jedną osobę koordynującą dyżury wolontariuszy. Czy może Pan pełnić tę rolę? Chętnie pomogę przygotować pierwszy test z grupą dziesięciu seniorów.',?)",
        )
        .bind(crypto.randomUUID(), id, demoStaff.id, new Date().toISOString()),
    ]);
  }
  const notification = await ensureCustomerNotification(
    db,
    id,
    "receipt",
    config,
  );
  const { notificationURL } = await import(
    "@/infrastructure/email/request-notifications"
  );
  return notificationURL(config, notification, id);
}
