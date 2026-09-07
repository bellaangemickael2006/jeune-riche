"use client";

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

export default function AccountDashboard({
  name,
  email,
  orders,
}: {
  name: string | null;
  email: string;
  orders: Order[];
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
    </div>
  );
}
