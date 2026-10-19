import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_HOME_CONTENT, homeContentSchema, isAllowedImageUrl, parseHomeContent } from "./content";

// Lu à chaque appel par isAllowedImageUrl, pas à l'import.
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://projet.supabase.co";

const SITE_IMG = "https://projet.supabase.co/storage/v1/object/public/product-media/site/123-abc.jpg";

test("les valeurs d'origine sont valides", () => {
  assert.equal(homeContentSchema.safeParse(DEFAULT_HOME_CONTENT).success, true);
});

test("isAllowedImageUrl n'accepte que les images du site et celles envoyées depuis l'admin", () => {
  assert.equal(isAllowedImageUrl("/images/campagne/portant-atelier.jpg"), true);
  assert.equal(isAllowedImageUrl(SITE_IMG), true);
  assert.equal(isAllowedImageUrl("https://autre-site.com/photo.jpg"), false);
  assert.equal(isAllowedImageUrl("https://projet.supabase.co/storage/v1/object/public/product-media/reviews/x.jpg"), false);
  assert.equal(isAllowedImageUrl("/images/../secret"), false);
});

test("un lien de lookbook doit rester interne", () => {
  const withLink = (href: string) => {
    const c = structuredClone(DEFAULT_HOME_CONTENT);
    c.lookbook.items[0].href = href;
    return homeContentSchema.safeParse(c).success;
  };
  assert.equal(withLink(""), true);
  assert.equal(withLink("/catalogue/t-shirt-jeune-riche"), true);
  assert.equal(withLink("https://pirate.example"), false);
  assert.equal(withLink("//pirate.example"), false);
});

test("parseHomeContent retombe sur les valeurs d'origine si le fichier est abîmé", () => {
  assert.deepEqual(parseHomeContent({ hero: "cassé" }), DEFAULT_HOME_CONTENT);
  const custom = structuredClone(DEFAULT_HOME_CONTENT);
  custom.hero.url = SITE_IMG;
  custom.hero.overlay = 60;
  assert.deepEqual(parseHomeContent(custom), custom);
});
