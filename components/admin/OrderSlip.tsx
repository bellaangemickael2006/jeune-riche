import { ORDER_STATUS_LABEL } from "@/lib/adminLabels";
import { formatPrice } from "@/lib/utils";

type SlipOrder = {
  orderNumber: string;
  status: string;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  shippingAddress: unknown;
  subtotal: unknown;
  discountCode: string | null;
  discountAmount: unknown;
  total: unknown;
  trackingNumber: string | null;
  notes: string | null;
  items: {
    id: string;
    productName: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: unknown;
    personalization: string | null;
  }[];
};

/**
 * Bon de commande pour l'atelier : noir sur blanc, une page A4 par commande.
 * La personnalisation est en très gros — c'est l'information qu'une
 * préparation ne doit jamais rater.
 */
export default function OrderSlip({ order }: { order: SlipOrder }) {
  const a = (order.shippingAddress ?? {}) as { line1?: string; city?: string; postalCode?: string; country?: string; phone?: string };
  const units = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <article className="slip mx-auto mb-10 w-full max-w-[190mm] bg-white p-8 text-[13px] leading-snug text-black shadow-lg print:mb-0 print:max-w-none print:p-0 print:shadow-none">
      <header className="flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <p className="text-[22px] font-bold uppercase tracking-[0.12em]">Jeune Riche</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Bon de commande — atelier</p>
        </div>
        <div className="text-right">
          <p className="text-[20px] font-bold">{order.orderNumber}</p>
          <p>{order.createdAt.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Abidjan" })}</p>
          <p className="mt-1 inline-block border border-black px-2 py-0.5 text-[11px] uppercase tracking-wider">
            {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status}
          </p>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">Client</p>
          <p className="mt-1 text-[15px] font-bold">{order.customerName}</p>
          {a.phone && <p>WhatsApp : {a.phone}</p>}
          {order.customerEmail && <p>{order.customerEmail}</p>}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">Livraison</p>
          <p className="mt-1">{a.line1 || "—"}</p>
          <p>
            {[a.city, a.postalCode].filter(Boolean).join(" ")}
            {a.country ? `, ${a.country}` : ""}
          </p>
        </div>
      </section>

      <table className="mt-6 w-full table-fixed border-collapse">
        <thead>
          <tr className="border-y-2 border-black text-left text-[11px] uppercase tracking-[0.15em]">
            <th className="w-[7%] py-2">✓</th>
            <th className="w-[41%] py-2">Article</th>
            <th className="w-[14%] py-2">Couleur</th>
            <th className="w-[14%] py-2">Taille</th>
            <th className="w-[8%] py-2 text-center">Qté</th>
            <th className="w-[16%] py-2 text-right">Prix</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="break-inside-avoid border-b border-neutral-300 align-top">
              <td className="py-3">
                <span className="inline-block h-4 w-4 border-2 border-black" />
              </td>
              <td className="py-3">
                <p className="font-bold">{i.productName}</p>
                {i.personalization && (
                  <p className="mt-2 inline-block max-w-full wrap-break-word border-2 border-black px-3 py-1.5 text-[17px] font-bold uppercase tracking-wide">
                    Personnalisation : « {i.personalization} »
                  </p>
                )}
              </td>
              <td className="wrap-break-word py-3 pr-2">{i.color}</td>
              <td className="wrap-break-word py-3 pr-2 text-[15px] font-bold">{i.size}</td>
              <td className="py-3 text-center text-[15px] font-bold">{i.quantity}</td>
              <td className="whitespace-nowrap py-3 text-right text-[12px]">{formatPrice(Number(i.unitPrice) * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-4 flex justify-between gap-6">
        <p className="text-neutral-600">
          {order.items.length} référence{order.items.length > 1 ? "s" : ""} · {units} pièce{units > 1 ? "s" : ""}
        </p>
        <div className="min-w-[60mm] text-right">
          <p>Sous-total : {formatPrice(Number(order.subtotal))}</p>
          {order.discountCode && (
            <p>
              Code {order.discountCode} : −{formatPrice(Number(order.discountAmount))}
            </p>
          )}
          <p className="mt-1 border-t border-black pt-1 text-[15px] font-bold">Total : {formatPrice(Number(order.total))}</p>
          <p className="text-[11px] text-neutral-500">Livraison communiquée au client à part</p>
        </div>
      </section>

      {(order.notes || order.trackingNumber) && (
        <section className="mt-5 border border-neutral-400 p-3">
          {order.trackingNumber && <p>N° de suivi : {order.trackingNumber}</p>}
          {order.notes && (
            <p className="whitespace-pre-line">
              <span className="font-bold">Notes internes : </span>
              {order.notes}
            </p>
          )}
        </section>
      )}

      <footer className="mt-8 grid grid-cols-3 gap-4 text-[12px]">
        {["Préparé par", "Contrôlé par", "Emballé le"].map((label) => (
          <div key={label}>
            <p className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 border-2 border-black" /> {label}
            </p>
            <p className="mt-6 border-b border-black" />
          </div>
        ))}
      </footer>
    </article>
  );
}
