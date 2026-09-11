import type { MetadataRoute } from "next";
import { getPublishedProducts } from "@/lib/data/products";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const products = await getPublishedProducts();

  const staticRoutes = ["", "/catalogue", "/atelier", "/manifeste", "/drops", "/a-propos", "/contact"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  const productRoutes = products.map((p) => ({
    url: `${base}/catalogue/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  return [...staticRoutes, ...productRoutes];
}
