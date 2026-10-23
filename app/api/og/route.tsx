import { readFileSync } from "node:fs";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import path from "node:path";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { PERSONALIZATION_OVERLAY_BY_IMAGE } from "@/lib/data/personalizationOverlay";
import { sanitizePersonalization, siteUrl } from "@/lib/utils";

// Image d'aperçu générée à la volée pour les liens de l'atelier.
//
// Pourquoi une route et pas un opengraph-image.tsx : les fichiers d'image de
// métadonnées ne reçoivent que les segments dynamiques de l'URL, jamais les
// paramètres de requête. Or les liens déjà partagés ont la forme
// /atelier?nom=KOFI — les casser pour passer à /atelier/KOFI invaliderait
// tout ce qui circule déjà sur WhatsApp. La page lit donc `nom` dans son
// generateMetadata et pointe openGraph.images ici.
//
// Ce que ça change : quand quelqu'un partage son lien, le destinataire ne
// voit plus une vignette générique mais la pièce portant le prénom. Chaque
// partage devient une annonce nominative.

export const runtime = "nodejs";
// L'image ne dépend que du prénom : deux personnes qui tapent le même nom
// obtiennent le même rendu. Un cache long évite de régénérer à chaque fois
// qu'un robot d'aperçu repasse sur le lien.
export const revalidate = 86400;

const LARGEUR = 1200;
const HAUTEUR = 630;

// La pièce de référence : c'est la seule photo dont la position d'impression
// a été mesurée sur un exemple réellement personnalisé fourni par la marque.
const PIECE = "/images/products/tshirt-blanc/front-1-neutral.jpg";

// Les polices sont embarquées dans le dépôt plutôt que récupérées chez
// Google au moment de la requête. Trois raisons, apprises à la dure :
//  — l'API Google Fonts ne sert plus de TTF, quel que soit le User-Agent
//    annoncé : elle renvoie du WOFF ou du WOFF2, deux formats que Satori
//    refuse ("Unsupported OpenType signature wOF2") ;
//  — un appel réseau par génération d'image ajoute de la latence et un point
//    de panne sur un chemin que seuls des robots d'aperçu empruntent ;
//  — le rendu devient déterministe : la même URL produit toujours la même
//    image, même si Google change son service.
// Anton et Inter sont sous licence SIL Open Font, donc redistribuables.
// next.config.ts les force dans le bundle serveur (outputFileTracingIncludes).
const DOSSIER_POLICES = path.join(process.cwd(), "app/api/og/fonts");

function litPolice(fichier: string): Buffer | null {
  try {
    return readFileSync(path.join(DOSSIER_POLICES, fichier));
  } catch {
    return null;
  }
}

// Anton seule. Inter a été essayée puis abandonnée : Google Fonts ne
// distribue plus que des fichiers variables, et fontkit — utilisé par Satori
// — plante dessus ("Cannot read properties of undefined"). Une carte d'une
// seule police est de toute façon plus juste ici : Anton est la police
// réellement imprimée sur les vêtements.
const ANTON = litPolice("Anton-Regular.ttf");

export async function GET(req: NextRequest) {
  // Chaque prénom inédit coûte un rendu d'image : bornage par adresse IP
  // (large : les robots de WhatsApp partagent quelques adresses ; les
  // vignettes déjà générées restent servies par le cache).
  if (!(await rateLimit(`og:${clientIp(req)}`, 120, 60_000))) {
    return new Response("Trop de requêtes.", { status: 429 });
  }
  const brut = req.nextUrl.searchParams.get("nom") ?? "";
  // Même nettoyage que la saisie clavier et que le rendu serveur de la page :
  // une URL fabriquée à la main ne doit pas pouvoir injecter autre chose que
  // des lettres, des chiffres, des espaces, des tirets et des soulignés.
  const nom = sanitizePersonalization(brut, 16).trim().toUpperCase();

  const cote = PERSONALIZATION_OVERLAY_BY_IMAGE[PIECE];
  const base = siteUrl();

  // Boîte de la photo : on conserve exactement le ratio du fichier source,
  // sinon les pourcentages de calibrage ne tombent plus au bon endroit.
  const boiteL = 596;
  const boiteH = Math.round(boiteL / cote.aspectRatio);

  // Le prénom est rendu deux fois, et c'est volontaire :
  //  — sur le vêtement, à la cote réelle, donc petit et fidèle ;
  //  — en grand à droite, pour rester lisible en vignette WhatsApp, où la
  //    carte est affichée à trois cents pixels de large.
  // Largeur moyenne d'un caractère d'Anton, rapportée à la taille de police.
  // Satori ne sait pas mesurer un texte avant de le rendre : sans cette
  // approximation, un nom long déborde du cadre ou chevauche le blason.
  const RATIO_ANTON = 0.48;

  // Sur la pièce : même bridage que le composant du site. Au-delà de
  // maxWidthPct, le texte est réduit pour ne jamais toucher le blason.
  const tailleNominale = (cote.fontSizePct / 100) * boiteH;
  const largeurMax = (cote.maxWidthPct / 100) * boiteL;
  const largeurNaturelle = Math.max(1, nom.length) * tailleNominale * RATIO_ANTON;
  const tailleSurPiece = Math.round(
    largeurNaturelle > largeurMax
      ? tailleNominale * (largeurMax / largeurNaturelle)
      : tailleNominale
  );

  // À droite : le nom doit tenir sur une seule ligne. Une lettre orpheline
  // renvoyée à la ligne suivante ruine la carte en vignette.
  const LARGEUR_PANNEAU = LARGEUR - 640 - 52 * 2;
  const tailleAuGrand = Math.min(
    104,
    Math.floor(LARGEUR_PANNEAU / (Math.max(1, nom.length) * RATIO_ANTON))
  );

  // Satori exige au moins une police : sans Anton, on sert l'image de
  // partage statique du site plutôt que de renvoyer une erreur — la carte
  // perd le prénom, mais le lien garde un aperçu.
  if (!ANTON) {
    return Response.redirect(`${base}/images/campagne/porte-dos-ciel.jpg`, 302);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: LARGEUR,
          height: HAUTEUR,
          display: "flex",
          background: "#0B0B0C",
          fontFamily: "Anton",
        }}
      >
        {/* La pièce, sur son fond studio */}
        <div
          style={{
            width: 640,
            height: HAUTEUR,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#E8E4DC",
          }}
        >
          <div style={{ position: "relative", display: "flex", width: boiteL, height: boiteH }}>
            {/* Satori ne connaît que la balise <img> : next/image y est
                inopérant, et l'avertissement sur le LCP n'a pas de sens pour
                une image qui n'est jamais rendue dans un navigateur. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${base}${PIECE}`} width={boiteL} height={boiteH} alt="" />
            {nom ? (
              <div
                style={{
                  position: "absolute",
                  left: `${cote.xPct}%`,
                  top: `${cote.yPct}%`,
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  fontSize: tailleSurPiece,
                  color: cote.color,
                  letterSpacing: 0.5,
                  whiteSpace: "nowrap",
                }}
              >
                {nom}
              </div>
            ) : null}
          </div>
        </div>

        {/* Le nom en grand, pour la lisibilité en vignette */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 52px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 17,
              letterSpacing: 5,
              color: "#8B8884",
                          }}
          >
            ATELIER — JEUNE RICHE
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: tailleAuGrand,
              lineHeight: 1,
              color: "#F6F3EE",
              letterSpacing: 1,
              whiteSpace: "nowrap",
            }}
          >
            {nom || "TON NOM"}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 22,
              width: 64,
              height: 2,
              background: "#C2A36B",
            }}
          />

          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 22,
              letterSpacing: 1.5,
              color: "#B9B5AD",
                            lineHeight: 1.35,
            }}
          >
            {nom ? "À L'ENDROIT EXACT DE L'IMPRESSION" : "ÉCRIS TON NOM SUR LA PIÈCE"}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 30,
              fontSize: 19,
              letterSpacing: 1,
              color: "#6E6B67",
                          }}
          >
            jeune-riche.vercel.app
          </div>
        </div>
      </div>
    ),
    {
      width: LARGEUR,
      height: HAUTEUR,
      fonts: [
        { name: "Anton", data: ANTON, style: "normal" as const, weight: 400 as const },
      ],
    }
  );
}
