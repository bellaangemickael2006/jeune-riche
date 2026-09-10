import type { MetadataRoute } from "next";

// Next sert ce fichier à /manifest.webmanifest et ajoute lui-même le
// <link rel="manifest"> correspondant dans <head> — rien à faire côté layout.
// Description en français fixe (comme les messages WhatsApp de commande) :
// le marché visé est francophone, et une traduction par locale ajouterait de
// la complexité pour un texte que l'utilisateur ne voit qu'une fois, à
// l'installation.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JEUNE RICHE",
    short_name: "JEUNE RICHE",
    description: "JEUNE RICHE — luxe streetwear, identité tribale.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0B0B0C",
    theme_color: "#0B0B0C",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
