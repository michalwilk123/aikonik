import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "@/app/globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "AiKonik — Twój asystent w sprawach codziennych w Małopolsce",
    template: "%s · AiKonik",
  },
  description:
    "AiKonik to przyjazny asystent AI, który pomaga mieszkańcom województwa małopolskiego załatwiać sprawy urzędowe i codzienne: proste odpowiedzi, jasne wyjaśnienia, pomoc 24/7.",
  generator: "hubmi",
};

export const viewport: Viewport = { themeColor: "#C62832" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${nunito.variable} h-full antialiased`}>
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
