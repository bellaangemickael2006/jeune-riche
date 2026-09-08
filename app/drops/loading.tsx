export default function Loading() {
  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <h1 className="font-editorial text-heading-lg leading-[1.05] text-paper md:text-[4rem]">Drops</h1>
      <div className="mt-12 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-line bg-line/10" />
        ))}
      </div>
    </div>
  );
}
