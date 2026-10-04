import { ChatConflict } from "@/domain/chat/types";
import {
  privateHeaders,
  readWriteBody,
  requestEnvironment,
  requestError,
} from "@/infrastructure/requests/http";
import { exchangeAccess, rateLimit } from "@/infrastructure/requests/security";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const body = await readWriteBody(request);
    if (typeof body.token !== "string")
      throw new ChatConflict(400, "Nieprawidłowy link.");
    const { id } = await params;
    const { db } = requestEnvironment();
    await rateLimit(
      db,
      `access:${request.headers.get("cf-connecting-ip") ?? "unknown"}`,
      60,
    );
    const session = await exchangeAccess(db, id, body.token);
    return Response.json(
      { success: true },
      {
        headers: {
          ...privateHeaders,
          "Set-Cookie": `request_session=${session}; Path=/api/requests/${encodeURIComponent(id)}; HttpOnly; SameSite=Strict; Max-Age=604800${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`,
        },
      },
    );
  } catch (error) {
    return requestError(error);
  }
}
