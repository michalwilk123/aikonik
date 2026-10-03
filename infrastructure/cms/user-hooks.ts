import { hashPassword } from "better-auth/crypto";
import type {
  CollectionAfterChangeHook,
  CollectionBeforeDeleteHook,
  FieldHook,
} from "payload";

export const prepareStaffPassword: FieldHook = async ({ value, req }) => {
  if (typeof value === "string" && value.length > 0) {
    req.context.staffPasswordHash = await hashPassword(value);
  }
  return undefined;
};

export const saveStaffPassword: CollectionAfterChangeHook = async ({
  doc,
  req,
}) => {
  const password = req.context.staffPasswordHash;
  delete req.context.staffPasswordHash;
  if (typeof password !== "string") return doc;
  const accounts = await req.payload.find({
    collection: "accounts",
    where: {
      and: [
        { user: { equals: doc.id } },
        { providerId: { equals: "credential" } },
      ],
    },
    limit: 1,
    req,
    overrideAccess: true,
  });
  if (accounts.docs[0]) {
    await req.payload.update({
      collection: "accounts",
      id: accounts.docs[0].id,
      data: { password },
      req,
      overrideAccess: true,
    });
  } else {
    await req.payload.create({
      collection: "accounts",
      data: {
        user: doc.id,
        accountId: String(doc.id),
        providerId: "credential",
        password,
      },
      req,
      overrideAccess: true,
    });
  }
  await req.payload.delete({
    collection: "sessions",
    where: { user: { equals: doc.id } },
    req,
    overrideAccess: true,
  });
  return doc;
};

export const deleteStaffCredentials: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  for (const collection of ["sessions", "accounts"] as const) {
    await req.payload.delete({
      collection,
      where: { user: { equals: id } },
      req,
      overrideAccess: true,
    });
  }
};
