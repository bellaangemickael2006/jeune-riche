export default function Loading() {
  return (
    <div className="min-h-screen bg-ink px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <div className="grid gap-10 md:grid-cols-[1.35fr_1fr] md:gap-16">
        <div className="aspect-4/5 bg-line/20" />
        <div className="flex max-w-md flex-col gap-4">
          <div className="h-3 w-24 bg-line/20" />
          <div className="h-8 w-3/4 bg-line/20" />
          <div className="h-6 w-28 bg-line/20" />
        </div>
      </div>
    </div>
  );
}
