"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@prisma/client";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdmin();
  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
}
