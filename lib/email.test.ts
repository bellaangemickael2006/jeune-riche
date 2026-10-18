import { test } from "node:test";
import assert from "node:assert/strict";
import { abandonedCartEmail, escapeHtml, signupConfirmationEmail } from "@/lib/email";

test("escapeHtml neutralise les caractères spéciaux", () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});

test("abandonedCartEmail n'insère jamais de HTML brut venant du panier", () => {
  const html = abandonedCartEmail({
    items: [{ productName: `<img src=x onerror="alert(1)">`, size: "M", color: "Noir", quantity: 1 }],
    total: 10000,
  });
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
});

test("signupConfirmationEmail échappe le prénom saisi par l'utilisateur", () => {
  const html = signupConfirmationEmail("https://example.test/confirm", `<script>x</script>`);
  assert.ok(!html.includes("<script>x</script>"));
  assert.ok(html.includes("&lt;script&gt;x&lt;/script&gt;"));
});
