"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const SETTINGS_ID = "default";

export async function updateStoreSettings(formData: FormData) {
  await requireAdmin();

  const shippingCostRaw = String(formData.get("shippingCost") ?? "").trim();
  const freeShippingThresholdRaw = String(formData.get("freeShippingThreshold") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();

  await prisma.storeSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      shippingCost: shippingCostRaw ? Number(shippingCostRaw) : 0,
      freeShippingThreshold: freeShippingThresholdRaw ? Number(freeShippingThresholdRaw) : null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
    },
    update: {
      shippingCost: shippingCostRaw ? Number(shippingCostRaw) : 0,
      freeShippingThreshold: freeShippingThresholdRaw ? Number(freeShippingThresholdRaw) : null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
    },
  });

  revalidateTag("store-settings");
  revalidatePath("/admin/parametres");
}
