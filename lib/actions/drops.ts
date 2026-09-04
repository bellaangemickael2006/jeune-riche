"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createDrop(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  if (!name || !startsAt) throw new Error("Nom et date requis.");

  await prisma.drop.create({
    data: {
      name,
      slug: slugify(name),
      description: description || null,
      startsAt: new Date(startsAt),
      status: "COMING_SOON",
    },
  });

  revalidatePath("/admin/drops");
}
