import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hubmi — Małopolski Hub Innowacji Społecznych",
    short_name: "Hubmi",
    description:
      "Asystent Małopolskiego Hubu Innowacji Społecznych (ROPS Kraków) — pomaga znaleźć wsparcie i partnerów dla inicjatyw społecznych.",
    lang: "pl",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8ff",
    theme_color: "#091426",
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
