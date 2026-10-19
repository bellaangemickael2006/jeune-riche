import AdminSidebar from "@/components/admin/AdminSidebar";
import { getAdminAccess } from "@/lib/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { prisma } from "@/lib/prisma";

// L'admin est toujours servi dynamiquement : jamais de prérendu statique
// pour des pages protégées par session et lues en base à chaque requête.
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const { permissions } = await getAdminAccess();
  // Commandes encore à traiter, affichées à côté de « Commandes » dans le menu.
  const newOrders = hasPermission(permissions, "commandes")
    ? await prisma.order.count({ where: { status: "NOUVELLE" } }).catch(() => 0)
    : 0;

  return (
    <div className="min-h-screen bg-ink font-body">
      <AdminSidebar badges={{ "/admin/commandes": newOrders }} permissions={permissions} />
      <div className="min-h-screen px-5 pb-10 pt-24 lg:ml-56 lg:px-10 lg:py-10">{children}</div>
    </div>
  );
}
