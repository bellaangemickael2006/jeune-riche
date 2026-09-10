import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import DetailSection from "@/components/home/DetailSection";
import ManifesteTeaser from "@/components/home/ManifesteTeaser";
import WelcomeToast from "@/components/home/WelcomeToast";
import LoginWelcome from "@/components/home/LoginWelcome";
import { getPublishedProducts } from "@/lib/data/products";

export default async function HomePage() {
  const products = await getPublishedProducts();
  const showcaseItems = products.map((p) => ({
    name: p.name,
    slug: p.slug,
    image: p.images[0]?.url ?? null,
    price: p.price ? Number(p.price) : null,
  }));

  // Le hero met en avant une pièce réelle du catalogue plutôt qu'un visuel
  // décoratif — si rien n'est publié, il retombe sur le badge de marque.
  const feature = showcaseItems[0];

  // La section détail montre le t-shirt blanc (les deux seuls visuels de
  // scène du projet le concernent) : on pointe vers cette pièce si elle est
  // publiée, sinon vers le catalogue.
  const detailHref =
    products.find((p) => p.slug.includes("t-shirt"))?.slug ?? products[0]?.slug;

  return (
    <>
      <WelcomeToast />
      <LoginWelcome />
      <Hero feature={feature} />
      <CategoryGrid items={showcaseItems} />
      <DetailSection href={detailHref ? `/catalogue/${detailHref}` : "/catalogue"} />
      <ManifesteTeaser />
    </>
  );
}
