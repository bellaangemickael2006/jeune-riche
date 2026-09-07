import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { updateOrderStatus, updateOrderFulfillment } from "@/lib/actions/orders";
import type { OrderStatus } from "@prisma/client";

const STATUSES: OrderStatus[] = ["NOUVELLE", "CONFIRMEE", "PREPARATION", "EXPEDIEE", "LIVREE", "ANNULEE"];

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const customer = await prisma.user.findFirst({
    where: order.userId ? { id: order.userId } : { email: order.customerEmail },
    select: { id: true },
  });

  const address = order.shippingAddress as {
    line1: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl uppercase text-paper">{order.orderNumber}</h1>
      <p className="mt-1 text-xs text-paper/40">{order.createdAt.toLocaleString("fr-FR")}</p>

      <div className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Client</h2>
          <p className="mt-2 text-sm text-paper">{order.customerName}</p>
          <p className="text-sm text-paper/60">{order.customerEmail}</p>
          {customer && (
            <Link
              href={`/admin/clients/${customer.id}`}
              className="mt-2 inline-block text-xs uppercase tracking-widest2 text-paper/50 underline underline-offset-4 hover:text-paper"
            >
              Voir la fiche client
            </Link>
          )}
        </div>
        <div>
          <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Livraison</h2>
          <p className="mt-2 text-sm text-paper/70">
            {address.line1}, {address.postalCode} {address.city}, {address.country}
          </p>
          {address.phone && <p className="text-sm text-paper/50">{address.phone}</p>}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Statut</h2>
        <form
          action={async (formData: FormData) => {
            "use server";
            await updateOrderStatus(order.id, formData.get("status") as OrderStatus);
          }}
          className="mt-3 flex items-center gap-3"
        >
          <select name="status" defaultValue={order.status} className="border border-line bg-ink px-4 py-2 text-sm text-paper">
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-ink">
                {s}
              </option>
            ))}
          </select>
          <button className="border border-paper px-4 py-2 text-xs uppercase tracking-widest2 text-paper">
            Mettre à jour
          </button>
        </form>
        {order.status === "ANNULEE" && (
          <p className="mt-2 text-xs text-paper/40">Le stock des articles a été remis en rayon.</p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Suivi &amp; notes internes</h2>
        <form
          action={async (formData: FormData) => {
            "use server";
            await updateOrderFulfillment(order.id, formData);
          }}
          className="mt-3 flex flex-col gap-3"
        >
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/40">
              Numéro de suivi (transporteur)
            </span>
            <input
              name="trackingNumber"
              defaultValue={order.trackingNumber ?? ""}
              placeholder="Ex. CI0123456789"
              className="w-full border border-line bg-transparent px-4 py-2 text-sm text-paper placeholder:text-paper/30"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/40">
              Notes internes (jamais visibles par le client)
            </span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={order.notes ?? ""}
              className="w-full border border-line bg-transparent px-4 py-2 text-sm text-paper placeholder:text-paper/30"
            />
          </label>
          <button className="w-fit border border-line px-4 py-2 text-xs uppercase tracking-widest2 text-paper/70 hover:border-paper hover:text-paper">
            Enregistrer
          </button>
        </form>
      </div>

      <div className="mt-10">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Articles</h2>
        <ul className="mt-3 divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between py-3 text-sm">
              <div>
                <p className="text-paper">{item.productName}</p>
                <p className="text-paper/40">
                  {item.color} / {item.size} × {item.quantity}
                  {item.personalization && ` — "${item.personalization}"`}
                </p>
              </div>
              <p className="text-paper/70">{formatPrice(Number(item.unitPrice) * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-3 text-sm">
          <span className="uppercase tracking-widest2 text-paper/50">Total</span>
          <span className="text-paper">{formatPrice(Number(order.total))}</span>
        </div>
      </div>
    </div>
  );
}
