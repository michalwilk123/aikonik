import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kraków Społeczny — Małopolski Hub Innowacji Społecznych ROPS",
  description:
    "Krakowski asystent bezpłatnego wsparcia społecznego Regionalnego Ośrodka Polityki Społecznej.",
  generator: "hubmi",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${publicSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
