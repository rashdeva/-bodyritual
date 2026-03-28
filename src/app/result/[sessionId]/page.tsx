import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getResultViewModel } from "@/lib/bodyritual-data";
import { getAuthSession } from "@/lib/auth";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const { sessionId } = await params;
  const result = await getResultViewModel(sessionId, session.user.id);

  if (!result) {
    notFound();
  }

  const rankDelta =
    result.rankBefore && result.rankAfter ? Math.max(0, result.rankBefore - result.rankAfter) : 0;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fffdfa_0%,#f7efe3_40%,#efdfce_100%)] px-5 py-6 sm:px-8">
      <section className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="rounded-[2.2rem] border border-white/70 bg-white/78 p-6 shadow-[0_28px_90px_rgba(96,64,32,0.14)] backdrop-blur sm:p-8">
          <p className="text-[0.72rem] uppercase tracking-[0.32em] text-stone-500">Reward loop</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.07em] text-stone-950 sm:text-5xl">Отлично</h1>
          <p className="mt-3 text-base leading-7 text-stone-600">
            {result.activityType === "video"
              ? `Ты завершил${result.durationMinutes === 1 ? "" : "а"} просмотр ${result.sessionTitle.toLowerCase()} и зафиксировал активность дня.`
              : `Ты завершил${result.durationMinutes === 1 ? "" : "а"} ${result.sessionTitle.toLowerCase()} и зафиксировал дневной ритуал.`}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-stone-950 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Получено</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">+{result.earnedXp} XP</p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Текущая серия</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-stone-950">{result.streak} дней</p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-200 bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Уровень</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-stone-950">Level {result.level}</p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-200 bg-white/80 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Изменение позиции</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-stone-950">
                {rankDelta > 0 ? `+${rankDelta}` : "Без изменений"}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-stone-950 px-6 py-3 text-sm font-medium text-white shadow-[0_18px_48px_rgba(28,25,23,0.18)]"
            >
              Вернуться на главный экран
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white/80 px-6 py-3 text-sm font-medium text-stone-800"
            >
              Посмотреть рейтинг
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/60 bg-white/68 p-6 text-sm text-stone-600 shadow-[0_20px_60px_rgba(96,64,32,0.1)] backdrop-blur">
          Завершено: {result.completedAtLabel}
          {typeof result.rankAfter === "number" ? ` • Текущая позиция: #${result.rankAfter}` : ""}
        </div>
      </section>
    </main>
  );
}
