import type { ReactNode } from "react";

// Même langage que le reste du site : rail en haut, axe à gauche, mesure
// étroite, vide tenu à droite. Le crest en filigrane à 3,5% d'opacité qui
// remplissait le cadre est retiré — invisible, donc pas une information, et le
// crest n'a pas à servir de motif de remplissage.
export default function PlaceholderPage({
  eyebrow,
  title,
  message,
  action,
}: {
  eyebrow: string;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink px-5 pb-32 pt-32 md:px-10 md:pt-40">
      <div className="border-b border-line pb-4">
        <p className="text-label text-paper/40">{eyebrow}</p>
      </div>
      <div className="max-w-2xl pt-20 md:pt-28">
        <h1 className="font-editorial text-heading-lg leading-[1.05] text-paper md:text-[4rem]">
          {title}
        </h1>
        <p className="mt-8 max-w-md text-body leading-relaxed text-paper/50">{message}</p>
        {action && <div className="mt-12">{action}</div>}
      </div>
    </div>
  );
}
