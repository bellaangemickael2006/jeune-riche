"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cleanPhone } from "@/lib/account/phone";

/** Saisie du numéro WhatsApp ; `onSaved` est appelé une fois enregistré. */
export default function PhoneForm({ onSaved, autoFocus }: { onSaved: () => void; autoFocus?: boolean }) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("+225 ");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!cleanPhone(phone)) {
      setError(t("account.phoneInvalid"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error(res.status === 400 ? t("account.phoneInvalid") : t("checkout.genericError"));
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("checkout.genericError"));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        autoFocus={autoFocus}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        aria-label={t("account.phone")}
        className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
      />
      {error && (
        <p role="alert" className="text-xs text-paper">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="bg-paper py-3 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? t("account.saving") : t("account.phoneSave")}
      </button>
    </form>
  );
}
