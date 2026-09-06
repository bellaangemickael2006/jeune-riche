"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { formatPrice, cn } from "@/lib/utils";

type Step = "informations" | "livraison" | "recapitulatif";

export default function CheckoutPage() {
  const { lines, total, clear } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<Step>("informations");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    line1: "",
    city: "",
    postalCode: "",
    country: "Côte d'Ivoire",
    phone: "",
  });

  const steps: Step[] = ["informations", "livraison", "recapitulatif"];
  const stepIndex = steps.indexOf(step);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitOrder() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          shippingAddress: {
            line1: form.line1,
            city: form.city,
            postalCode: form.postalCode,
            country: form.country,
            phone: form.phone,
          },
          // Le prix, le nom, la taille et la couleur sont relus côté serveur
          // depuis la base — jamais depuis ce qu'envoie le navigateur.
          lines: lines.map((l) => ({
            variantId: l.variantId,
            quantity: l.quantity,
            personalization: l.personalization,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue.");
      clear();
      router.push(`/checkout/confirmation?numero=${data.orderNumber}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-5 text-center">
        <p className="text-paper/60">Votre panier est vide.</p>
        <Link href="/catalogue" className="text-xs uppercase tracking-widest2 text-paper underline underline-offset-4">
          Voir le catalogue
        </Link>
      </div>
    );
  }

  const STEP_LABELS: Record<Step, string> = {
    informations: "Informations",
    livraison: "Livraison",
    recapitulatif: "Récapitulatif",
  };

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-xl">
        <div className="mb-10 flex items-center gap-3">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
                    i <= stepIndex ? "bg-paper text-ink" : "border border-line text-paper/40"
                  )}
                >
                  {i + 1}
                </span>
                <span className={cn("text-xs uppercase tracking-widest2", i === stepIndex ? "text-paper" : "text-paper/40")}>
                  {STEP_LABELS[s]}
                </span>
              </div>
              {i < steps.length - 1 && <span className="h-px w-6 bg-line" />}
            </div>
          ))}
        </div>

        {step === "informations" && (
          <div className="flex flex-col gap-4">
            <h1 className="font-editorial text-2xl text-paper">Vos informations</h1>
            <Field label="Nom complet" value={form.customerName} onChange={(v) => update("customerName", v)} />
            <Field label="Email" type="email" value={form.customerEmail} onChange={(v) => update("customerEmail", v)} />
            <button
              onClick={() => setStep("livraison")}
              disabled={!form.customerName || !form.customerEmail}
              className="mt-4 bg-paper py-4 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              Continuer
            </button>
          </div>
        )}

        {step === "livraison" && (
          <div className="flex flex-col gap-4">
            <h1 className="font-editorial text-2xl text-paper">Livraison</h1>
            <Field label="Adresse" value={form.line1} onChange={(v) => update("line1", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ville" value={form.city} onChange={(v) => update("city", v)} />
              <Field label="Code postal (optionnel)" value={form.postalCode} onChange={(v) => update("postalCode", v)} required={false} />
            </div>
            <Field label="Pays" value={form.country} onChange={(v) => update("country", v)} />
            <Field label="Téléphone (optionnel)" value={form.phone} onChange={(v) => update("phone", v)} required={false} />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setStep("informations")} className="border border-line px-6 py-4 text-xs uppercase tracking-widest2 text-paper/70">
                Retour
              </button>
              <button
                onClick={() => setStep("recapitulatif")}
                disabled={!form.line1 || !form.city}
                className="flex-1 bg-paper py-4 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {step === "recapitulatif" && (
          <div className="flex flex-col gap-6">
            <h1 className="font-editorial text-2xl text-paper">Récapitulatif</h1>
            <div>
              <p className="text-xs uppercase tracking-widest2 text-paper/40">Articles</p>
              <ul className="mt-3 divide-y divide-line">
                {lines.map((l) => (
                  <li key={`${l.variantId}-${l.personalization ?? ""}`} className="flex justify-between py-3 text-sm text-paper">
                    <span>
                      {l.productName} — {l.color}/{l.size} × {l.quantity}
                      {l.personalization && ` — "${l.personalization}"`}
                    </span>
                    <span>{formatPrice(l.unitPrice * l.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm text-paper">
                <span className="uppercase tracking-widest2 text-paper/50">Total</span>
                <span>{formatPrice(total())}</span>
              </div>
            </div>

            <div className="border border-line bg-line/20 px-4 py-4 text-xs text-paper/60">
              Aucun prestataire de paiement en ligne n&apos;est encore connecté à ce site. Votre
              commande sera enregistrée et notre équipe vous contactera par email pour finaliser le
              règlement.
            </div>

            {error && <p className="text-xs font-medium text-paper">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep("livraison")} className="border border-line px-6 py-4 text-xs uppercase tracking-widest2 text-paper/70">
                Retour
              </button>
              <button
                onClick={submitOrder}
                disabled={submitting}
                className="flex-1 bg-paper py-4 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Envoi…" : "Confirmer la commande"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-widest2 text-paper/50">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper focus:border-paper focus:outline-none"
      />
    </label>
  );
}
