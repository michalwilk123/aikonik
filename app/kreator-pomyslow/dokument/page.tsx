"use client";

import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const documentKey = "idea-creator-document";

export default function IdeaDocumentPage() {
  const [documentHtml, setDocumentHtml] = useState<string | null>(null);

  useEffect(() => {
    setDocumentHtml(sessionStorage.getItem(documentKey));
  }, []);

  function download() {
    if (!documentHtml) return;
    const url = URL.createObjectURL(new Blob([documentHtml], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "social-innovation-canvas.html";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-surface px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/kreator-pomyslow" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-4" /> Wróć do kreatora
          </Link>
          {documentHtml ? <Button onClick={download}><Download /> Pobierz HTML</Button> : null}
        </div>
        {documentHtml ? (
          <iframe title="Podgląd dokumentu Social Innovation Canvas" srcDoc={documentHtml} className="h-[calc(100vh-8rem)] w-full rounded-xl border border-outline-variant bg-white shadow-soft" />
        ) : (
          <section className="rounded-2xl bg-white p-8 shadow-soft">
            <h1 className="text-2xl font-bold text-primary">Brak dokumentu do podglądu</h1>
            <p className="mt-2 text-on-surface-variant">Wróć do kreatora i wygeneruj dokument po ukończeniu rozmowy.</p>
          </section>
        )}
      </div>
    </main>
  );
}
