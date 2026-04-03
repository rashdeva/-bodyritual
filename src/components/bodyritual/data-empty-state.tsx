import Link from "next/link";

export function DataEmptyState({
  title,
  description,
  adminHref,
  adminUser,
  fallbackVideoUrl,
  fallbackVideoEmbedUrl,
  fallbackVideoTitle,
}: {
  title: string;
  description: string;
  adminHref?: string;
  adminUser?: boolean;
  fallbackVideoUrl?: string;
  fallbackVideoEmbedUrl?: string | null;
  fallbackVideoTitle?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fffef9_0%,#f6ede0_44%,#efdfce_100%)] px-5 py-8">
      <section className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_28px_90px_rgba(96,64,32,0.12)] backdrop-blur sm:p-10">
        <p className="text-[0.72rem] uppercase tracking-[0.32em] text-stone-500">Нет mock-данных</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.07em] text-stone-950">{title}</h1>
        <p className="mt-4 text-base leading-7 text-stone-600">{description}</p>
        {fallbackVideoEmbedUrl ? (
          <div className="mt-8 overflow-hidden rounded-[1.6rem] border border-white/70 bg-stone-950 shadow-[0_24px_80px_rgba(28,25,23,0.18)]">
            <div className="aspect-video w-full">
              <iframe
                src={fallbackVideoEmbedUrl}
                title={fallbackVideoTitle ?? "Резервное видео"}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          {adminUser ? (
            <Link href={adminHref || ''} className="rounded-full border border-stone-200 bg-white/80 px-6 py-3 text-sm font-medium text-stone-800">
              Админка
            </Link>
          ) : null}
          {fallbackVideoUrl ? (
            <a
              href={fallbackVideoUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-stone-200 bg-white/80 px-6 py-3 text-sm font-medium text-stone-800"
            >
              Открыть резервное видео
            </a>
          ) : null}
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
