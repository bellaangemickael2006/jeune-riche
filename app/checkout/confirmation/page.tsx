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
        src="/images/logo/logo-transparent.png"
        alt="JEUNE RICHE"
        width={100}
        height={100}
        className="jr-logo h-16 w-16 object-contain"
      />
      <h1 className="font-editorial text-3xl text-paper md:text-4xl">Commande enregistrée</h1>
      {numero && <p className="text-sm text-paper/60">Référence : {numero}</p>}
      <p className="max-w-sm text-sm text-paper/50">
        Un email de confirmation vous sera envoyé. Notre équipe vous recontactera pour finaliser le
        règlement et l&apos;expédition.
      </p>
      <Link href="/catalogue" className="mt-4 text-xs uppercase tracking-widest2 text-paper underline underline-offset-4 hover:text-paper/70">
        Retour au catalogue
      </Link>
    </div>
  );
}
