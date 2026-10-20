import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    // Pas de « /admin » ici : robots.txt est public, le citer revenait à
    // indiquer l'administration à n'importe qui (voir lib/admin/gate.ts).
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
