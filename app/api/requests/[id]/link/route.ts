import {
  deliverCustomerNotification,
  ensureCustomerNotification,
  notificationURL,
} from "@/infrastructure/email/request-notifications";
import {
  privateHeaders,
  readWriteBody,
  requestEnvironment,
  requestError,
} from "@/infrastructure/requests/http";
import { hash, rateLimit } from "@/infrastructure/requests/security";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body = await readWriteBody(request);
    const { id } = await params;
    const { db, ctx, config } = requestEnvironment();
    await rateLimit(
      db,
      `recovery-ip:${request.headers.get("cf-connecting-ip") ?? "unknown"}`,
      10,
    );
    await rateLimit(db, `recovery-id:${await hash(id)}`, 5);
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const row = await db
      .prepare("SELECT id FROM submissions WHERE id=? AND lower(trim(email))=?")
      .bind(id, email)
      .first();
    let devConversationURL: string | undefined;
    if (row) {
      const notification = await ensureCustomerNotification(
        db,
        id,
        "recovery",
        config,
      );
      ctx.waitUntil(deliverCustomerNotification(db, notification, config));
      if (config.dev)
        devConversationURL = await notificationURL(
          { ...config, siteURL: new URL(request.url).origin },
          notification,
          id,
        );
    }
    return Response.json(
      {
        message:
          "Jeśli dane odpowiadają zgłoszeniu, wyślemy prywatny link na podany adres e-mail.",
        ...(devConversationURL ? { devConversationURL } : {}),
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    return requestError(error);
  }
}
