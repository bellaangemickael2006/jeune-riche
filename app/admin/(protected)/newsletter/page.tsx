import { prisma } from "@/lib/prisma";
import CampaignForm from "@/components/admin/CampaignForm";

export default async function AdminNewsletterPage() {
  let subscribers: Awaited<ReturnType<typeof load>> = [];
  let available = true;
  try {
    subscribers = await load();
  } catch {
    available = false;
  }

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">
        Newsletter {subscribers.length > 0 && `(${subscribers.length})`}
      </h1>

      {!available && (
        <p className="mt-4 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Base de données indisponible.
        </p>
      )}

      {available && subscribers.length === 0 ? (
        <p className="mt-8 text-sm text-paper/40">Aucun abonné pour le moment.</p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-widest2 text-paper/40">
              <th className="py-2">Email</th>
              <th className="py-2">Source</th>
              <th className="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-b border-line/50">
                <td className="py-2 text-paper">{s.email}</td>
                <td className="py-2 text-paper/60">{s.source}</td>
                <td className="py-2 text-paper/40">{s.createdAt.toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {available && subscribers.length > 0 && <CampaignForm />}
    </div>
  );
}

function load() {
  return prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
}
