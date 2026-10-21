import "server-only";

/**
 * Envoie un signal sur un canal temps réel Supabase (Broadcast), depuis le
 * serveur, par l'API REST. Best-effort et rapide : un signal perdu n'est
 * jamais grave (la page Suivi relit aussi l'état de temps en temps), il ne
 * doit donc jamais faire échouer ni ralentir une action de l'admin.
 */
export async function broadcast(channel: string, event: string, payload: Record<string, unknown> = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ topic: channel, event, payload }] }),
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) console.error("[realtime] signal non envoyé:", res.status);
  } catch (error) {
    console.error("[realtime] signal non envoyé:", error);
  }
}
