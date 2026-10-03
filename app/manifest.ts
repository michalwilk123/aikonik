import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AIkonik — Twój asystent w sprawach codziennych w Małopolsce",
    short_name: "AIkonik",
    description:
      "AIkonik — przyjazny asystent AI do spraw urzędowych i codziennych w Małopolsce. Proste odpowiedzi, pomoc 24/7.",
    lang: "pl",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF7F1",
    theme_color: "#C62832",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
