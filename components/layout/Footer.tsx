import Link from "next/link";
import Image from "next/image";

// Renseigner ici les URLs réelles dès qu'elles sont communiquées — tant
// qu'un champ est vide, l'icône correspondante s'affiche sans lien plutôt
// que de pointer vers une URL inventée.
const SOCIAL_LINKS = {
  instagram: "",
  tiktok: "",
  facebook: "",
};

const COLUMNS = [
  {
    title: "Marque",
    links: [
      { label: "Catalogue", href: "/catalogue" },
      { label: "Manifeste", href: "/manifeste" },
      { label: "Drops", href: "/drops" },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "Livraison", href: "/livraison" },
      { label: "Retours", href: "/retours" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions générales", href: "/conditions" },
      { label: "Confidentialité", href: "/confidentialite" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink px-5 py-16 md:px-10 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.2fr_repeat(3,1fr)]">
        <div>
          <Image
            src="/images/logo/logo-transparent.png"
            alt="JEUNE RICHE"
            width={160}
            height={160}
            className="h-14 w-14 object-contain"
          />
          <p className="font-display mt-3 text-lg uppercase tracking-wide text-paper">Jeune Riche</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/50">
            Newsletter — soyez informé des prochains drops.
          </p>
          <NewsletterForm />
          <SocialLinks />
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="font-body text-xs uppercase tracking-widest2 text-paper/40">{col.title}</p>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-paper/70 transition-colors hover:text-paper"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-16 max-w-6xl border-t border-line pt-6 text-xs text-paper/30">
        © {new Date().getFullYear()} Jeune Riche.
      </div>
    </footer>
  );
}

function SocialLinks() {
  const icons: { key: keyof typeof SOCIAL_LINKS; label: string; path: string }[] = [
    {
      key: "instagram",
      label: "Instagram",
      path: "M12 2c-2.72 0-3.06.01-4.12.06-1.06.05-1.79.22-2.43.47a4.9 4.9 0 0 0-1.77 1.15A4.9 4.9 0 0 0 2.53 5.45c-.25.64-.42 1.37-.47 2.43C2.01 8.94 2 9.28 2 12s.01 3.06.06 4.12c.05 1.06.22 1.79.47 2.43a4.9 4.9 0 0 0 1.15 1.77 4.9 4.9 0 0 0 1.77 1.15c.64.25 1.37.42 2.43.47C8.94 21.99 9.28 22 12 22s3.06-.01 4.12-.06c1.06-.05 1.79-.22 2.43-.47a4.9 4.9 0 0 0 1.77-1.15 4.9 4.9 0 0 0 1.15-1.77c.25-.64.42-1.37.47-2.43.05-1.06.06-1.4.06-4.12s-.01-3.06-.06-4.12c-.05-1.06-.22-1.79-.47-2.43a4.9 4.9 0 0 0-1.15-1.77A4.9 4.9 0 0 0 18.55 2.53c-.64-.25-1.37-.42-2.43-.47C15.06 2.01 14.72 2 12 2Zm0 1.8c2.67 0 2.99.01 4.04.06.98.04 1.5.2 1.86.34.47.18.8.4 1.15.75.35.35.57.68.75 1.15.14.36.3.88.34 1.86.05 1.05.06 1.37.06 4.04s-.01 2.99-.06 4.04c-.04.98-.2 1.5-.34 1.86-.18.47-.4.8-.75 1.15-.35.35-.68.57-1.15.75-.36.14-.88.3-1.86.34-1.05.05-1.37.06-4.04.06s-2.99-.01-4.04-.06c-.98-.04-1.5-.2-1.86-.34a3.1 3.1 0 0 1-1.15-.75 3.1 3.1 0 0 1-.75-1.15c-.14-.36-.3-.88-.34-1.86C3.81 14.99 3.8 14.67 3.8 12s.01-2.99.06-4.04c.04-.98.2-1.5.34-1.86.18-.47.4-.8.75-1.15.35-.35.68-.57 1.15-.75.36-.14.88-.3 1.86-.34C9.01 3.81 9.33 3.8 12 3.8Zm0 3.05a5.15 5.15 0 1 0 0 10.3 5.15 5.15 0 0 0 0-10.3Zm0 8.5a3.35 3.35 0 1 1 0-6.7 3.35 3.35 0 0 1 0 6.7Zm5.35-8.7a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z",
    },
    {
      key: "tiktok",
      label: "TikTok",
      path: "M16.6 2h-3.2v13.4a2.9 2.9 0 1 1-2.06-2.78V9.4a6.1 6.1 0 1 0 5.26 6.05V8.3a7.5 7.5 0 0 0 4.4 1.4V6.5a4.3 4.3 0 0 1-4.4-4.3Z",
    },
    {
      key: "facebook",
      label: "Facebook",
      path: "M13.5 22v-8.5H16l.4-3H13.5V8.5c0-.87.24-1.46 1.5-1.46H16.5V4.36C16.24 4.32 15.36 4.25 14.33 4.25c-2.14 0-3.6 1.31-3.6 3.7V10.5H8.25v3H10.73V22h2.77Z",
    },
  ];

  return (
    <div className="mt-6 flex gap-4">
      {icons.map((icon) => {
        const href = SOCIAL_LINKS[icon.key];
        const svg = (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d={icon.path} />
          </svg>
        );
        return href ? (
          <a
            key={icon.key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={icon.label}
            className="text-paper/60 transition-colors hover:text-paper"
          >
            {svg}
          </a>
        ) : (
          <span key={icon.key} aria-label={`${icon.label} — bientôt`} className="text-paper/25">
            {svg}
          </span>
        );
      })}
    </div>
  );
}

function NewsletterForm() {
  return (
    <form
      action="/api/newsletter"
      method="POST"
      className="mt-5 flex max-w-xs items-center border-b border-paper/30 pb-2"
    >
      <input
        type="email"
        name="email"
        required
        placeholder="Votre email"
        className="w-full bg-transparent text-sm text-paper placeholder:text-paper/40 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 text-xs uppercase tracking-widest2 text-paper/70 transition-colors hover:text-paper"
      >
        Envoyer
      </button>
    </form>
  );
}
