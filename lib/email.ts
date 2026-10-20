import nodemailer from "nodemailer";
import { adminLink } from "@/lib/admin/gate";
import { siteUrl } from "@/lib/utils";

// Toute valeur variable insérée dans le HTML d'un email doit passer ici : les
// noms, tailles et couleurs viennent du navigateur ou de saisies utilisateur.
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getTransport() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transport = getTransport();
  if (!transport) {
    console.error("[email] SMTP non configuré (SMTP_USER/SMTP_PASSWORD manquants) — envoi ignoré.");
    return { sent: false };
  }

  const fromName = process.env.SMTP_FROM_NAME || "Jeune Riche";

  try {
    await transport.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error("[email] Échec de l'envoi :", error);
    return { sent: false };
  }
}

function emailShell(bodyHtml: string) {
  return `
  <div style="background:#0b0b0c;padding:40px 20px;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#141414;color:#f5f4f1;">
      <div style="padding:32px 32px 0;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Jeune Riche</p>
      </div>
      <div style="padding:24px 32px 32px;font-size:14px;line-height:1.6;color:#e5e4e1;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 32px;border-top:1px solid #262626;font-size:11px;color:#8a8a8a;text-align:center;">
        JEUNE RICHE
      </div>
    </div>
  </div>`;
}

export function newsletterWelcomeEmail() {
  const catalogueUrl = `${siteUrl()}/catalogue`;
  return emailShell(`
    <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#9a9a9a;margin:0 0 16px;">Bienvenue</p>
    <p style="margin:0 0 16px;">Vous êtes inscrit à la newsletter JEUNE RICHE.</p>
    <p style="margin:0 0 28px;color:#9a9a9a;">
      Vous serez prévenu en premier des prochains drops, des nouvelles pièces et des annonces de la marque —
      rien d'autre, pas de spam.
    </p>
    <a href="${catalogueUrl}" style="display:inline-block;background:#f5f4f1;color:#0b0b0c;text-decoration:none;padding:12px 24px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">
      Voir la collection
    </a>
  `);
}

export function passwordResetEmail(actionLink: string) {
  return emailShell(`
    <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#9a9a9a;margin:0 0 16px;">Réinitialisation</p>
    <p style="margin:0 0 16px;">Une demande de réinitialisation de mot de passe a été effectuée pour ce compte.</p>
    <p style="margin:0 0 28px;color:#9a9a9a;">
      Si vous êtes à l'origine de cette demande, cliquez ci-dessous pour choisir un nouveau mot de passe.
      Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
    </p>
    <a href="${escapeHtml(actionLink)}" style="display:inline-block;background:#f5f4f1;color:#0b0b0c;text-decoration:none;padding:12px 24px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">
      Réinitialiser mon mot de passe
    </a>
  `);
}

export function signupConfirmationEmail(actionLink: string, name?: string) {
  const greeting = name ? `Bienvenue ${escapeHtml(name)},` : "Bienvenue,";
  return emailShell(`
    <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#9a9a9a;margin:0 0 16px;">Confirmation d'inscription</p>
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 28px;color:#9a9a9a;">
      Merci de vous être inscrit sur JEUNE RICHE. Confirmez votre adresse email pour activer votre compte
      et accéder à vos commandes, votre liste d'envies et nos offres exclusives.
    </p>
    <a href="${escapeHtml(actionLink)}" style="display:inline-block;background:#f5f4f1;color:#0b0b0c;text-decoration:none;padding:12px 24px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">
      Confirmer mon compte
    </a>
    <p style="margin:28px 0 0;color:#6a6a6a;font-size:12px;">
      Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.
    </p>
  `);
}

export function restockEmail(params: { productName: string; size: string; color: string; productSlug: string }) {
  const productUrl = `${siteUrl()}/catalogue/${encodeURIComponent(params.productSlug)}`;
  return emailShell(`
    <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#9a9a9a;margin:0 0 16px;">De retour en stock</p>
    <p style="margin:0 0 16px;">
      <strong style="color:#f5f4f1;">${escapeHtml(params.productName)}</strong> (${escapeHtml(params.color)} · ${escapeHtml(params.size)}) est de nouveau disponible.
    </p>
    <p style="margin:0 0 28px;color:#9a9a9a;">
      Les stocks sont limités — commandez avant qu'il ne s'épuise à nouveau.
    </p>
    <a href="${productUrl}" style="display:inline-block;background:#f5f4f1;color:#0b0b0c;text-decoration:none;padding:12px 24px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">
      Voir le produit
    </a>
  `);
}

export function lowStockAlertEmail(params: {
  productName: string;
  color: string;
  size: string;
  remaining: number;
}) {
  return emailShell(`
    <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#9a9a9a;margin:0 0 16px;">Stock critique</p>
    <p style="margin:0 0 16px;">
      <strong style="color:#f5f4f1;">${escapeHtml(params.productName)}</strong> (${escapeHtml(params.color)} · ${escapeHtml(params.size)}) —
      il ne reste plus que <strong style="color:#f5f4f1;">${params.remaining}</strong> exemplaire${params.remaining > 1 ? "s" : ""}.
    </p>
    <p style="margin:0;color:#9a9a9a;">Pensez à réapprovisionner avant rupture totale.</p>
  `);
}

export function abandonedCartEmail(params: {
  items: { productName: string; size: string; color: string; quantity: number }[];
  total: number;
}) {
  const formatXof = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);

  const rows = params.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #262626;">
          ${escapeHtml(i.productName)} — ${escapeHtml(i.color)} / ${escapeHtml(i.size)} × ${Number(i.quantity)}
        </td>
      </tr>`
    )
    .join("");

  return emailShell(`
    <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#9a9a9a;margin:0 0 16px;">Vous avez oublié quelque chose</p>
    <p style="margin:0 0 16px;">Votre sélection vous attend toujours :</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin:0 0 20px;">
      ${rows}
    </table>
    <p style="margin:0 0 28px;color:#9a9a9a;">
      Total estimé : <strong style="color:#f5f4f1;">${formatXof(params.total)}</strong> (hors livraison).
      Les stocks sont limités — votre taille pourrait ne plus être disponible demain.
    </p>
    <a href="${siteUrl()}/panier" style="display:inline-block;background:#f5f4f1;color:#0b0b0c;text-decoration:none;padding:12px 24px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">
      Reprendre ma commande
    </a>
  `);
}

/**
 * Accès à l'administration donné à un membre de l'équipe. `actionLink` :
 * lien d'activation (nouveau compte, choix du mot de passe) ou page de
 * connexion (compte déjà existant).
 */
export function teamAccessEmail(params: { actionLink: string; isNewAccount: boolean; invitedBy: string; sections: string[] }) {
  const list = params.sections.map((s) => `<li style="margin:0 0 4px;">${escapeHtml(s)}</li>`).join("");
  return emailShell(`
    <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#9a9a9a;margin:0 0 16px;">Équipe JEUNE RICHE</p>
    <p style="margin:0 0 16px;">${escapeHtml(params.invitedBy)} vous donne accès à l'administration de la boutique.</p>
    <p style="margin:0 0 8px;color:#9a9a9a;">Vos accès :</p>
    <ul style="margin:0 0 24px;padding-left:18px;color:#e5e4e1;">${list}</ul>
    <p style="margin:0 0 28px;color:#9a9a9a;">
      ${
        params.isNewAccount
          ? "Cliquez ci-dessous pour activer votre accès et choisir votre mot de passe. Le lien est personnel et expire bientôt."
          : "Connectez-vous avec votre email et votre mot de passe habituels."
      }
    </p>
    <a href="${escapeHtml(params.actionLink)}" style="display:inline-block;background:#f5f4f1;color:#0b0b0c;text-decoration:none;padding:12px 24px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">
      ${params.isNewAccount ? "Activer mon accès" : "Ouvrir l'administration"}
    </a>
    <p style="margin:28px 0 0;color:#6a6a6a;font-size:12px;">Si vous ne connaissez pas cette boutique, ignorez simplement cet email.</p>
  `);
}

/** Prévient la boutique d'une nouvelle commande, avec tout pour la traiter tout de suite. */
export function newOrderAdminEmail(params: {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: { line1: string; city: string; postalCode?: string; country: string };
  items: { productName: string; color: string; size: string; quantity: number; unitPrice: number; personalization: string | null }[];
  discount: { code: string; amount: number } | null;
  total: number;
  whatsappUrl: string | null;
}) {
  const formatXof = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);
  const rows = params.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #262626;">
          ${escapeHtml(i.productName)} — ${escapeHtml(i.color)} / ${escapeHtml(i.size)} × ${Number(i.quantity)}
          ${i.personalization ? `<br><span style="color:#f5f4f1;">Personnalisation : « ${escapeHtml(i.personalization)} »</span>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #262626;text-align:right;white-space:nowrap;">
          ${formatXof(i.unitPrice * i.quantity)}
        </td>
      </tr>`
    )
    .join("");
  const a = params.address;
  const address = `${escapeHtml(a.line1)}, ${escapeHtml(a.city)}${a.postalCode ? ` ${escapeHtml(a.postalCode)}` : ""}, ${escapeHtml(a.country)}`;
  const button = (href: string, label: string, light: boolean) =>
    `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;${
      light ? "background:#f5f4f1;color:#0b0b0c;" : "border:1px solid #f5f4f1;color:#f5f4f1;"
    }text-decoration:none;padding:12px 20px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">${label}</a>`;

  return emailShell(`
    <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#9a9a9a;margin:0 0 16px;">Nouvelle commande</p>
    <p style="margin:0 0 4px;font-size:18px;color:#f5f4f1;"><strong>${escapeHtml(params.orderNumber)}</strong> — ${formatXof(params.total)}</p>
    <p style="margin:0 0 20px;color:#9a9a9a;">
      ${escapeHtml(params.customerName)} · ${escapeHtml(params.phone)}${params.customerEmail ? ` · ${escapeHtml(params.customerEmail)}` : ""}<br>
      ${address}
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin:0 0 12px;">${rows}</table>
    ${params.discount ? `<p style="margin:0 0 4px;color:#9a9a9a;">Code ${escapeHtml(params.discount.code)} : −${formatXof(params.discount.amount)}</p>` : ""}
    <p style="margin:0 0 24px;">Total : <strong style="color:#f5f4f1;">${formatXof(params.total)}</strong> (livraison à communiquer au client)</p>
    ${button(adminLink(siteUrl(), `/admin/commandes/${encodeURIComponent(params.orderId)}`), "Ouvrir la commande", true)}
    ${params.whatsappUrl ? button(params.whatsappUrl, "Confirmer au client sur WhatsApp", false) : ""}
  `);
}

export function campaignEmail(bodyText: string) {
  const paragraphs = bodyText
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p style="margin:0 0 14px;">${escapeHtml(line)}</p>`)
    .join("");
  return emailShell(paragraphs);
}
