import { test } from "node:test";
import assert from "node:assert/strict";
import { abandonedCartEmail, escapeHtml, newOrderAdminEmail, signupConfirmationEmail } from "@/lib/email";

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

test("newOrderAdminEmail neutralise les saisies du client", () => {
  const html = newOrderAdminEmail({
    orderNumber: "JR-ABC",
    orderId: "cl1",
    customerName: "<script>x</script>",
    customerEmail: "",
    phone: "0700000000",
    address: { line1: "Rue <b>1</b>", city: "Abidjan", country: "CI" },
    items: [{ productName: "T-shirt", color: "Noir", size: "M", quantity: 2, unitPrice: 15000, personalization: '"><img src=x>' }],
    discount: null,
    total: 30000,
    whatsappUrl: null,
  });
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img src=x>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("/admin/commandes/cl1"));
  assert.ok(!html.includes("Confirmer au client"));
});
