import {
  betterAuthCollections,
  createBetterAuthPlugin,
  payloadAdapter,
} from "@delmaredigital/payload-better-auth";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import type { Plugin } from "payload";
import { isAdmin } from "@/infrastructure/cms/access";

const betterAuthOptions: BetterAuthOptions = {
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "cms", input: false },
    },
  },
  session: { expiresIn: 7200, updateAge: 1800 },
  advanced: { database: { generateId: "serial" } },
};

export function staffAuthPlugins(secret: string, baseURL: string): Plugin[] {
  return [
    betterAuthCollections({
      betterAuthOptions,
      firstUserAdmin: false,
      acknowledgeRoleGuardDisabled: true,
      access: {
        create: isAdmin,
        read: isAdmin,
        update: isAdmin,
        delete: isAdmin,
      },
      adminGroup: "Administracja",
      customizeCollection: (_model, collection) => ({
        ...collection,
        lockDocuments: false,
        admin: {
          ...collection.admin,
          hidden: ({ user }) => user?.role !== "admin",
        },
      }),
    }),
    createBetterAuthPlugin({
      createAuth: (payload) =>
        betterAuth({
          ...betterAuthOptions,
          database: payloadAdapter({
            payloadClient: payload,
            adapterConfig: { dbType: "sqlite", idType: "number" },
          }),
          secret,
          baseURL,
          basePath: "/api/cms/auth",
          trustedOrigins: [baseURL],
        }),
      admin: {
        enableManagementUI: false,
        login: {
          title: "Zaloguj się do AIkonika",
          requiredRole: ["cms", "admin"],
          enableSignUp: false,
          enableForgotPassword: false,
          enablePasskey: false,
          enableMagicLink: false,
          enableEmailOtp: false,
        },
      },
    }),
  ];
}
