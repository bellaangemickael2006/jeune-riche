import Link from "next/link";
import { cn } from "@/lib/utils";

// Le langage des actions de JEUNE RICHE.
//
// Avant, le style d'un bouton était recopié à la main dans une douzaine de
// fichiers, avec quatre paddings différents pour la même action — c'est ce
// qui donnait l'impression d'une interface assemblée plutôt que dessinée.
//
// Trois familles, et leur différence encode l'engagement demandé au client,
// pas une hiérarchie décorative :
//
//   engager    — irréversible ou payant (ajouter, commander, nommer)
//   poursuivre — navigation volontaire (voir la pièce, retour, appliquer)
//   passer     — sortie douce (tout le catalogue, le manifeste)
//
// Angles vifs, aucune ombre, aucun arrondi : la présence vient du contraste
// et de la typographie condensée. Anton porte les actions, jamais Inter.

type Family = "engager" | "poursuivre" | "passer";
type Size = "sm" | "md";

const FAMILIES: Record<Family, string> = {
  engager: "bg-paper text-ink hover:bg-paper/90",
  poursuivre: "border border-paper/50 text-paper hover:border-paper hover:bg-paper/5",
  passer: "text-paper/60 hover:text-paper border-b border-paper/25 hover:border-paper",
};

// La variante « passer » vit dans le flux typographique : lui imposer une
// hauteur de boîte la ferait ressembler aux deux autres.
const BOX: Record<Size, string> = {
  sm: "h-11 px-6 text-[11px]",
  md: "h-14 px-10 text-[11px]",
};
const FLOW: Record<Size, string> = {
  sm: "pb-1 text-[11px]",
  md: "pb-1.5 text-[11px]",
};

function actionClasses(family: Family, size: Size, className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-3 font-display uppercase leading-none tracking-widest2",
    "transition-[background-color,border-color,color,opacity] duration-200 ease-editorial",
    "disabled:pointer-events-none disabled:opacity-40",
    FAMILIES[family],
    family === "passer" ? FLOW[size] : BOX[size],
    className
  );
}

type Common = {
  family?: Family;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Action({
  family = "engager",
  size = "md",
  className,
  children,
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={actionClasses(family, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ActionLink({
  family = "engager",
  size = "md",
  className,
  children,
  href,
  ...props
}: Common & { href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={actionClasses(family, size, className)} {...props}>
      {children}
    </Link>
  );
}

// Lien externe (WhatsApp) — même grammaire, mais <a> natif pour target/rel.
export function ActionExternal({
  family = "poursuivre",
  size = "md",
  className,
  children,
  href,
  ...props
}: Common & { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={actionClasses(family, size, className)}
      {...props}
    >
      {children}
    </a>
  );
}
