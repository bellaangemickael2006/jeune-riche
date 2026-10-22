"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { useLocale } from "@/components/providers/I18nProvider";
import PhoneForm from "@/components/account/PhoneForm";
import PushToggle from "@/components/notifications/PushToggle";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
};

type Address = {
  addressLine1: string | null;
  addressCity: string | null;
  addressPostalCode: string | null;
  addressCountry: string | null;
  addressPhone: string | null;
};

export default function AccountDashboard({
  name,
  email,
  liveChannel,
  orders,
  address,
}: {
  name: string | null;
  email: string;
  /** Canal temps réel du compte, ou null si aucune clé n'est configurée. */
  liveChannel: string | null;
  orders: Order[];
  address: Address;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const [liveUpdate, setLiveUpdate] = useState<number | null>(null);

  // Quand l'équipe change une commande dans l'admin, un signal arrive sur le
  // canal du compte : la page relit les commandes avec la session du client
  // (rien d'autre ne transite). Relecture aussi au retour sur l'onglet.
  useEffect(() => {
    if (!liveChannel) return;
    const supabase = createClient();
    const channel = supabase
      .channel(liveChannel)
      .on("broadcast", { event: "update" }, () => {
        setLiveUpdate(Date.now());
        router.refresh();
      })
      .subscribe();
    function onVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      supabase.removeChannel(channel);
    };
  }, [liveChannel, router]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest2 text-paper/80">{t("navigation.account")}</p>
          <p className="mt-1 font-display text-2xl uppercase text-paper">{name || email}</p>
        </div>
        <button onClick={logout} className="text-sm uppercase tracking-widest2 text-paper/80 underline underline-offset-4 hover:text-paper">
          {t("account.logout")}
        </button>
      </div>

      {!address.addressPhone && (
        // WhatsApp est le canal de suivi des commandes : rappel tant que le
        // numéro manque (fréquent après une inscription avec Google).
        <div className="mt-8 border border-paper/40 p-5">
          <p className="text-xs uppercase tracking-widest2 text-paper">{t("account.phoneMissingTitle")}</p>
          <p className="mb-4 mt-1 text-xs text-paper/70">{t("account.phoneStepText")}</p>
          <PhoneForm onSaved={() => router.refresh()} />
        </div>
      )}

      <div className="mt-10">
        <p className="text-xs uppercase tracking-widest2 text-paper/70">{t("account.myOrders")}</p>
        {liveUpdate && (
          <p key={liveUpdate} role="status" className="mt-3 border border-paper/30 px-3 py-2 text-xs text-paper">
            {t("account.ordersLiveUpdated")}
          </p>
        )}
        {orders.length > 0 && <PushToggle target={{ type: "account" }} storageKey="account" />}
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-paper/70">{t("account.noOrders")}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="text-paper">{o.orderNumber}</p>
                  <p className="text-xs text-paper/70">{new Date(o.createdAt).toLocaleDateString(locale)}</p>
                </div>
                <div className="text-right">
                  <p className="text-paper/70">{formatPrice(o.total, locale)}</p>
                  <p className="text-xs text-paper/70">{t(`account.orderStatus.${o.status}`)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddressBook address={address} />
    </div>
  );
}

function AddressBook({ address }: { address: Address }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    addressLine1: address.addressLine1 ?? "",
    addressCity: address.addressCity ?? "",
    addressPostalCode: address.addressPostalCode ?? "",
    addressCountry: address.addressCountry ?? "Côte d'Ivoire",
    addressPhone: address.addressPhone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/address", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(t("account.addressSaveError"));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("checkout.genericError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-10 border-t border-line pt-8">
      <p className="text-xs uppercase tracking-widest2 text-paper/70">{t("account.addressBook")}</p>
      <p className="mt-1 text-xs text-paper/70">{t("account.addressBookHint")}</p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <input
          value={form.addressLine1}
          onChange={(e) => update("addressLine1", e.target.value)}
          placeholder={t("account.addressPlaceholder")}
          className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50 focus:border-paper focus:outline-hidden"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.addressCity}
            onChange={(e) => update("addressCity", e.target.value)}
            placeholder={t("account.cityPlaceholder")}
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50 focus:border-paper focus:outline-hidden"
          />
          <input
            value={form.addressPostalCode}
            onChange={(e) => update("addressPostalCode", e.target.value)}
            placeholder={t("account.postalCodePlaceholder")}
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50 focus:border-paper focus:outline-hidden"
          />
        </div>
        <input
          value={form.addressCountry}
          onChange={(e) => update("addressCountry", e.target.value)}
          placeholder={t("account.countryPlaceholder")}
          className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50 focus:border-paper focus:outline-hidden"
        />
        <input
          value={form.addressPhone}
          onChange={(e) => update("addressPhone", e.target.value)}
          placeholder={t("account.phonePlaceholder")}
          className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/50 focus:border-paper focus:outline-hidden"
        />
        {error && <p className="text-xs text-paper">{error}</p>}
        <button
          type="submit"
          disabled={saving || !form.addressLine1 || !form.addressCity || !form.addressCountry}
          className="w-fit border border-paper px-6 py-3 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {saving ? t("account.saving") : saved ? t("account.saved") : t("account.saveAddress")}
        </button>
      </form>
    </div>
  );
}
