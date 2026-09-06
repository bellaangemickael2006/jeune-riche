import nodemailer from "nodemailer";

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
  return emailShell(`
    <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#c81e2b;margin:0 0 16px;">Bienvenue</p>
    <p style="margin:0 0 16px;">Vous êtes inscrit à la newsletter JEUNE RICHE.</p>
    <p style="margin:0;color:#9a9a9a;">Vous recevrez ici les prochains drops et nouveautés de la marque.</p>
  `);
}

export function orderConfirmationEmail(params: {
  orderNumber: string;
  customerName: string;
  items: { productName: string; size: string; color: string; quantity: number; unitPrice: number; personalization: string | null }[];
  total: number;
}) {
  const formatXof = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);

  const rows = params.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #262626;">
          ${i.productName} — ${i.color} / ${i.size} × ${i.quantity}
          ${i.personalization ? `<br/><span style="color:#9a9a9a;">Personnalisation : ${i.personalization}</span>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #262626;text-align:right;white-space:nowrap;">
          ${formatXof(i.unitPrice * i.quantity)}
        </td>
      </tr>`
    )
    .join("");

  return emailShell(`
    <p style="text-transform:uppercase;letter-spacing:0.1em;font-size:11px;color:#c81e2b;margin:0 0 16px;">Commande enregistrée</p>
    <p style="margin:0 0 8px;">Bonjour ${params.customerName},</p>
    <p style="margin:0 0 20px;color:#9a9a9a;">
      Votre commande <strong style="color:#f5f4f1;">${params.orderNumber}</strong> a bien été enregistrée.
      Notre équipe vous recontactera pour finaliser le règlement et l'expédition.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${rows}
      <tr>
        <td style="padding:12px 0 0;font-weight:700;">Total</td>
        <td style="padding:12px 0 0;text-align:right;font-weight:700;">${formatXof(params.total)}</td>
      </tr>
    </table>
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
