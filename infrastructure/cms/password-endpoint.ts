import { hashPassword, verifyPassword } from "better-auth/crypto";
import type { PayloadHandler } from "payload";
import { z } from "zod";

const passwordInput = z
  .object({
    password: z.string().min(8).max(128),
    confirmation: z.string(),
    currentPassword: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmation);

export const changeStaffPassword: PayloadHandler = async (req) => {
  const headers = { "Cache-Control": "no-store" };
  const reply = (error: string, status: number) =>
    Response.json({ error }, { status, headers });
  const id = Number(req.routeParams?.id);
  const user = req.user;
  if (!user || !["admin", "cms"].includes(user.role))
    return reply("Zaloguj się ponownie.", 401);
  if (!Number.isSafeInteger(id) || id < 1)
    return reply("Nieprawidłowy użytkownik.", 400);
  if (user.role !== "admin" && user.id !== id)
    return reply("Brak uprawnień.", 403);
  const origin = req.headers.get("origin");
  if (origin && (!req.url || origin !== new URL(req.url).origin))
    return reply("Niedozwolone źródło żądania.", 403);
  let input: z.infer<typeof passwordInput>;
  try {
    input = passwordInput.parse(await req.json?.());
  } catch {
    return reply(
      "Hasło musi mieć od 8 do 128 znaków. Wpisz je identycznie w obu polach.",
      400,
    );
  }
  // A CMS user must prove knowledge of their current password; administrators can reset accounts.
  if (user.role !== "admin") {
    const accounts = await req.payload.find({
      collection: "accounts",
      where: {
        and: [
          { user: { equals: id } },
          { providerId: { equals: "credential" } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    });
    const hash = accounts.docs[0]?.password;
    if (
      !hash ||
      !input.currentPassword ||
      !(await verifyPassword({ hash, password: input.currentPassword }))
    ) {
      return reply("Obecne hasło jest nieprawidłowe.", 400);
    }
  }
  req.context.staffPasswordHash = await hashPassword(input.password);
  await req.payload.update({
    collection: "users",
    id,
    data: {},
    overrideAccess: false,
    req,
  });
  return Response.json({ success: true }, { headers });
};
