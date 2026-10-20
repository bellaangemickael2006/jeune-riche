import { getServerTranslation } from "@/lib/i18n/server";

export default async function Loading() {
  const { t } = await getServerTranslation();
  return (
    <div className="mx-auto min-h-screen max-w-[1600px] bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="mb-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-label text-paper/40">{t("catalogue.eyebrow")}</p>
          <h1 className="mt-3 font-editorial text-heading-lg text-paper md:text-[4.5rem] md:leading-[0.98]">
            {t("catalogue.title")}
          </h1>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-16 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-4/5 bg-line/20" />
        ))}
      </div>
    </div>
  );
}
