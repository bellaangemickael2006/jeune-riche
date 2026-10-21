// Politique de confidentialité — décrit ce que le site fait réellement
// (voir le code : comptes Google via Supabase, commandes, newsletter,
// rappels de panier avec accord, avis, cookies). À mettre à jour à chaque
// nouveau service ou nouvelle donnée collectée.
//
// Français (version de référence) et anglais (autres langues, et lecture
// par les équipes de Google lors de la validation de la marque).

export type LegalSection = { title: string; paragraphs: string[]; items?: string[] };
export type LegalDocument = { title: string; updated: string; intro: string; sections: LegalSection[] };

export function privacyPolicy(lang: "fr" | "en", contact: { email: string | null; whatsapp: string }): LegalDocument {
  const reach =
    lang === "fr"
      ? contact.email
        ? `par email à ${contact.email} ou sur WhatsApp au +${contact.whatsapp}`
        : `sur WhatsApp au +${contact.whatsapp}`
      : contact.email
        ? `by email at ${contact.email} or on WhatsApp at +${contact.whatsapp}`
        : `on WhatsApp at +${contact.whatsapp}`;

  if (lang === "en") {
    return {
      title: "Privacy policy",
      updated: "Last updated: October 21, 2026",
      intro:
        "This policy explains what personal data JEUNE RICHE (streetwear brand based in Abidjan, Côte d'Ivoire) collects on jeune-riche.vercel.app, why, and what your rights are. The French version is the reference version.",
      sections: [
        {
          title: "1. Who is responsible",
          paragraphs: [`JEUNE RICHE, Abidjan, Côte d'Ivoire. You can reach us ${reach}.`],
        },
        {
          title: "2. Data we collect",
          paragraphs: ["We only collect what is needed to run the shop:"],
          items: [
            "Account: when you sign in with Google, your name, email address and Google account identifier. Google never shares your password with us.",
            "Orders: your name, email, phone (WhatsApp), delivery address, the items ordered and the amounts.",
            "Newsletter and drop announcements: your email address, only if you sign up.",
            "Cart reminder: your email and cart contents, only if you tick the box at checkout.",
            "Reviews: your rating, comment and optional photos, published with your name.",
            "Wishlist and back-in-stock alerts: the items you chose and, for alerts, your email.",
            "Technical data: IP address and browser information, used briefly to protect the site against abuse (limits on repeated attempts) and to detect errors.",
          ],
        },
        {
          title: "3. Why we use it",
          paragraphs: [
            "To create and manage your account, process and deliver your orders, let you track an order, answer your questions, send the emails you asked for (order updates, newsletter, drop announcements, cart reminder) and keep the site secure.",
            "We never sell your data. We do not use advertising or tracking cookies.",
          ],
        },
        {
          title: "4. Payments",
          paragraphs: ["The site does not take online payments: we never receive your bank card details."],
        },
        {
          title: "5. Service providers",
          paragraphs: ["Your data is processed for us by the following providers, only to run the site:"],
          items: [
            "Supabase: database, sign-in and photo storage (servers in the United States).",
            "Vercel: website hosting (United States).",
            "Google: sign-in with your Google account.",
            "Upstash: short-lived counters that protect against abuse.",
            "Our email provider: sending order, newsletter and reminder emails.",
            "Sentry: technical error reports, if enabled.",
          ],
        },
        {
          title: "6. Cookies and local storage",
          paragraphs: [
            "We only use what the site needs to work: a sign-in cookie (to keep you signed in), a language cookie, and your browser's local storage for your cart, theme (light/dark) and recently viewed items. No advertising cookies.",
          ],
        },
        {
          title: "7. How long we keep it",
          paragraphs: [
            "Account data: as long as your account exists. Orders: as long as required by our accounting and legal obligations. Newsletter: until you unsubscribe (link in every email). Cart reminder: until you order or unsubscribe. Security counters: a few minutes to a few hours.",
          ],
        },
        {
          title: "8. Your rights",
          paragraphs: [
            `Under Ivorian law no. 2013-450 of 19 June 2013 on personal data protection, you can access, correct or delete your data, and object to its use. Contact us ${reach}. You can also file a complaint with the ARTCI (Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire).`,
          ],
        },
        {
          title: "9. Changes",
          paragraphs: ["We will update this page if our practices change, with the date of the last update at the top."],
        },
      ],
    };
  }

  return {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : 21 octobre 2026",
    intro:
      "Cette page explique quelles données personnelles JEUNE RICHE (marque de streetwear basée à Abidjan, Côte d'Ivoire) collecte sur jeune-riche.vercel.app, pourquoi, et quels sont vos droits.",
    sections: [
      {
        title: "1. Responsable",
        paragraphs: [`JEUNE RICHE, Abidjan, Côte d'Ivoire. Vous pouvez nous joindre ${reach}.`],
      },
      {
        title: "2. Données collectées",
        paragraphs: ["Nous ne collectons que ce qui est nécessaire au fonctionnement de la boutique :"],
        items: [
          "Compte : lorsque vous vous connectez avec Google, votre nom, votre adresse email et l'identifiant de votre compte Google. Google ne nous communique jamais votre mot de passe.",
          "Commandes : vos nom, email, téléphone (WhatsApp), adresse de livraison, les articles commandés et les montants.",
          "Newsletter et annonces de drops : votre adresse email, uniquement si vous vous inscrivez.",
          "Rappel de panier : votre email et le contenu de votre panier, uniquement si vous cochez la case au moment de commander.",
          "Avis : votre note, votre commentaire et vos photos éventuelles, publiés avec votre nom.",
          "Favoris et alertes de retour en stock : les articles choisis et, pour les alertes, votre email.",
          "Données techniques : adresse IP et informations du navigateur, utilisées brièvement pour protéger le site contre les abus (limitation des tentatives répétées) et détecter les erreurs.",
        ],
      },
      {
        title: "3. Pourquoi nous les utilisons",
        paragraphs: [
          "Pour créer et gérer votre compte, traiter et livrer vos commandes, vous permettre de suivre une commande, répondre à vos questions, envoyer les emails que vous avez demandés (suivi de commande, newsletter, annonces de drops, rappel de panier) et assurer la sécurité du site.",
          "Nous ne vendons jamais vos données. Nous n'utilisons aucun cookie publicitaire ni de pistage.",
        ],
      },
      {
        title: "4. Paiement",
        paragraphs: ["Le site ne prend aucun paiement en ligne : nous ne recevons jamais vos coordonnées bancaires."],
      },
      {
        title: "5. Prestataires",
        paragraphs: ["Vos données sont traitées pour notre compte par les prestataires suivants, uniquement pour faire fonctionner le site :"],
        items: [
          "Supabase : base de données, connexion et stockage des photos (serveurs aux États-Unis).",
          "Vercel : hébergement du site (États-Unis).",
          "Google : connexion avec votre compte Google.",
          "Upstash : compteurs temporaires de protection contre les abus.",
          "Notre prestataire d'envoi d'emails : emails de commande, newsletter et rappels.",
          "Sentry : rapports d'erreurs techniques, s'il est activé.",
        ],
      },
      {
        title: "6. Cookies et stockage local",
        paragraphs: [
          "Nous n'utilisons que ce dont le site a besoin pour fonctionner : un cookie de connexion (pour rester connecté), un cookie de langue, et le stockage local de votre navigateur pour votre panier, le thème (clair/sombre) et les articles récemment consultés. Aucun cookie publicitaire.",
        ],
      },
      {
        title: "7. Durée de conservation",
        paragraphs: [
          "Compte : tant que votre compte existe. Commandes : aussi longtemps que l'exigent nos obligations comptables et légales. Newsletter : jusqu'à votre désinscription (lien dans chaque email). Rappel de panier : jusqu'à votre commande ou votre désinscription. Compteurs de sécurité : de quelques minutes à quelques heures.",
        ],
      },
      {
        title: "8. Vos droits",
        paragraphs: [
          `Conformément à la loi ivoirienne n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel, vous pouvez accéder à vos données, les faire corriger ou supprimer, et vous opposer à leur utilisation. Écrivez-nous ${reach}. Vous pouvez aussi saisir l'ARTCI (Autorité de Régulation des Télécommunications/TIC de Côte d'Ivoire).`,
        ],
      },
      {
        title: "9. Modifications",
        paragraphs: ["Nous mettrons cette page à jour si nos pratiques changent, avec la date de dernière mise à jour en haut de page."],
      },
    ],
  };
}
