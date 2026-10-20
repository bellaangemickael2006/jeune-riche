import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DropLive, { type DropPiece } from "@/components/drops/DropLive";
import { getDropBySlug, getDropLive } from "@/lib/data/drops";
import { dropPhase } from "@/lib/drops/live";

// Toujours rendu à la demande : le stock et la phase changent en direct.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const drop = await getDropBySlug(slug);
  if (!drop) return { title: "Drop introuvable" };
  return {
    title: `Drop ${drop.name}`,
    description: drop.description ?? undefined,
    alternates: { canonical: `/drops/${drop.slug}` },
  };
}

export default async function DropPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const drop = await getDropBySlug(slug);
  if (!drop) notFound();
  const live = await getDropLive(slug).catch(() => null);

  const pieces: DropPiece[] = drop.products.map((p) => {
    const image = p.images.find((i) => i.isPrimary) ?? p.images[0];
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price === null ? null : Number(p.price),
      image: image ? { url: image.url, alt: image.alt } : null,
    };
  });

  const initial = live ?? {
    status: drop.status,
    startsAt: drop.startsAt.toISOString(),
    endsAt: drop.endsAt?.toISOString() ?? null,
    stock: Object.fromEntries(drop.products.map((p) => [p.id, p.variants.reduce((sum, v) => sum + v.stock, 0)])),
    recentSales: [],
  };

  return (
    <DropLive
      slug={drop.slug}
      name={drop.name}
      description={drop.description}
      pieces={pieces}
      initial={initial}
      initialPhase={dropPhase(initial)}
    />
  );
}
