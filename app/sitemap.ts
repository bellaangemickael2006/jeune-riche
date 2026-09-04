import type { MetadataRoute } from "next";
import { getPublishedProducts } from "@/lib/data/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const products = await getPublishedProducts();

  const staticRoutes = ["", "/catalogue", "/manifeste"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  const productRoutes = products.map((p) => ({
    url: `${base}/catalogue/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  return [...staticRoutes, ...productRoutes];
}
