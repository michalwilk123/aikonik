"use client";

import { Send, UserCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  offerTitle: string | null;
  onClose: () => void;
};

const fields = [
  {
    id: "name",
    label: "Imię i nazwisko zgłaszającego / opiekuna",
    placeholder: "np. Anna Nowak",
    type: "text",
    autoComplete: "name",
  },
  {
    id: "phone",
    label: "Telefon kontaktowy",
    placeholder: "np. 500 100 200",
    type: "tel",
    autoComplete: "tel",
  },
  {
    id: "street",
    label: "Ulica w Krakowie (dojazd wolontariusza)",
    placeholder: "np. ul. Juliusza Lea, Krowodrza",
    type: "text",
    autoComplete: "street-address",
  },
];

export function ContactDialog({ offerTitle, onClose }: Props) {
  const [sent, setSent] = useState(false);

  return (
    <Dialog
      open={offerTitle !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      onOpenChangeComplete={(open) => {
        if (!open) {
          setSent(false);
        }
      }}
    >
      <DialogContent className="max-w-[calc(100%-2rem)] gap-5 rounded-2xl bg-white p-6 sm:max-w-lg">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
            <UserCheck className="size-6" />
          </span>
          <div className="flex flex-col gap-1 pr-6">
            <DialogTitle className="text-lg leading-6 font-semibold text-primary">
              Formularz szybkiego kontaktu ROPS
            </DialogTitle>
            <p className="text-sm font-medium text-secondary">{offerTitle}</p>
          </div>
        </div>

        {sent ? (
          <>
            <DialogDescription
              role="status"
              className="text-[15px] leading-6 text-on-surface"
            >
              Dziękujemy. Zgłoszenie zostało przekazane do koordynatora ROPS
              Kraków. Skontaktujemy się telefonicznie.
            </DialogDescription>
            <DialogClose
              render={<Button className="h-11 self-end px-5 font-semibold" />}
            >
              Zamknij
            </DialogClose>
          </>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <DialogDescription className="text-[13px] leading-5">
              Koordynator programu z krakowskiego ROPS skontaktuje się w ciągu
              24h roboczych, aby potwierdzić potrzeby podopiecznego oraz dobrać
              odpowiedniego wolontariusza.
            </DialogDescription>
            {fields.map((f) => (
              <div key={f.id} className="flex flex-col gap-2">
                <Label htmlFor={f.id} className="leading-5">
                  {f.label}
                </Label>
                <Input
                  id={f.id}
                  name={f.id}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  required
                  className="h-11 bg-white px-3 text-[15px]"
                />
              </div>
            ))}
            <div className="flex items-start gap-3">
              <Checkbox id="consent" required className="mt-0.5 size-5" />
              <Label
                htmlFor="consent"
                className="items-start text-[13px] leading-5 font-normal"
              >
                Wyrażam zgodę na kontakt koordynatora ROPS Kraków w celu
                organizacji wsparcia sąsiedzkiego.
              </Label>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <DialogClose
                render={
                  <Button
                    type="button"
                    className="h-11 bg-surface-container px-5 font-semibold text-primary hover:bg-surface-container-high"
                  />
                }
              >
                Anuluj
              </DialogClose>
              <Button
                type="submit"
                className="h-11 bg-secondary px-5 font-semibold text-on-secondary hover:bg-secondary/90"
              >
                <Send className="size-4" />
                Przekaż do koordynatora
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
