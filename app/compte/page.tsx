import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import AuthForms from "@/components/account/AuthForms";
import AccountDashboard from "@/components/account/AccountDashboard";
import { getServerTranslation } from "@/lib/i18n/server";
import { accountChannel } from "@/lib/orders/liveTracking";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation();
  return { title: t("navigation.account") };
}
export const dynamic = "force-dynamic";

async function getSessionUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return null;

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      include: { orders: { orderBy: { createdAt: "desc" } } },
    });
    return dbUser;
  } catch (error) {
    console.error("[compte] getSessionUser:", error);
    return null;
  }
}

export default async function ComptePage() {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 pt-24">
      {user ? (
        <AccountDashboard
          name={user.name}
          email={user.email}
          // Liste « Mes commandes » mise à jour en direct (voir lib/orders/liveTracking.ts).
          liveChannel={accountChannel(user.id)}
          orders={user.orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            total: Number(o.total),
            createdAt: o.createdAt.toISOString(),
          }))}
          address={{
            addressLine1: user.addressLine1,
            addressCity: user.addressCity,
            addressPostalCode: user.addressPostalCode,
            addressCountry: user.addressCountry,
            addressPhone: user.addressPhone,
          }}
        />
      ) : (
        <AuthForms />
      )}
    </div>
  );
}
