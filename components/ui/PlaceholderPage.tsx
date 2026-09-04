export default function PlaceholderPage({
  eyebrow,
  title,
  message,
}: {
  eyebrow: string;
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5 pt-24 text-center">
      <p className="text-xs uppercase tracking-widest2 text-paper/40">{eyebrow}</p>
      <h1 className="font-display text-3xl uppercase text-paper md:text-4xl">{title}</h1>
      <p className="max-w-md text-sm leading-relaxed text-paper/50">{message}</p>
    </div>
  );
}
