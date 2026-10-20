import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice, whatsappStatusUpdateLink } from "@/lib/utils";
import { updateOrderStatus, updateOrderFulfillment } from "@/lib/actions/orders";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";
import { ORDER_STATUS_LABEL } from "@/lib/adminLabels";

const STATUSES: OrderStatus[] = ["NOUVELLE", "CONFIRMEE", "PREPARATION", "EXPEDIEE", "LIVREE", "ANNULEE"];

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Avant toute lecture en base — voir lib/auth.ts.
  await requireAdmin("commandes");
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const customer = await prisma.user.findFirst({
    where: order.userId ? { id: order.userId } : { email: order.customerEmail },
    select: { id: true },
  });

  const address = (order.shippingAddress ?? {}) as {
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  };
  const addressLine = [address.line1, [address.postalCode, address.city].filter(Boolean).join(" "), address.country]
    .filter(Boolean)
    .join(", ");
  const discount = Number(order.discountAmount);

  const notifyLink = whatsappStatusUpdateLink(order.status, order.orderNumber, address.phone, order.trackingNumber);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/commandes" className="text-xs uppercase tracking-widest2 text-paper/40 hover:text-paper">
        ← Commandes
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl uppercase text-paper">{order.orderNumber}</h1>
        <a
          href={`/admin/bons?ids=${order.id}&imprimer=1`}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-paper px-4 py-2 text-[10px] uppercase tracking-widest2 text-paper hover:bg-paper hover:text-ink"
        >
          Imprimer le bon
        </a>
      </div>
      <p className="mt-1 text-xs text-paper/40">{order.createdAt.toLocaleString("fr-FR")}</p>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Client</h2>
          <p className="mt-2 text-sm text-paper">{order.customerName}</p>
          {address.phone && <p className="text-sm font-medium text-paper">WhatsApp : {address.phone}</p>}
          {order.customerEmail && <p className="text-sm text-paper/60">{order.customerEmail}</p>}
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
          <p className="mt-2 text-sm text-paper/70">{addressLine || "—"}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Statut</h2>
        <ActionForm action={updateOrderStatus.bind(null, order.id)} className="mt-3 flex flex-wrap items-center gap-3">
          <select name="status" defaultValue={order.status} className="border border-line bg-ink px-4 py-2 text-sm text-paper">
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-ink">
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <SubmitButton className="border border-paper px-4 py-2 text-xs uppercase tracking-widest2 text-paper">
            Mettre à jour
          </SubmitButton>
        </ActionForm>
        {order.status === "ANNULEE" && (
          <p className="mt-2 text-xs text-paper/40">
            Le stock des articles a été remis en rayon. Choisir un autre statut le reprend.
          </p>
        )}
        {notifyLink ? (
          <a
            href={notifyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 border border-line px-4 py-2 text-xs uppercase tracking-widest2 text-paper/70 transition-colors hover:border-paper hover:text-paper"
          >
            <WhatsAppIcon />
            Prévenir le client sur WhatsApp
          </a>
        ) : (
          address.phone && (
            <p className="mt-2 text-[11px] text-paper/30">
              Pas de message auto pour le statut « {ORDER_STATUS_LABEL[order.status]} ».
            </p>
          )
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Suivi &amp; notes internes</h2>
        <ActionForm action={updateOrderFulfillment.bind(null, order.id)} className="mt-3 flex flex-col gap-3">
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
          <SubmitButton className="w-fit border border-line px-4 py-2 text-xs uppercase tracking-widest2 text-paper/70 hover:border-paper hover:text-paper">
            Enregistrer
          </SubmitButton>
        </ActionForm>
      </div>

      <div className="mt-10">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/50">Articles</h2>
        <ul className="mt-3 divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="text-paper">{item.productName}</p>
                <p className="text-paper/40">
                  {item.color} / {item.size} × {item.quantity}
                  {item.personalization && ` — "${item.personalization}"`}
                </p>
              </div>
              <p className="shrink-0 text-paper/70">{formatPrice(Number(item.unitPrice) * item.quantity)}</p>
            </li>
          ))}
        </ul>
        {discount > 0 && (
          <div className="mt-4 flex flex-col gap-1 border-t border-line pt-3 text-sm text-paper/60">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span>Remise{order.discountCode ? ` (${order.discountCode})` : ""}</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-between border-t border-line pt-3 text-sm">
          <span className="uppercase tracking-widest2 text-paper/50">Total</span>
          <span className="text-paper">{formatPrice(Number(order.total))}</span>
        </div>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-4 w-4 shrink-0 text-[#25D366]" fill="currentColor" aria-hidden="true">
      <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.34.678 4.52 1.85 6.36L4 29l7.84-1.81A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.75a9.7 9.7 0 0 1-4.95-1.36l-.355-.21-4.653 1.074 1.09-4.53-.232-.372A9.68 9.68 0 0 1 5.25 15c0-5.93 4.824-10.75 10.754-10.75S26.758 9.07 26.758 15 21.934 24.75 16.004 24.75Zm5.68-7.77c-.31-.156-1.837-.907-2.122-1.01-.285-.104-.492-.156-.699.156-.207.312-.802 1.01-.984 1.217-.181.208-.362.234-.673.078-.31-.156-1.31-.483-2.495-1.54-.923-.823-1.546-1.84-1.727-2.152-.181-.312-.02-.481.136-.636.14-.14.31-.364.466-.546.155-.182.207-.312.31-.52.104-.208.052-.39-.026-.546-.078-.156-.699-1.685-.958-2.308-.252-.605-.508-.523-.699-.533l-.595-.01c-.207 0-.543.078-.828.39-.285.312-1.086 1.06-1.086 2.588 0 1.528 1.112 3.005 1.267 3.213.155.208 2.19 3.343 5.307 4.688.741.32 1.32.512 1.771.655.744.237 1.421.204 1.957.124.597-.089 1.837-.75 2.096-1.474.259-.723.259-1.343.181-1.474-.078-.13-.285-.208-.596-.364Z" />
    </svg>
  );
}
