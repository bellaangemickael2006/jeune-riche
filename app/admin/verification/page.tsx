import { redirect } from "next/navigation";
import { getAdminMfaStage, getAdminPasswordSession } from "@/lib/auth";
import MfaVerify from "@/components/admin/MfaVerify";

export const dynamic = "force-dynamic";

// Saisie du code à 6 chiffres après le mot de passe (voir lib/admin/mfa.ts).
export default async function AdminVerificationPage() {
  await getAdminPasswordSession();
  const stage = await getAdminMfaStage();
  if (stage === "ok") redirect("/admin");
  if (stage === "enroll") redirect("/admin/securite");
  return <MfaVerify />;
}
