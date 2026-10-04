import { ChatConflict } from "@/domain/chat/types";
import { requestMessageSchema } from "@/domain/requests";
import {
  privateHeaders,
  readWriteBody,
  requestEnvironment,
  requestError,
} from "@/infrastructure/requests/http";
import {
  authorizeCustomer,
  rateLimit,
} from "@/infrastructure/requests/security";
import {
  getThread,
  postCustomerReply,
} from "@/infrastructure/requests/service";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, { params }: Context) {
  try {
    const { id } = await params;
    const { db } = requestEnvironment();
    await authorizeCustomer(db, request, id);
    return Response.json(
      { thread: await getThread(db, id) },
      { headers: privateHeaders },
    );
  } catch (error) {
    return requestError(error);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    const raw = await readWriteBody(request);
    const parsed = requestMessageSchema.safeParse(raw);
    if (!parsed.success)
      throw new ChatConflict(400, "Sprawdź treść wiadomości.");
    const { id } = await params;
    const { db } = requestEnvironment();
    await authorizeCustomer(db, request, id);
    await rateLimit(db, `message:${id}`, 60);
    return Response.json(
      { thread: await postCustomerReply(db, id, parsed.data) },
      { headers: privateHeaders },
    );
  } catch (error) {
    return requestError(error);
  }
}
