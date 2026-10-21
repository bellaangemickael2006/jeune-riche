// Thème clair/sombre. Par défaut, le site suit le réglage de l'appareil
// (prefers-color-scheme), en direct : un téléphone qui passe en sombre le
// soir fait passer le site en sombre aussitôt. Le bouton soleil/lune force
// l'autre thème ; revenir au thème de l'appareil efface ce choix et le
// suivi automatique reprend.
//
// Nouvelle clé : l'ancienne (« theme ») mémorisait le moindre clic pour
// toujours ; tout le monde repart sur le thème de son appareil.

export const THEME_STORAGE_KEY = "jr-theme-choice";
export const THEME_CHANGE_EVENT = "jr-theme-change";
export type Theme = "light" | "dark";

/** Choix mémorisé s'il existe, sinon le thème de l'appareil. */
export function resolveTheme(stored: string | null, systemPrefersLight: boolean): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return systemPrefersLight ? "light" : "dark";
}

/**
 * Script en ligne de app/layout.tsx, exécuté avant le premier affichage
 * (sans flash) puis à chaque changement de thème de l'appareil. Écrit en
 * texte, en JavaScript simple : convertir une fonction compilée en texte
 * embarquerait les aides du compilateur (testé dans lib/theme.test.ts, qui
 * exécute exactement ce texte).
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var key=${JSON.stringify(THEME_STORAGE_KEY)},evt=${JSON.stringify(THEME_CHANGE_EVENT)};
var root=document.documentElement,media=window.matchMedia("(prefers-color-scheme: light)");
function apply(){var c=null;try{c=localStorage.getItem(key)}catch(e){}
var light=c==="light"||(c!=="dark"&&media.matches);
if(light)root.setAttribute("data-theme","light");else root.removeAttribute("data-theme");
window.dispatchEvent(new Event(evt))}
apply();media.addEventListener("change",apply);
}catch(e){}})();`;
