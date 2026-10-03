import config from "@payload-config";
import "@payloadcms/next/css";
import "@/app/(payload)/brand.css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import localFont from "next/font/local";
import type { ServerFunctionClient } from "payload";
import type { ReactNode } from "react";
import { importMap } from "@/app/(payload)/admin/importMap";

const nunito = localFont({
  src: "../fonts/nunito-variable.ttf",
  variable: "--font-nunito",
  weight: "200 1000",
  display: "swap",
});

const serverFunction: ServerFunctionClient = async (args) => {
  "use server";
  return handleServerFunctions({ ...args, config, importMap });
};

export default function PayloadLayout({ children }: { children: ReactNode }) {
  return (
    <RootLayout
      config={config}
      htmlProps={{ className: nunito.variable }}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  );
}
