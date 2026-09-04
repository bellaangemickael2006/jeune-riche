import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/auth";

// L'admin est toujours servi dynamiquement : jamais de prérendu statique
// pour des pages protégées par session et lues en base à chaque requête.
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-ink font-body">
      <AdminSidebar />
      <div className="ml-56 min-h-screen px-10 py-10">{children}</div>
    </div>
  );
}
