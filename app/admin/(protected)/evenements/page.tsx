import { getAllEvents } from "@/lib/data/events";
import { createEvent, updateEvent, deleteEvent } from "@/lib/actions/events";

type EventRow = Awaited<ReturnType<typeof getAllEvents>>[number];

// Valeur attendue par <input type="datetime-local"> : "AAAA-MM-JJTHH:MM".
function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const inputClass = "w-full border border-line bg-transparent px-4 py-3 text-sm text-paper";
const labelClass = "mb-2 block text-xs uppercase tracking-widest2 text-paper/50";

function EventFields({ event }: { event?: EventRow }) {
  const year = new Date().getFullYear();
  return (
    <>
      <label className="block">
        <span className={labelClass}>Nom</span>
        <input name="name" required defaultValue={event?.name ?? "Noël"} className={inputClass} />
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Début</span>
          <input
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={toLocalInput(event?.startsAt ?? new Date(year, 11, 1))}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Fin</span>
          <input
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={toLocalInput(event?.endsAt ?? new Date(year, 11, 31, 23, 59))}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block">
        <span className={labelClass}>Texte de la bannière (vide = pas de bannière)</span>
        <input
          name="bannerText"
          defaultValue={event?.bannerText ?? ""}
          placeholder="Joyeux Noël — livraison offerte dès 30 000 F CFA"
          className={`${inputClass} placeholder:text-paper/30`}
        />
      </label>
      <label className="flex items-center gap-4">
        <span className={labelClass}>Couleur d&apos;accent</span>
        <input name="accent" type="color" defaultValue={event?.accent ?? "#C8102E"} className="h-10 w-16 bg-transparent" />
      </label>
      <fieldset className="flex flex-col gap-3">
        <legend className={labelClass}>Effets</legend>
        <label className="flex items-center gap-3 text-sm text-paper">
          <input type="checkbox" name="effectSnow" defaultChecked={event?.effectSnow ?? true} />
          Flocons de neige
        </label>
        <label className="flex items-center gap-3 text-sm text-paper">
          <input type="checkbox" name="effectLights" defaultChecked={event?.effectLights ?? true} />
          Guirlande lumineuse en haut de page
        </label>
        <label className="flex items-center gap-3 text-sm text-paper">
          <input type="checkbox" name="enabled" defaultChecked={event?.enabled ?? true} />
          Activé
        </label>
      </fieldset>
    </>
  );
}

export default async function AdminEventsPage() {
  const events = await getAllEvents();
  const now = new Date();

  return (
    <div>
      <h1 className="font-display text-2xl uppercase text-paper">Événements</h1>
      <p className="mt-2 max-w-lg text-xs text-paper/40">
        Pendant la période d&apos;un événement activé, le site affiche sa bannière, sa couleur d&apos;accent et
        ses effets. Le début et la fin s&apos;appliquent tout seuls (dans les 5 minutes).
      </p>

      <section className="mt-8 flex flex-col gap-6">
        {events.length === 0 && <p className="text-sm text-paper/50">Aucun événement pour l&apos;instant.</p>}
        {events.map((event) => {
          const live = event.enabled && event.startsAt <= now && event.endsAt >= now;
          return (
            <details key={event.id} className="border border-line p-5">
              <summary className="flex cursor-pointer items-center gap-3 text-sm text-paper">
                <span className="h-3 w-3 rounded-full" style={{ background: event.accent }} aria-hidden="true" />
                {event.name}
                <span className="text-xs uppercase tracking-widest2 text-paper/50">
                  {live ? "En cours" : event.enabled ? "Programmé" : "Désactivé"}
                </span>
              </summary>
              <form action={updateEvent} className="mt-6 flex max-w-md flex-col gap-6">
                <input type="hidden" name="id" value={event.id} />
                <EventFields event={event} />
                <button type="submit" className="self-start bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink">
                  Enregistrer
                </button>
              </form>
              <form action={deleteEvent} className="mt-4">
                <input type="hidden" name="id" value={event.id} />
                <button type="submit" className="text-xs uppercase tracking-widest2 text-paper/50 underline">
                  Supprimer
                </button>
              </form>
            </details>
          );
        })}
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="mb-6 text-xs uppercase tracking-widest2 text-paper/50">Nouvel événement</h2>
        <form action={createEvent} className="flex max-w-md flex-col gap-6">
          <EventFields />
          <button type="submit" className="self-start bg-paper px-6 py-3 text-xs uppercase tracking-widest2 text-ink">
            Créer
          </button>
        </form>
      </section>
    </div>
  );
}
