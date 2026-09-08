"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

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
  orders,
  address,
}: {
  name: string | null;
  email: string;
  orders: Order[];
  address: Address;
}) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest2 text-paper/40">Compte</p>
          <p className="mt-1 font-display text-2xl uppercase text-paper">{name || email}</p>
        </div>
        <button onClick={logout} className="text-xs uppercase tracking-widest2 text-paper/40 hover:text-paper">
          Déconnexion
        </button>
      </div>

      <div className="mt-10">
        <p className="text-xs uppercase tracking-widest2 text-paper/50">Mes commandes</p>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-paper/40">Aucune commande pour le moment.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="text-paper">{o.orderNumber}</p>
                  <p className="text-xs text-paper/40">{new Date(o.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-paper/70">{formatPrice(o.total)}</p>
                  <p className="text-xs text-paper/40">{o.status}</p>
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
      if (!res.ok) throw new Error("Impossible d'enregistrer l'adresse.");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-10 border-t border-line pt-8">
      <p className="text-xs uppercase tracking-widest2 text-paper/50">Adresse de livraison</p>
      <p className="mt-1 text-xs text-paper/30">
        Enregistrée automatiquement à chaque commande — modifiable ici pour la prochaine fois.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <input
          value={form.addressLine1}
          onChange={(e) => update("addressLine1", e.target.value)}
          placeholder="Adresse"
          className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.addressCity}
            onChange={(e) => update("addressCity", e.target.value)}
            placeholder="Ville"
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-none"
          />
          <input
            value={form.addressPostalCode}
            onChange={(e) => update("addressPostalCode", e.target.value)}
            placeholder="Code postal (optionnel)"
            className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-none"
          />
        </div>
        <input
          value={form.addressCountry}
          onChange={(e) => update("addressCountry", e.target.value)}
          placeholder="Pays"
          className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-none"
        />
        <input
          value={form.addressPhone}
          onChange={(e) => update("addressPhone", e.target.value)}
          placeholder="Téléphone (optionnel)"
          className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-none"
        />
        {error && <p className="text-xs text-paper">{error}</p>}
        <button
          type="submit"
          disabled={saving || !form.addressLine1 || !form.addressCity || !form.addressCountry}
          className="w-fit border border-paper px-6 py-3 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-80 disabled:opacity-30"
        >
          {saving ? "Enregistrement…" : saved ? "Enregistré ✓" : "Enregistrer l'adresse"}
        </button>
      </form>
    </div>
  );
}
