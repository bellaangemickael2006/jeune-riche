// Double vérification de l'administration (code à 6 chiffres d'une
// application comme Google Authenticator, en plus du mot de passe).
//
// Pourquoi obligatoire : la connexion par mot de passe de Supabase peut être
// appelée directement, sans passer par la page de connexion de l'admin ni son
// frein anti-essais (vérifié : 40 essais en quelques secondes, aucun
// blocage). Avec la double vérification, un mot de passe deviné ne suffit
// plus : il faut aussi le téléphone de l'administrateur.
//
// Interrupteur de secours : ADMIN_MFA=off sur Vercel la désactive (par
// exemple si l'option TOTP était coupée dans Supabase). À ne jamais laisser.

export type AdminMfaStage = "ok" | "verify" | "enroll";

export function isAdminMfaDisabled(): boolean {
  return process.env.ADMIN_MFA?.trim().toLowerCase() === "off";
}

/**
 * aal2 = code saisi pendant cette session. Sinon : code à saisir si un
 * appareil est enregistré, enregistrement d'abord s'il n'y en a aucun.
 */
export function adminMfaStage(currentLevel: string | null, verifiedTotpFactors: number): AdminMfaStage {
  if (currentLevel === "aal2") return "ok";
  return verifiedTotpFactors > 0 ? "verify" : "enroll";
}
