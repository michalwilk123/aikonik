"use client";

import { useAuth, useDocumentInfo } from "@payloadcms/ui";
import { useId, useState } from "react";

export function StaffPasswordForm() {
  const { id } = useDocumentInfo();
  const { user } = useAuth();
  const prefix = useId();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  if (!id || !user || (user.role !== "admin" && String(user.id) !== String(id)))
    return null;

  async function changePassword() {
    setError("");
    if (
      password.length < 8 ||
      password.length > 128 ||
      password !== confirmation
    ) {
      setError(
        "Hasło musi mieć od 8 do 128 znaków. Wpisz je identycznie w obu polach.",
      );
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/cms/users/${id}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmation, currentPassword }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "Nie udało się zmienić hasła.");
      setPassword("");
      setConfirmation("");
      setCurrentPassword("");
      if (String(user?.id) === String(id)) {
        window.location.assign("/admin/login");
      } else {
        setDone(true);
        setOpen(false);
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Nie udało się zmienić hasła.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="staff-password-change"
      aria-labelledby={`${prefix}-heading`}
    >
      <h3 id={`${prefix}-heading`}>Hasło użytkownika</h3>
      <p>
        Zmiana hasła wyloguje wszystkie aktywne sesje użytkownika. Ustawienia
        konta zapisuje się osobno.
      </p>
      {done && <p role="status">Hasło zostało zmienione.</p>}
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        Zmień hasło
      </button>
      {open && (
        <div>
          {user.role !== "admin" && (
            <label htmlFor={`${prefix}-current`}>
              Obecne hasło
              <input
                id={`${prefix}-current`}
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                disabled={busy}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>
          )}
          <label htmlFor={`${prefix}-new`}>
            Nowe hasło
            <input
              id={`${prefix}-new`}
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={password}
              disabled={busy}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label htmlFor={`${prefix}-confirm`}>
            Powtórz nowe hasło
            <input
              id={`${prefix}-confirm`}
              type="password"
              autoComplete="new-password"
              value={confirmation}
              disabled={busy}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button type="button" disabled={busy} onClick={changePassword}>
            {busy ? "Zapisywanie…" : "Zapisz nowe hasło"}
          </button>
        </div>
      )}
    </section>
  );
}
