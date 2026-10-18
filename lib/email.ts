import nodemailer from "nodemailer";
import { siteUrl } from "@/lib/utils";

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
    <a href="${actionLink}" style="display:inline-block;background:#f5f4f1;color:#0b0b0c;text-decoration:none;padding:12px 24px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">
      Réinitialiser mon mot de passe
    </a>
  `);
}

export function signupConfirmationEmail(actionLink: string, name?: string) {
  const greeting = name ? `Bienvenue ${name},` : "Bienvenue,";
  return emailShell(`
    <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#9a9a9a;margin:0 0 16px;">Confirmation d'inscription</p>
    <p style="margin:0 0 16px;">${greeting}</p>
    <p style="margin:0 0 28px;color:#9a9a9a;">
      Merci de vous être inscrit sur JEUNE RICHE. Confirmez votre adresse email pour activer votre compte
      et accéder à vos commandes, votre liste d'envies et nos offres exclusives.
    </p>
    <a href="${actionLink}" style="display:inline-block;background:#f5f4f1;color:#0b0b0c;text-decoration:none;padding:12px 24px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">
      Confirmer mon compte
    </a>
    <p style="margin:28px 0 0;color:#6a6a6a;font-size:12px;">
      Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.
    </p>
  `);
}

export function restockEmail(params: { productName: string; size: string; color: string; productSlug: string }) {
  const productUrl = `${siteUrl()}/catalogue/${params.productSlug}`;
  return emailShell(`
    <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#9a9a9a;margin:0 0 16px;">De retour en stock</p>
    <p style="margin:0 0 16px;">
      <strong style="color:#f5f4f1;">${params.productName}</strong> (${params.color} · ${params.size}) est de nouveau disponible.
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
      <strong style="color:#f5f4f1;">${params.productName}</strong> (${params.color} · ${params.size}) —
      il ne reste plus que <strong style="color:#f5f4f1;">${params.remaining}</strong> exemplaire${params.remaining > 1 ? "s" : ""}.
    </p>
    <p style="margin:0;color:#9a9a9a;">Pensez à réapprovisionner avant rupture totale.</p>
  `);
}

// Les champs du panier viennent du navigateur (cart snapshot) : ils doivent
// être échappés avant d'être insérés dans le HTML de l'email.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

export function campaignEmail(bodyText: string) {
  const paragraphs = bodyText
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p style="margin:0 0 14px;">${line}</p>`)
    .join("");
  return emailShell(paragraphs);
}
