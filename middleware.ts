import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupportedLanguage, resolveAcceptLanguage } from "@/lib/i18n/languages";
import { LANGUAGE_COOKIE } from "@/lib/i18n/config";

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

// Rafraîchit la session Supabase à chaque requête (nécessaire pour @supabase/ssr).
// N'agit que si les variables d'environnement Supabase sont présentes.
export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATHNAME_HEADER, request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const detectedLanguage = detectLanguageCookie(request);

  // Les pages admin doivent être bloquées AVANT tout rendu : le contrôle du
  // layout (requireAdmin) s'exécute en parallèle de la page, qui avait déjà
  // lu la base et envoyé son contenu (commandes, clients…) au moment où la
  // redirection vers la connexion arrivait.
  const { pathname } = request.nextUrl;
  // /admin/activer : un nouvel employé n'est pas encore connecté quand il
  // ouvre son lien d'invitation (voir lib/actions/team.ts).
  const isProtectedAdmin =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/activer");
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
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|mp4|webp)$).*)"],
};
