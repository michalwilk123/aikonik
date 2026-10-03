import config from "@payload-config";
import "@payloadcms/next/css";
import "@/app/(payload)/brand.css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import { Nunito } from "next/font/google";
import type { ServerFunctionClient } from "payload";
import type { ReactNode } from "react";
import { importMap } from "@/app/(payload)/admin/importMap";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
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
