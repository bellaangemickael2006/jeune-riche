import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupportedLanguage, resolveAcceptLanguage } from "@/lib/i18n/languages";
import { LANGUAGE_COOKIE } from "@/lib/i18n/config";
import {
  ADMIN_GATE_COOKIE,
  ADMIN_GATE_MAX_AGE,
  adminEntryKey,
  adminNext,
  gateCookieValue,
  safeEqual,
} from "@/lib/admin/gate";
import { buildCsp, makeNonce } from "@/lib/security/csp";

// Langue à poser sur la réponse si absente — calculée une fois en haut de la
// fonction, mais appliquée tout en bas (voir la fin de la fonction) : le bloc
// Supabase ci-dessous réassigne parfois `response` à un NOUVEL objet (sur
// rafraîchissement de token), ce qui écraserait silencieusement un cookie
// posé plus tôt sur l'ancien objet.
function detectLanguageCookie(request: NextRequest): string | null {
  const existing = request.cookies.get(LANGUAGE_COOKIE)?.value;
  if (existing && isSupportedLanguage(existing)) return null; // déjà présent, jamais écrasé
  return resolveAcceptLanguage(request.headers.get("accept-language"));
}

// Transmis aux Server Components (voir lib/i18n/server.ts) pour que le layout
// racine sache s'il rend une page admin : l'admin n'a ni traduction ni layout
// pensé pour le RTL, donc <html lang/dir> doit y rester fr/ltr quel que soit
// le cookie de langue du visiteur (ex. testé en arabe juste avant).
const PATHNAME_HEADER = "x-pathname";

// Page admin cachée (servie en 404 par les réécritures de next.config.ts) :
// marquée pour les Server Components, par un en-tête de requête jamais
// renvoyé au navigateur — défense en profondeur dans lib/auth.ts.
const ADMIN_HIDDEN_HEADER = "x-jr-admin-hidden";
const HIDDEN_PATH = "/introuvable";

// Rafraîchit la session Supabase à chaque requête (nécessaire pour @supabase/ssr).
// N'agit que si les variables d'environnement Supabase sont présentes.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Porte secrète de l'admin (voir lib/admin/gate.ts). Passer par
  // /<ADMIN_ENTRY_KEY> dépose le cookie signé puis ouvre l'admin ; sans ce
  // cookie, /admin et tout ce qu'il contient répondent exactement comme une
  // adresse qui n'existe pas — rien n'indique qu'une administration existe.
  const gateKey = adminEntryKey();
  let hidden = false;
  if (gateKey) {
    if (pathname === `/${gateKey}`) {
      const target = request.nextUrl.clone();
      const [nextPath, nextQuery = ""] = adminNext(request.nextUrl.searchParams.get("next")).split("?");
      target.pathname = nextPath;
      target.search = nextQuery ? `?${nextQuery}` : "";
      const entry = NextResponse.redirect(target);
      entry.cookies.set(ADMIN_GATE_COOKIE, gateCookieValue(gateKey), {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: ADMIN_GATE_MAX_AGE,
      });
      entry.headers.set("X-Robots-Tag", "noindex, nofollow");
      // L'adresse secrète ne doit jamais partir dans l'en-tête Referer.
      entry.headers.set("Referrer-Policy", "no-referrer");
      return entry;
    }
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      const cookie = request.cookies.get(ADMIN_GATE_COOKIE)?.value ?? "";
      // Même règle que les réécritures de next.config.ts, qui servent le 404.
      hidden = !safeEqual(cookie, gateCookieValue(gateKey));
    }
  }

  const requestHeaders = new Headers(request.headers);
  // Page cachée : traitée de bout en bout comme une adresse inexistante
  // (même 404, même langue, mêmes cookies), jamais comme une page admin.
  // L'en-tête est toujours retiré d'abord : impossible de le forger.
  requestHeaders.delete(ADMIN_HIDDEN_HEADER);
  if (hidden) requestHeaders.set(ADMIN_HIDDEN_HEADER, "1");
  requestHeaders.set(PATHNAME_HEADER, hidden ? HIDDEN_PATH : pathname);

  // CSP à jeton unique (voir lib/security/csp.ts). Next.js lit le nonce dans
  // l'en-tête de requête pour l'ajouter à ses propres scripts ; le layout le
  // lit via x-nonce pour le script du thème.
  const nonce = makeNonce();
  const csp = buildCsp(nonce, {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    dev: process.env.NODE_ENV === "development",
  });
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const passThrough = () => {
    const next = NextResponse.next({ request: { headers: requestHeaders } });
    next.headers.set("Content-Security-Policy", csp);
    return next;
  };

  let response = passThrough();
  const detectedLanguage = detectLanguageCookie(request);

  // Les pages admin doivent être bloquées AVANT tout rendu : le contrôle du
  // layout (requireAdmin) s'exécute en parallèle de la page, qui avait déjà
  // lu la base et envoyé son contenu (commandes, clients…) au moment où la
  // redirection vers la connexion arrivait.
  // /admin/activer : un nouvel employé n'est pas encore connecté quand il
  // ouvre son lien d'invitation (voir lib/actions/team.ts).
  const isProtectedAdmin =
    !hidden &&
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login") &&
    !pathname.startsWith("/admin/activer");
  const toLogin = (query = "") => {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = query;
    return url;
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isProtectedAdmin) return NextResponse.redirect(toLogin("?erreur=config_manquante"));
    if (detectedLanguage) {
      response.cookies.set(LANGUAGE_COOKIE, detectedLanguage, { path: "/", maxAge: 31536000, sameSite: "lax" });
    }
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = passThrough();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims vérifie le jeton de session sur place (clé publique du projet)
  // au lieu d'interroger le serveur Supabase à chaque page comme getUser :
  // un aller-retour réseau en moins par visite d'un client connecté. Le
  // jeton est toujours rafraîchi quand il expire.
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims ?? null;

  if (isProtectedAdmin && !user) {
    const redirect = NextResponse.redirect(toLogin());
    // Garde les cookies de session éventuellement rafraîchis ci-dessus.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (detectedLanguage) {
    response.cookies.set(LANGUAGE_COOKIE, detectedLanguage, { path: "/", maxAge: 31536000, sameSite: "lax" });
  }

  return response;
}

// Les préchargements de liens (next/link) ne passent pas par le proxy : ce
// ne sont pas des pages affichées (pas de CSP à poser) et la session sera
// rafraîchie à la vraie visite. Chaque lien visible à l'écran déclenchait
// sinon un passage complet, vérification de session comprise.
export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|mp4|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
