import { redirect } from "next/navigation";
import { getAdminMfaStage, getAdminPasswordSession } from "@/lib/auth";
import MfaEnroll from "@/components/admin/MfaEnroll";

export const dynamic = "force-dynamic";

// Enregistrement obligatoire d'un téléphone pour la double vérification
// (voir lib/admin/mfa.ts). Accessible avec le seul mot de passe : c'est
// justement l'étape qui manque.
export default async function AdminSecurityPage() {
  await getAdminPasswordSession();
  const stage = await getAdminMfaStage();
  if (stage === "ok") redirect("/admin");
  if (stage === "verify") redirect("/admin/verification");
  return <MfaEnroll />;
}
