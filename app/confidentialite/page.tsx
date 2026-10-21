import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/server";
import { getStoreSettings } from "@/lib/data/settings";
import { privacyPolicy } from "@/lib/legal/privacy";
import { WHATSAPP_NUMBER } from "@/lib/utils";

// Texte en français (référence) ou en anglais pour toutes les autres
// langues : voir lib/legal/privacy.ts.
async function getPolicy() {
  const locale = await getLocale();
  const settings = await getStoreSettings();
  return privacyPolicy(locale === "fr" ? "fr" : "en", { email: settings?.contactEmail ?? null, whatsapp: WHATSAPP_NUMBER });
}

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getPolicy();
  return { title: policy.title, description: policy.intro };
}

export default async function ConfidentialitePage() {
  const policy = await getPolicy();
  return (
    <article className="mx-auto max-w-2xl px-5 pb-24 pt-32 md:pt-40">
      <h1 className="font-editorial text-4xl text-paper md:text-5xl">{policy.title}</h1>
      <p className="mt-3 text-xs uppercase tracking-widest2 text-paper/40">{policy.updated}</p>
      <p className="mt-8 text-sm leading-relaxed text-paper/70">{policy.intro}</p>
      {policy.sections.map((section) => (
        <section key={section.title} className="mt-10">
          <h2 className="text-xs uppercase tracking-widest2 text-paper">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mt-3 text-sm leading-relaxed text-paper/70">
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-paper/70">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
