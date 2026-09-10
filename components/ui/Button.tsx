import Link from "next/link";
import { cn } from "@/lib/utils";

// Grammaire de boutons unique du site. Avant, le style CTA
// (`bg-paper px-8 py-4 text-xs uppercase`) était recopié à la main dans une
// douzaine de fichiers, avec des paddings et des tailles qui divergeaient
// page par page — c'est ce qui donnait l'impression d'une UI assemblée
// plutôt que dessinée. Quatre variantes, aucune autre : un bouton du site
// doit toujours appartenir à cette famille.
//
// Angles vifs, jamais d'arrondi ni d'ombre : la présence vient du contraste
// et de la typographie condensée, pas d'un effet.

type Variant = "primary" | "secondary" | "text" | "dark";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  // Aplat papier sur fond encre — l'action principale.
  primary: "bg-paper text-ink hover:bg-paper/90",
  // Contour seul — action secondaire de même poids typographique.
  secondary: "border border-paper/60 text-paper hover:border-paper hover:bg-paper/5",
  // Pas de boîte : texte + filet qui s'épaissit au survol.
  text: "text-paper/70 hover:text-paper border-b border-paper/30 hover:border-paper",
  // Aplat encre — pour les panneaux clairs (fond studio, mode clair inversé).
  dark: "bg-ink text-paper hover:bg-ink/90",
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-6 text-[10px]",
  md: "h-14 px-10 text-[11px]",
};

// La variante texte ne doit pas hériter d'une hauteur de boîte : elle vit
// dans le flux typographique, pas dans une surface.
const TEXT_SIZES: Record<Size, string> = {
  sm: "pb-1 text-[10px]",
  md: "pb-1.5 text-[11px]",
};

function classes(variant: Variant, size: Size, className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-3 font-display uppercase tracking-widest2 leading-none",
    "transition-[background-color,border-color,color,opacity] duration-200 ease-editorial",
    "disabled:pointer-events-none disabled:opacity-40",
    VARIANTS[variant],
    variant === "text" ? TEXT_SIZES[size] : SIZES[size],
    className
  );
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classes(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: CommonProps & { href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return (
    <Link href={href} className={classes(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
