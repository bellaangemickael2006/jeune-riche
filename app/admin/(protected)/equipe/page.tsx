import { getAdminAccess, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addTeamMember, removeTeamMember, updateTeamMember } from "@/lib/actions/team";
import { resetMemberMfa } from "@/lib/actions/adminMfa";
import { cleanPermissions, PERMISSIONS } from "@/lib/admin/permissions";
import ActionForm, { SubmitButton } from "@/components/admin/ActionForm";
import ConfirmButton from "@/components/admin/ConfirmButton";
import AccessFields from "@/components/admin/AccessFields";

export const dynamic = "force-dynamic";

async function loadTeam() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      include: { adminAccess: true },
      orderBy: { createdAt: "asc" },
    });
    return { admins, migrated: true as const };
  } catch {
    // Table des droits pas encore créée : liste sans droits (tous propriétaires).
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
    return { admins: admins.map((a) => ({ ...a, adminAccess: null })), migrated: false as const };
  }
}

export default async function TeamPage() {
  // Réservé aux propriétaires — voir lib/auth.ts.
  await requireAdmin("proprietaire");
  const { user: me } = await getAdminAccess();
  const { admins, migrated } = await loadTeam();

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl uppercase text-paper">Équipe</h1>
      <p className="mt-2 max-w-2xl text-sm text-paper/70">
        Donnez accès à l&apos;administration à vos employés, section par section. Chaque accès est vérifié côté
        serveur : un employé ne voit et ne peut modifier que ce qui est coché.
      </p>

      {!migrated && (
        <p className="mt-6 border border-paper/30 bg-paper/5 px-4 py-3 text-xs text-paper">
          Pour ajouter des employés, appliquez d&apos;abord la migration « add_admin_permissions » dans Supabase
          (éditeur SQL). En attendant, tous les administrateurs ont accès à tout.
        </p>
      )}

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-widest2 text-paper/70">Membres ({admins.length})</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {admins.map((a) => {
            const isOwner = !a.adminAccess;
            const permissions = cleanPermissions(a.adminAccess?.permissions ?? []);
            const isMe = a.id === me.id;
            return (
              <li key={a.id} className="py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-paper">
                      {a.name || a.email}
                      {isMe && <span className="ml-2 text-[11px] uppercase tracking-widest2 text-paper/60">(vous)</span>}
                    </p>
                    {a.name && <p className="text-xs text-paper/60">{a.email}</p>}
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {isOwner ? (
                        <span className="border border-paper bg-paper px-2 py-0.5 text-[11px] uppercase tracking-widest2 text-ink">
                          Propriétaire — tous les droits
                        </span>
                      ) : (
                        permissions.map((p) => (
                          <span key={p} className="border border-line px-2 py-0.5 text-[11px] uppercase tracking-widest2 text-paper/70">
                            {PERMISSIONS[p].label}
                          </span>
                        ))
                      )}
                    </p>
                  </div>
                  {!isMe && (
                    <div className="flex flex-col items-end gap-2">
                      <ActionForm action={removeTeamMember.bind(null, a.id)}>
                        <ConfirmButton
                          confirmMessage={`Retirer l'accès à l'administration de ${a.email} ? Son compte client éventuel est conservé.`}
                          className="text-[11px] uppercase tracking-widest2 text-paper/60 hover:text-paper"
                        >
                          Retirer de l&apos;équipe
                        </ConfirmButton>
                      </ActionForm>
                      {/* Téléphone perdu : un nouveau lui sera demandé à la prochaine connexion. */}
                      <ActionForm action={resetMemberMfa.bind(null, a.id)}>
                        <ConfirmButton
                          confirmMessage={`Réinitialiser la double vérification de ${a.email} ? Un nouveau téléphone lui sera demandé à sa prochaine connexion.`}
                          className="text-[11px] uppercase tracking-widest2 text-paper/60 hover:text-paper"
                        >
                          Réinitialiser la double vérification
                        </ConfirmButton>
                      </ActionForm>
                    </div>
                  )}
                </div>
                {!isMe && migrated && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[11px] uppercase tracking-widest2 text-paper/70 hover:text-paper">
                      Modifier les accès
                    </summary>
                    <ActionForm action={updateTeamMember.bind(null, a.id)} className="mt-4 flex flex-col gap-4 border border-line p-4">
                      <AccessFields idPrefix={`m-${a.id}`} initialOwner={isOwner} initial={permissions} />
                      <SubmitButton className="w-fit border border-paper px-4 py-2 text-[11px] uppercase tracking-widest2 text-paper">
                        Enregistrer les accès
                      </SubmitButton>
                    </ActionForm>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {migrated && (
        <section className="mt-12 border border-line p-5">
          <h2 className="text-xs uppercase tracking-widest2 text-paper/70">Ajouter un membre</h2>
          <p className="mt-1 text-[11px] text-paper/60">
            Nouveau : il reçoit un email pour activer son accès et choisir son mot de passe. Déjà client : il se connecte
            avec son mot de passe habituel.
          </p>
          <ActionForm action={addTeamMember} resetOnSuccess className="mt-5 flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">Email</span>
                <input name="email" type="email" required className="w-full border border-line bg-transparent px-3 py-2 text-sm text-paper" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-widest2 text-paper/60">Nom (facultatif)</span>
                <input name="name" maxLength={80} className="w-full border border-line bg-transparent px-3 py-2 text-sm text-paper" />
              </label>
            </div>
            <AccessFields idPrefix="new" initial={["commandes"]} />
            <SubmitButton pendingLabel="Envoi…" className="w-fit bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink">
              Inviter dans l&apos;équipe
            </SubmitButton>
          </ActionForm>
        </section>
      )}
    </div>
  );
}
