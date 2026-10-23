"use client";

import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";
import { sendCampaign } from "@/lib/actions/newsletter";

export default function CampaignForm({ subscriberCount }: { subscriberCount: number }) {
  return (
    <ActionForm
      action={async (formData) => {
        if (!window.confirm(`Envoyer cette campagne à ${subscriberCount} abonné(s) ?`)) return;
        return sendCampaign(formData);
      }}
      resetOnSuccess
      className="mt-10 flex max-w-md flex-col gap-4 border-t border-line pt-8"
    >
      <p className="text-xs uppercase tracking-widest2 text-paper/70">Envoyer une campagne</p>
      <input
        name="subject"
        required
        placeholder="Objet"
        className="border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50"
      />
      <textarea
        name="body"
        required
        rows={6}
        placeholder="Message (un paragraphe par ligne)"
        className="border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50"
      />
      <SubmitButton pendingLabel="Envoi…" className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink">
        Envoyer à tous les abonnés
      </SubmitButton>
    </ActionForm>
  );
}
