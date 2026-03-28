import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { DataEmptyState } from "@/components/bodyritual/data-empty-state";
import { getLeaderboardViewModel } from "@/lib/bodyritual-data";
import { getAuthSession } from "@/lib/auth";
import { shouldUnoptimizeImage } from "@/lib/image-utils";

export default async function LeaderboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const data = await getLeaderboardViewModel(session.user.id);

  if (!data) {
    return (
      <DataEmptyState
        title="Рейтинг пока пуст"
        description="Для leaderboard нужны реальные активные пользователи с заполненным UserProgress. Моки из runtime убраны, поэтому здесь будут только настоящие записи из базы."
      />
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fefcf8_0%,#f6ede1_48%,#f1e4d6_100%)] px-5 py-6 sm:px-8">
      <section className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/75 px-4 py-2 text-sm text-stone-700 shadow-sm backdrop-blur"
          >
            <ChevronLeft className="size-4" />
            Назад
          </Link>
          <Link
            href="/profile"
            className="rounded-full border border-stone-200 bg-white/75 px-4 py-2 text-sm text-stone-700 shadow-sm backdrop-blur"
          >
            Профиль
          </Link>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/70 bg-white/72 p-6 shadow-[0_28px_90px_rgba(96,64,32,0.12)] backdrop-blur sm:p-8">
          <p className="text-[0.72rem] uppercase tracking-[0.32em] text-stone-500">Социальный слой</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.07em] text-stone-950 sm:text-5xl">Топ участников</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
                Здесь видно, как растёт сообщество и где сейчас находишься ты. Список короткий, без лишних фильтров и перегрузки.
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-stone-950 px-5 py-4 text-white shadow-[0_18px_48px_rgba(28,25,23,0.2)]">
              <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Твоя позиция</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.06em]">#{data.currentUserRank}</p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {data.entries.map((entry) => (
              <article
                key={entry.id}
                className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[1.6rem] border px-4 py-4 sm:px-5 ${
                  entry.isCurrentUser
                    ? "border-stone-950 bg-stone-950 text-white shadow-[0_18px_48px_rgba(28,25,23,0.18)]"
                    : "border-stone-200/80 bg-white/78 text-stone-900"
                }`}
              >
                <div className={`w-10 text-center text-sm font-semibold ${entry.isCurrentUser ? "text-stone-300" : "text-stone-500"}`}>
                  #{entry.rank}
                </div>

                <div className="flex min-w-0 items-center gap-4">
                  <Image
                    src={entry.avatarUrl ?? "/globe.svg"}
                    alt={entry.name}
                    width={48}
                    height={48}
                    unoptimized={shouldUnoptimizeImage(entry.avatarUrl)}
                    className="size-12 rounded-full bg-stone-200 object-cover"
                  />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-medium tracking-[-0.04em]">{entry.name}</h2>
                    <p className={`truncate text-sm ${entry.isCurrentUser ? "text-stone-300" : "text-stone-500"}`}>
                      Level {entry.level} • {entry.streak} дней подряд
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold tracking-[-0.04em]">{entry.xp} XP</p>
                  <p className={`text-sm ${entry.isCurrentUser ? "text-stone-300" : "text-stone-500"}`}>стабильный ритм</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
