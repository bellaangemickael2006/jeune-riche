import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // jeune-riche-v2 / v3 sont des refontes exploratoires posées dans le
    // dossier du projet : elles ont leur propre stack et leurs propres alias.
    // Sans cette exclusion, `eslint .` et `tsc` les analysent avec la config
    // d'ici et le build de production échoue (voir aussi tsconfig.json).
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "scripts/**",
      "jeune-riche-v2/**", "jeune-riche-v3/**"],
  },
];

export default eslintConfig;
