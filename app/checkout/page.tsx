"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useCart } from "@/store/cart";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, cn } from "@/lib/utils";
import BackButton from "@/components/ui/BackButton";
import { useLocale } from "@/components/providers/I18nProvider";

type Step = "informations" | "livraison" | "recapitulatif";

// Brouillon local (formulaire + étape) — survit à un rechargement complet de
// la page, pas seulement à une navigation interne : utile en PWA installée,
// où le système peut tuer puis relancer l'app en arrière-plan (mémoire
// faible, longue mise en veille...), ce qui revient à un rechargement total
// et efface tout état React en mémoire. Sans ça, un client interrompu en
// cours de commande devrait tout retaper. Effacé une fois la commande
// envoyée (voir submitOrder) — jamais destiné à survivre au-delà d'un achat.
const DRAFT_KEY = "jeune-riche-checkout-draft";

export default function CheckoutPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { lines, total, clear } = useCart();
  const [step, setStep] = useState<Step>("informations");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipping, setShipping] = useState({ freeShippingThreshold: null as number | null });
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discountAmount: number } | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);

  useEffect(() => {
    fetch("/api/shipping")
      .then((r) => r.json())
      .then(setShipping)
      .catch(() => {});
  }, []);

  // Préremplit à partir du compte connecté (nom/email + dernière adresse
  // enregistrée) pour éviter de tout retaper à chaque commande — n'écrase
  // jamais un champ que le client a déjà rempli lui-même.
  useEffect(() => {
    async function prefill() {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      setForm((f) => ({
        ...f,
        customerName: f.customerName || (authUser.user_metadata?.name as string) || "",
        customerEmail: f.customerEmail || authUser.email || "",
      }));

      try {
        const res = await fetch("/api/account/address");
        if (!res.ok) return;
        const address = await res.json();
        if (!address.addressLine1) return;
        setForm((f) => ({
          ...f,
          line1: f.line1 || address.addressLine1 || "",
          city: f.city || address.addressCity || "",
          postalCode: f.postalCode || address.addressPostalCode || "",
          country: address.addressCountry || f.country,
          phone: f.phone || address.addressPhone || "",
        }));
      } catch {
        // pas grave : le client remplit simplement le formulaire lui-même
      }
    }
    prefill();
  }, []);

  const subtotal = total();
  // Pas de frais de livraison fixes : ça varie trop selon la destination
  // pour un montant unique en ligne — communiqués directement au client par
  // message après la commande. Seul le seuil de livraison offerte (réglable
  // en admin) est calculé ici, pour l'afficher comme avantage au client.
  const freeShipping =
    shipping.freeShippingThreshold !== null && subtotal >= shipping.freeShippingThreshold;
  const discountAmount = promo?.discountAmount ?? 0;
  const grandTotal = subtotal - discountAmount;

  async function applyPromoCode() {
    if (!promoInput.trim()) return;
    setCheckingPromo(true);
    setPromoMessage(null);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromo({ code: data.code, discountAmount: data.discountAmount });
        setPromoMessage(null);
      } else {
        setPromo(null);
        setPromoMessage(data.message ?? t("checkout.invalidCode"));
      }
    } catch {
      setPromo(null);
      setPromoMessage(t("checkout.checkPromoError"));
    } finally {
      setCheckingPromo(false);
    }
  }

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    line1: "",
    city: "",
    postalCode: "",
    country: "Côte d'Ivoire",
    phone: "",
  });

  // Restaure le brouillon AVANT le préremplissage compte (effet ci-dessus) :
  // celui-ci ne remplit jamais un champ déjà rempli (`f.x || compte`), donc
  // peu importe lequel des deux termine en premier, un brouillon existant
  // gagne toujours sur l'adresse enregistrée — cohérent avec l'intention du
  // client qui retape/corrige quelque chose en cours de commande.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as { form?: Partial<typeof form>; step?: Step };
      if (draft.form) setForm((f) => ({ ...f, ...draft.form }));
      if (draft.step && (["informations", "livraison", "recapitulatif"] as Step[]).includes(draft.step)) {
        setStep(draft.step);
      }
    } catch {
      // brouillon corrompu ou stockage indisponible (navigation privée
      // stricte...) : tant pis, le client repart d'un formulaire vide.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }));
    } catch {
      // best-effort — jamais bloquant pour la saisie en cours.
    }
  }, [form, step]);

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
          promoCode: promo?.code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("checkout.unknownError"));
      clear();
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // best-effort
      }
      // La commande est déjà enregistrée à ce stade — ce lien sert juste à
      // amorcer la conversation, pas à valider la commande.
      window.location.href = data.whatsappUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("checkout.genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-5 text-center">
        <p className="text-paper/60">{t("checkout.emptyCart")}</p>
        <Link href="/catalogue" className="text-xs uppercase tracking-widest2 text-paper underline underline-offset-4">
          {t("common.viewCatalogue")}
        </Link>
      </div>
    );
  }

  const STEP_LABELS: Record<Step, string> = {
    informations: t("checkout.stepInformation"),
    livraison: t("checkout.stepShipping"),
    recapitulatif: t("checkout.stepSummary"),
  };

  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mx-auto max-w-xl">
        <div className="mb-10 flex items-center gap-2 sm:gap-3">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]",
                    i <= stepIndex ? "bg-paper text-ink" : "border border-line text-paper/40"
                  )}
                >
                  {i + 1}
                </span>
                {/* Libellés masqués sous sm : 3 étapes en toutes lettres avec cette
                    largeur de tracking dépassent largement un écran mobile —
                    les puces numérotées + le titre de section en dessous
                    (ex. "Vos informations") suffisent à situer l'utilisateur. */}
                <span className={cn("hidden text-xs uppercase tracking-widest2 sm:inline", i === stepIndex ? "text-paper" : "text-paper/40")}>
                  {STEP_LABELS[s]}
                </span>
              </div>
              {i < steps.length - 1 && <span className="h-px w-4 shrink-0 bg-line sm:w-6" />}
            </div>
          ))}
        </div>

        {step === "informations" && (
          <div className="flex flex-col gap-4">
            <BackButton label={t("product.back")} fallbackHref="/catalogue" className="mb-2 inline-block" />
            <h1 className="font-editorial text-2xl text-paper">{t("checkout.yourInformation")}</h1>
            <Field label={t("checkout.fullName")} value={form.customerName} onChange={(v) => update("customerName", v)} />
            <Field
              label={t("checkout.emailOptional")}
              type="email"
              value={form.customerEmail}
              onChange={(v) => update("customerEmail", v)}
              required={false}
            />
            <button
              onClick={() => {
                setStep("livraison");
                // Snapshot pour la relance panier abandonné — best-effort,
                // ne doit jamais bloquer ni perturber le passage à l'étape
                // suivante si l'appel échoue. Sans email, rien à relancer :
                // inutile d'appeler une route qui rejettera la requête.
                if (form.customerEmail) {
                  fetch("/api/cart/snapshot", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: form.customerEmail,
                      items: lines.map((l) => ({
                        productName: l.productName,
                        size: l.size,
                        color: l.color,
                        quantity: l.quantity,
                        unitPrice: l.unitPrice,
                        personalization: l.personalization,
                      })),
                      total: subtotal,
                    }),
                  }).catch(() => {});
                }
              }}
              disabled={!form.customerName}
              className="mt-4 bg-paper py-4 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              {t("common.continue")}
            </button>
          </div>
        )}

        {step === "livraison" && (
          <div className="flex flex-col gap-4">
            <h1 className="font-editorial text-2xl text-paper">{t("checkout.shipping")}</h1>
            <Field
              label={t("checkout.phone")}
              type="tel"
              value={form.phone}
              onChange={(v) => update("phone", v)}
            />
            <Field label={t("checkout.address")} value={form.line1} onChange={(v) => update("line1", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("checkout.city")} value={form.city} onChange={(v) => update("city", v)} />
              <Field label={t("checkout.postalCode")} value={form.postalCode} onChange={(v) => update("postalCode", v)} required={false} />
            </div>
            <Field label={t("checkout.country")} value={form.country} onChange={(v) => update("country", v)} />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setStep("informations")} className="border border-line px-6 py-4 text-xs uppercase tracking-widest2 text-paper/70">
                {t("common.back")}
              </button>
              <button
                onClick={() => setStep("recapitulatif")}
                disabled={!form.line1 || !form.city || !form.phone}
                className="flex-1 bg-paper py-4 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-30"
              >
                {t("common.continue")}
              </button>
            </div>
          </div>
        )}

        {step === "recapitulatif" && (
          <div className="flex flex-col gap-6">
            <h1 className="font-editorial text-2xl text-paper">{t("checkout.summary")}</h1>
            <div>
              <p className="text-xs uppercase tracking-widest2 text-paper/40">{t("checkout.items")}</p>
              <ul className="mt-3 divide-y divide-line">
                {lines.map((l) => (
                  <li key={`${l.variantId}-${l.personalization ?? ""}`} className="flex justify-between gap-3 py-3 text-sm text-paper">
                    <span>
                      {l.productName} — {l.color}/{l.size} × {l.quantity}
                      {l.personalization && ` — "${l.personalization}"`}
                    </span>
                    <span className="shrink-0">{formatPrice(l.unitPrice * l.quantity, locale)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-sm text-paper">
                <div className="flex justify-between text-paper/60">
                  <span className="uppercase tracking-widest2">{t("cart.subtotal")}</span>
                  <span>{formatPrice(subtotal, locale)}</span>
                </div>
                {promo && (
                  <div className="flex justify-between text-paper/60">
                    <span className="uppercase tracking-widest2">{t("checkout.promoCodeLabel", { code: promo.code })}</span>
                    <span>−{formatPrice(discountAmount, locale)}</span>
                  </div>
                )}
                <div className="flex justify-between text-paper/60">
                  <span className="uppercase tracking-widest2">{t("checkout.shipping")}</span>
                  <span>{freeShipping ? t("checkout.freeShipping") : t("checkout.shippingTBD")}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-2">
                  <span className="uppercase tracking-widest2 text-paper/50">{t("checkout.total")}</span>
                  <span>{formatPrice(grandTotal, locale)}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-widest2 text-paper/40">{t("checkout.promoCode")}</p>
              {promo ? (
                <div className="flex items-center justify-between border border-line px-4 py-3 text-sm">
                  <span className="text-paper">
                    {t("checkout.promoApplied", { code: promo.code, amount: formatPrice(discountAmount, locale) })}
                  </span>
                  <button
                    onClick={() => {
                      setPromo(null);
                      setPromoInput("");
                      setPromoMessage(null);
                    }}
                    className="text-[11px] uppercase tracking-widest2 text-paper/40 hover:text-paper"
                  >
                    {t("common.remove")}
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder={t("checkout.promoCodePlaceholder")}
                    className="w-full border border-line bg-transparent px-4 py-3 text-sm uppercase text-paper placeholder:text-paper/30 placeholder:normal-case focus:border-paper focus:outline-none"
                  />
                  <button
                    onClick={applyPromoCode}
                    disabled={checkingPromo || !promoInput.trim()}
                    className="shrink-0 border border-line px-6 py-3 text-xs uppercase tracking-widest2 text-paper/70 transition-colors hover:border-paper hover:text-paper disabled:opacity-30"
                  >
                    {checkingPromo ? "…" : t("common.apply")}
                  </button>
                </div>
              )}
              {promoMessage && <p className="mt-2 text-xs text-paper/50">{promoMessage}</p>}
            </div>

            <div className="border border-line bg-line/20 px-4 py-4 text-xs text-paper/60">
              {t("checkout.noPaymentProvider")}
            </div>

            {error && <p className="text-xs font-medium text-paper">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep("livraison")} className="border border-line px-6 py-4 text-xs uppercase tracking-widest2 text-paper/70">
                {t("common.back")}
              </button>
              <button
                onClick={submitOrder}
                disabled={submitting}
                className="flex-1 bg-paper py-4 text-xs uppercase tracking-widest2 text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? t("checkout.sending") : t("checkout.confirmAndOpenWhatsapp")}
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
