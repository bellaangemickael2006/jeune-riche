"use client";

import { useActionState } from "react";
import { sendCampaign } from "@/lib/actions/newsletter";

type State = { sent: number; total: number } | { error: string } | null;

export default function CampaignForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => {
    try {
      return await sendCampaign(formData);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Erreur inconnue." };
    }
  }, null);

  return (
    <form action={formAction} className="mt-10 flex max-w-md flex-col gap-4 border-t border-line pt-8">
      <p className="text-xs uppercase tracking-widest2 text-paper/50">Envoyer une campagne</p>

      {state && "error" in state && (
        <p className="border border-blood/40 bg-blood/10 px-3 py-2 text-xs text-blood">{state.error}</p>
      )}
      {state && "sent" in state && (
        <p className="border border-paper/20 bg-paper/5 px-3 py-2 text-xs text-paper/70">
          Envoyé à {state.sent}/{state.total} abonné(s).
        </p>
      )}

      <input
        name="subject"
        required
        placeholder="Objet"
        className="border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30"
      />
      <textarea
        name="body"
        required
        rows={6}
        placeholder="Message (un paragraphe par ligne)"
        className="border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Envoyer à tous les abonnés"}
      </button>
    </form>
  );
}
