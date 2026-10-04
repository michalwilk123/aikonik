export type SubmissionReceiptData = {
  id: string;
  conversationURL?: string;
  devConversationURL?: string;
  notification?: "sent" | "pending" | "disabled" | "failed";
};

export function SubmissionReceipt({
  receipt,
}: {
  receipt: SubmissionReceiptData;
}) {
  return (
    <section
      role="status"
      className="flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm leading-6 text-green-950"
    >
      <p className="font-semibold">
        Zgłoszenie zostało zapisane i jest dostępne dla pracowników ROPS Kraków.
      </p>
      <p className="break-all">Numer zgłoszenia: {receipt.id}</p>
      <p>
        {receipt.notification === "sent"
          ? "Wysłaliśmy na Twój adres e-mail prywatny link do rozmowy. Sprawdź też folder spam."
          : receipt.notification === "failed"
            ? "Nie udało się wysłać e-maila. Otwórz rozmowę i poproś o nowy link."
            : receipt.notification === "pending"
              ? "Zgłoszenie jest zapisane. E-mail z prywatnym linkiem nie został jeszcze wysłany. Otwórz rozmowę i poproś o nowy link."
              : "Zgłoszenie jest zapisane, ale wysyłka wiadomości e-mail jest obecnie niedostępna."}
      </p>
      <p>
        Nie potrzebujesz konta. Każda odpowiedź pracownika wywoła powiadomienie
        e-mail. Odpowiesz przez prywatny link do rozmowy.
      </p>
      <a
        className="font-semibold underline underline-offset-4"
        href={
          receipt.conversationURL ??
          `/zgloszenia/${encodeURIComponent(receipt.id)}`
        }
      >
        Rozmowa i ponowne wysłanie linku
      </a>
      {receipt.devConversationURL && (
        <a
          className="font-semibold underline underline-offset-4"
          href={receipt.devConversationURL}
          referrerPolicy="no-referrer"
        >
          Podgląd rozmowy (środowisko deweloperskie)
        </a>
      )}
    </section>
  );
}
