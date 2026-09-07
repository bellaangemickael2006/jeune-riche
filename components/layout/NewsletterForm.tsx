"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

// Auparavant un <form action="/api/newsletter" method="POST"> natif : un clic
// sur "Envoyer" rechargeait toute la page (perte du panier, de l'état Lenis,
// etc.) et redirigeait sans aucun message visible en cas d'email invalide.
// Version contrôlée : soumission en fetch, retour visuel dans le pied de page.
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return <p className="mt-5 max-w-xs text-body text-paper/80">Merci, vous êtes inscrit·e.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 max-w-xs">
      <div className="flex items-center border-b border-paper/30 pb-2">
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Votre email"
          disabled={status === "submitting"}
          className="w-full bg-transparent text-body text-paper placeholder:text-paper/40 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="shrink-0 text-label text-paper/70 transition-colors hover:text-paper disabled:opacity-50"
        >
          {status === "submitting" ? "Envoi..." : "Envoyer"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-caption text-paper/60">Une erreur est survenue, réessayez.</p>
      )}
    </form>
  );
}
