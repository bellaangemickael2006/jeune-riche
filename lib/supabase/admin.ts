import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client à privilège élevé (clé service_role) — jamais importé côté client.
// Utilisé uniquement pour les opérations serveur qui doivent contourner les
// policies RLS : upload dans Supabase Storage depuis les server actions admin.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Configuration Supabase manquante (URL ou clé service_role).");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
