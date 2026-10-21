import Link from "next/link";
import { Prisma } from "@/lib/generated/prisma/client";
import { getAdminAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/admin/permissions";
import { ADMIN_SEARCH_LIMIT, ADMIN_SEARCH_MIN, parseAdminQuery, type AdminQuery } from "@/lib/admin/search";
import { ORDER_STATUS_LABEL } from "@/lib/adminLabels";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeZone: "Africa/Abidjan" });
const xof = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);
const contains = (text: string) => ({ contains: text, mode: "insensitive" as const });

// Identifiants dont le téléphone contient ces chiffres, espaces et signes
// ignorés. Requête paramétrée (Prisma.sql) : la saisie n'est jamais collée
// dans le texte SQL.
async function idsByPhone(digits: string) {
  const pattern = `%${digits}%`;
  const [orders, users] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id FROM orders WHERE regexp_replace(COALESCE("shippingAddress"->>'phone', ''), '\\D', '', 'g') LIKE ${pattern} LIMIT ${ADMIN_SEARCH_LIMIT}`
    ),
    prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id FROM users WHERE role = 'CLIENT' AND regexp_replace(COALESCE("addressPhone", ''), '\\D', '', 'g') LIKE ${pattern} LIMIT ${ADMIN_SEARCH_LIMIT}`
    ),
  ]);
  return { orderIds: orders.map((o) => o.id), userIds: users.map((u) => u.id) };
}

async function search(q: AdminQuery, can: (p: "commandes" | "clients" | "produits" | "promos") => boolean) {
  const phone = q.digits ? await idsByPhone(q.digits) : { orderIds: [], userIds: [] };
  const [orders, clients, products, promos] = await Promise.all([
    can("commandes")
      ? prisma.order.findMany({
          where: {
            OR: [
              { orderNumber: contains(q.orderNumber ?? q.text) },
              { customerName: contains(q.text) },
              { customerEmail: contains(q.text) },
              { trackingNumber: contains(q.text) },
              ...(phone.orderIds.length ? [{ id: { in: phone.orderIds } }] : []),
            ],
          },
          select: { id: true, orderNumber: true, customerName: true, status: true, total: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: ADMIN_SEARCH_LIMIT,
        })
      : [],
    can("clients")
      ? prisma.user.findMany({
          where: {
            role: "CLIENT",
            OR: [
              { name: contains(q.text) },
              { email: contains(q.text) },
              ...(phone.userIds.length ? [{ id: { in: phone.userIds } }] : []),
            ],
          },
          select: { id: true, name: true, email: true, addressPhone: true },
          orderBy: { createdAt: "desc" },
          take: ADMIN_SEARCH_LIMIT,
        })
      : [],
    can("produits")
      ? prisma.product.findMany({
          where: {
            OR: [
              { name: contains(q.text) },
              { slug: contains(q.text) },
              { variants: { some: { sku: contains(q.text) } } },
              { category: { name: contains(q.text) } },
            ],
          },
          select: { id: true, name: true, published: true, price: true, category: { select: { name: true } } },
          orderBy: { name: "asc" },
          take: ADMIN_SEARCH_LIMIT,
        })
      : [],
    can("promos")
      ? prisma.promoCode.findMany({
          where: { code: contains(q.text.replace(/\s+/g, "")) },
          select: { id: true, code: true, active: true, usedCount: true, maxUses: true },
          take: ADMIN_SEARCH_LIMIT,
        })
      : [],
  ]);
  return { orders, clients, products, promos };
}

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { permissions } = await getAdminAccess();
  const { q: raw } = await searchParams;
  const query = parseAdminQuery(raw);
  const can = (p: "commandes" | "clients" | "produits" | "promos") => hasPermission(permissions, p);
  const results = query ? await search(query, can) : null;
  const total = results ? results.orders.length + results.clients.length + results.products.length + results.promos.length : 0;

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl uppercase text-paper">Recherche</h1>
      <form action="/admin/recherche" className="mt-6">
        <input
          type="search"
          name="q"
          defaultValue={raw ?? ""}
          autoFocus
          maxLength={100}
          placeholder="Numéro de commande, nom, email, téléphone, produit, code promo…"
          className="w-full border border-line bg-transparent px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-paper focus:outline-hidden"
        />
      </form>

      {!query ? (
        <p className="mt-6 text-sm text-paper/40">
          {raw ? `Tapez au moins ${ADMIN_SEARCH_MIN} caractères.` : "Un téléphone peut être tapé avec ou sans espaces."}
        </p>
      ) : total === 0 ? (
        <p className="mt-6 text-sm text-paper/40">Aucun résultat pour « {query.text} ».</p>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {results!.orders.length > 0 && (
            <Section title="Commandes">
              {results!.orders.map((o) => (
                <Row key={o.id} href={`/admin/commandes/${o.id}`}>
                  <span className="text-paper">{o.orderNumber}</span>
                  <span className="text-paper/60">{o.customerName}</span>
                  <span className="text-paper/40">
                    {ORDER_STATUS_LABEL[o.status] ?? o.status} · {xof(Number(o.total))} · {dateFormat.format(o.createdAt)}
                  </span>
                </Row>
              ))}
            </Section>
          )}
          {results!.clients.length > 0 && (
            <Section title="Clients">
              {results!.clients.map((c) => (
                <Row key={c.id} href={`/admin/clients/${c.id}`}>
                  <span className="text-paper">{c.name ?? "Sans nom"}</span>
                  <span className="text-paper/60">{c.email}</span>
                  <span className="text-paper/40">{c.addressPhone ?? ""}</span>
                </Row>
              ))}
            </Section>
          )}
          {results!.products.length > 0 && (
            <Section title="Produits">
              {results!.products.map((p) => (
                <Row key={p.id} href={`/admin/produits/${p.id}`}>
                  <span className="text-paper">{p.name}</span>
                  <span className="text-paper/60">{p.category.name}</span>
                  <span className="text-paper/40">
                    {p.price === null ? "Prix à définir" : xof(Number(p.price))} · {p.published ? "Publié" : "Brouillon"}
                  </span>
                </Row>
              ))}
            </Section>
          )}
          {results!.promos.length > 0 && (
            <Section title="Codes promo">
              {results!.promos.map((p) => (
                <Row key={p.id} href="/admin/codes-promo">
                  <span className="text-paper">{p.code}</span>
                  <span className="text-paper/60">{p.active ? "Actif" : "Désactivé"}</span>
                  <span className="text-paper/40">
                    {p.usedCount} utilisation{p.usedCount > 1 ? "s" : ""}
                    {p.maxUses !== null ? ` / ${p.maxUses}` : ""}
                  </span>
                </Row>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest2 text-paper/50">{title}</h2>
      <ul className="mt-3 divide-y divide-line border-y border-line">{children}</ul>
    </section>
  );
}

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="grid gap-1 py-3 text-sm hover:bg-paper/5 sm:grid-cols-[10rem_1fr_auto] sm:gap-4 sm:px-2">
        {children}
      </Link>
    </li>
  );
}
