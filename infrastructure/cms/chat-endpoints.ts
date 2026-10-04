import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { PayloadHandler, PayloadRequest } from "payload";
import { z } from "zod";
import {
  getStaffThread,
  postStaffReply,
  retryCustomerNotification,
} from "@/infrastructure/requests/service";

const replyInput = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(1).max(10000),
  internal: z.boolean().optional(),
});
const retryInput = z.object({ notificationId: z.string().min(1).max(200) });
const headers = { "Cache-Control": "no-store" };

async function authorize(req: PayloadRequest, mutation = false) {
  if (!req.user || !["cms", "admin"].includes(req.user.role))
    return Response.json(
      { error: "Zaloguj się ponownie." },
      { status: 401, headers },
    );
  const id = String(req.routeParams?.id ?? "");
  if (!id)
    return Response.json(
      { error: "Brak zgłoszenia." },
      { status: 400, headers },
    );
  const origin = req.headers.get("origin");
  if (mutation && origin && (!req.url || new URL(req.url).origin !== origin))
    return Response.json(
      { error: "Niedozwolone źródło żądania." },
      { status: 403, headers },
    );
  try {
    await req.payload.findByID({
      collection: "submissions",
      id,
      depth: 0,
      req,
      overrideAccess: false,
    });
  } catch {
    return Response.json(
      { error: "Nie znaleziono rozmowy lub brak uprawnień." },
      { status: 404, headers },
    );
  }
  return {
    id,
    staff: { id: req.user.id, role: req.user.role as "cms" | "admin" },
  };
}

function runtime(req: PayloadRequest) {
  const { env } = getCloudflareContext();
  return {
    db: env.DB,
    config: {
      apiKey: env.RESEND_API_KEY,
      from: env.RESEND_FROM_EMAIL,
      siteURL:
        env.SITE_URL || new URL(req.url || "http://localhost:3000").origin,
      production: process.env.NODE_ENV === "production",
      secret: req.payload.config.secret,
      dev: process.env.NODE_ENV !== "production",
    },
  };
}

async function result(run: () => Promise<unknown>) {
  try {
    return Response.json(await run(), { headers });
  } catch (error) {
    const status =
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;
    return Response.json(
      {
        error:
          status < 500 && error instanceof Error
            ? error.message
            : "Nie udało się obsłużyć rozmowy. Spróbuj ponownie.",
      },
      { status, headers },
    );
  }
}

export const readSubmissionChat: PayloadHandler = async (req) => {
  const access = await authorize(req);
  if (access instanceof Response) return access;
  return result(async () => {
    const { db } = runtime(req);
    return getStaffThread(db, access.id, access.staff);
  });
};

export const replySubmissionChat: PayloadHandler = async (req) => {
  const access = await authorize(req, true);
  if (access instanceof Response) return access;
  const parsed = replyInput.safeParse(await req.json?.().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "Wpisz wiadomość (maksymalnie 10 000 znaków)." },
      { status: 400, headers },
    );
  return result(async () => {
    const { db, config } = runtime(req);
    return postStaffReply(db, access.id, parsed.data, access.staff, config);
  });
};

export const retrySubmissionNotification: PayloadHandler = async (req) => {
  const access = await authorize(req, true);
  if (access instanceof Response) return access;
  const parsed = retryInput.safeParse(await req.json?.().catch(() => null));
  if (!parsed.success)
    return Response.json(
      { error: "Nieprawidłowe powiadomienie." },
      { status: 400, headers },
    );
  return result(async () => {
    const { db, config } = runtime(req);
    await retryCustomerNotification(
      db,
      access.id,
      parsed.data.notificationId,
      access.staff,
      config,
    );
    return getStaffThread(db, access.id, access.staff);
  });
};
