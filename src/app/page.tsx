import { Hero } from "@/components/home/Hero";
import { SponsorsCarousel } from "@/components/home/SponsorsCarousel";
import { FeaturedEvents } from "@/components/home/FeaturedEvents";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Home() {
  return (
    <PublicLayout>
      <Hero />
      <SponsorsCarousel />
      <FeaturedEvents />
    </PublicLayout>
  );
}
