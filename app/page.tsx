import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import Lookbook from "@/components/home/Lookbook";
import ManifesteTeaser from "@/components/home/ManifesteTeaser";
import WelcomeToast from "@/components/home/WelcomeToast";
import LoginWelcome from "@/components/home/LoginWelcome";
import { getPublishedProducts } from "@/lib/data/products";
import { getHomeContent } from "@/lib/data/homeContent";

export default async function HomePage() {
  const products = await getPublishedProducts();
  // Images et cadrages réglés dans Admin → Page d'accueil.
  const content = await getHomeContent();
  const showcaseItems = products.map((p) => ({
    name: p.name,
    slug: p.slug,
    image: p.images[0]?.url ?? null,
  }));

  return (
    <>
      <WelcomeToast />
      <LoginWelcome />
      <Hero content={content.hero} />
      <CategoryGrid items={showcaseItems} />
      {content.lookbook.visible && content.lookbook.items.length > 0 && <Lookbook content={content.lookbook} />}
      <ManifesteTeaser content={content.manifeste} />
    </>
  );
}
