import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import "@/app/globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Hubmi — Małopolski Hub Innowacji Społecznych",
    template: "%s · Hubmi",
  },
  description:
    "Hubmi pomaga mieszkańcom Małopolski znaleźć wsparcie społeczne i zgłosić pomysł na innowację. Projekt Regionalnego Ośrodka Polityki Społecznej w Krakowie.",
  generator: "hubmi",
};

export const viewport: Viewport = { themeColor: "#091426" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${publicSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#tresc"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Przejdź do treści
        </a>
        {children}
      </body>
    </html>
  );
}
