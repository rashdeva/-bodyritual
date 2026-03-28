import Link from "next/link";

export function DataEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fffef9_0%,#f6ede0_44%,#efdfce_100%)] px-5 py-8">
      <section className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_28px_90px_rgba(96,64,32,0.12)] backdrop-blur sm:p-10">
        <p className="text-[0.72rem] uppercase tracking-[0.32em] text-stone-500">Нет mock-данных</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.07em] text-stone-950">{title}</h1>
        <p className="mt-4 text-base leading-7 text-stone-600">{description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-stone-950 px-6 py-3 text-sm font-medium text-white">
            На главный экран
          </Link>
          <Link href="/onboarding" className="rounded-full border border-stone-200 bg-white/80 px-6 py-3 text-sm font-medium text-stone-800">
            Открыть onboarding
          </Link>
        </div>
      </section>
    </main>
  );
}
