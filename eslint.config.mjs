import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    // Règle ajoutée par eslint-config-next 16 (préparation au React
    // Compiler, non activé ici). Le site lit volontairement des valeurs
    // propres au navigateur (thème, langue, panier, localStorage) juste
    // après le montage, pour un rendu serveur et client identiques : un
    // avertissement suffit, à revoir si le React Compiler est activé.
    rules: { "react-hooks/set-state-in-effect": "warn" },
  },
  {
    // jeune-riche-v2 / v3 sont des refontes exploratoires posées dans le
    // dossier du projet : elles ont leur propre stack et leurs propres alias.
    // Sans cette exclusion, `eslint .` et `tsc` les analysent avec la config
    // d'ici et le build de production échoue (voir aussi tsconfig.json).
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "scripts/**",
      "jeune-riche-v2/**", "jeune-riche-v3/**", "lib/generated/**"],
  },
];

export default eslintConfig;
