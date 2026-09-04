import Link from "next/link";
import Image from "next/image";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string }>;
}) {
  const { numero } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-5 text-center">
      <Image
        src="/images/logo/logo-white-on-black.png"
        alt="JEUNE RICHE"
        width={100}
        height={100}
        className="h-16 w-16 object-contain"
      />
      <h1 className="font-display text-3xl uppercase text-paper md:text-4xl">Commande enregistrée</h1>
      {numero && <p className="text-sm text-paper/60">Référence : {numero}</p>}
      <p className="max-w-sm text-sm text-paper/50">
        Un email de confirmation vous sera envoyé. Notre équipe vous recontactera pour finaliser le
        règlement et l&apos;expédition.
      </p>
      <Link href="/catalogue" className="mt-4 text-xs uppercase tracking-widest2 underline underline-offset-4 text-paper">
        Retour au catalogue
      </Link>
    </div>
  );
}
