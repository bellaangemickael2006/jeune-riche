import Hero from "@/components/home/Hero";
import IntroOverlay from "@/components/home/IntroOverlay";
import CategoryGrid from "@/components/home/CategoryGrid";
import ManifesteTeaser from "@/components/home/ManifesteTeaser";

export default function HomePage() {
  return (
    <>
      <IntroOverlay />
      <Hero />
      <CategoryGrid />
      <ManifesteTeaser />
    </>
  );
}
