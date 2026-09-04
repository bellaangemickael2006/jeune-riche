import Link from "next/link";

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
          <p className="font-display text-xl uppercase tracking-wide text-paper">Jeune Riche</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/50">
            Newsletter — soyez informé des prochains drops.
          </p>
          <NewsletterForm />
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
