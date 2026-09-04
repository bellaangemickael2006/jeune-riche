"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function moderateReview(reviewId: string, status: "APPROVED" | "REJECTED") {
  await requireAdmin();
  await prisma.review.update({ where: { id: reviewId }, data: { status } });
  revalidatePath("/admin/avis");
}
