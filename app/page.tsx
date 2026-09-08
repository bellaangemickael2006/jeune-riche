import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import ManifesteTeaser from "@/components/home/ManifesteTeaser";
import { getPublishedProducts } from "@/lib/data/products";

export default async function HomePage() {
  const products = await getPublishedProducts();
  const showcaseItems = products.map((p) => ({
    name: p.name,
    slug: p.slug,
    image: p.images[0]?.url ?? null,
  }));

  return (
    <>
      <Hero />
      <CategoryGrid items={showcaseItems} />
      <ManifesteTeaser />
    </>
  );
}
