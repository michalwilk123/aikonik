import catalog from "@/data/rops/catalog.json";
import type { Innovation } from "@/infrastructure/innovations/search";

// Original import fixture; production reads the editable library from D1.
export const innovations: Innovation[] = catalog.projects.map((project) => ({
  ...project,
  pdfs: project.pdfs.map((pdf) => ({
    url: pdf.url,
    pages: "pages" in pdf ? (pdf.pages ?? []) : [],
  })),
}));
