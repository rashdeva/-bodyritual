import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { DataEmptyState } from "@/components/bodyritual/data-empty-state";
import { getProfileViewModel } from "@/lib/bodyritual-data";
import { getAuthSession } from "@/lib/auth";
import { shouldUnoptimizeImage } from "@/lib/image-utils";

export default async function ProfilePage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const data = await getProfileViewModel(session.user.id);

  if (!data) {
    return (
      <DataEmptyState
        title="Профиль пока не может быть построен"
        description="Для профиля нужен реальный активный пользователь с UserProfile, UserProgress и историями RitualSession/DailyStatus в Postgres."
      />
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffefb_0%,#f7eee2_44%,#f1e2d2_100%)] px-5 py-6 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/75 px-4 py-2 text-sm text-stone-700 shadow-sm backdrop-blur"
          >
            <ChevronLeft className="size-4" />
            Назад
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/videos"
              className="rounded-full border border-stone-200 bg-white/75 px-4 py-2 text-sm text-stone-700 shadow-sm backdrop-blur"
            >
              Админка
            </Link>
            <Link
              href="/onboarding"
              className="rounded-full border border-stone-200 bg-white/75 px-4 py-2 text-sm text-stone-700 shadow-sm backdrop-blur"
            >
              Опрос
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-full border border-stone-200 bg-white/75 px-4 py-2 text-sm text-stone-700 shadow-sm backdrop-blur"
            >
              Рейтинг
            </Link>
            <SignOutButton />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.25fr]">
          <section className="rounded-[2rem] border border-white/70 bg-white/76 p-6 shadow-[0_28px_90px_rgba(96,64,32,0.12)] backdrop-blur sm:p-8">
            <Image
              src={data.user.avatarUrl ?? "/globe.svg"}
              alt={data.user.name}
              width={80}
              height={80}
              unoptimized={shouldUnoptimizeImage(data.user.avatarUrl)}
              className="size-20 rounded-full bg-stone-200 object-cover"
            />
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.07em] text-stone-950">{data.user.name}</h1>
            <p className="mt-3 text-sm leading-6 text-stone-600">{data.user.goal}</p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-[1.4rem] bg-stone-950 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Level</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.06em]">{data.user.level}</p>
              </div>
              <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Streak</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-stone-950">{data.user.streak}</p>
              </div>
              <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">XP</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-stone-950">{data.user.xp}</p>
              </div>
              <div className="rounded-[1.4rem] border border-stone-200 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Лучший streak</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-stone-950">{data.user.longestStreak}</p>
              </div>
            </div>

            <div className="mt-8 space-y-3 text-sm text-stone-600">
              <p>Предпочтительное время: {data.user.preferredTime.toLowerCase()}</p>
              <p>Уровень подготовки: {data.user.fitnessLevel.toLowerCase()}</p>
              <p>Цель разминки: {data.user.warmupGoal}</p>
              <p>Фокус: {data.user.focusAreas.join(", ") || "Не выбран"}</p>
              <p>Лимит по времени: {data.user.timeBudgetMinutes ? `${data.user.timeBudgetMinutes} минут` : "Не выбран"}</p>
              <p>Ограничения: {data.user.restrictionLabel}</p>
              <p>Всего завершённых сессий: {data.user.totalCompletedSessions}</p>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/70 bg-white/76 p-6 shadow-[0_28px_90px_rgba(96,64,32,0.12)] backdrop-blur sm:p-8">
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-stone-500">История выполнения</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-stone-950">Календарь привычки</h2>
              <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-7">
                {data.calendar.map((day) => (
                  <div
                    key={day.date}
                    className={`rounded-[1.2rem] border px-3 py-4 text-center ${
                      day.status === "COMPLETED"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : day.status === "MISSED"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-stone-200 bg-stone-50/80 text-stone-500"
                    }`}
                  >
                    <div className="text-xs uppercase tracking-[0.18em]">{day.shortLabel}</div>
                    <div className="mt-2 text-lg font-semibold">{day.status === "COMPLETED" ? "●" : day.status === "MISSED" ? "×" : "·"}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/76 p-6 shadow-[0_28px_90px_rgba(96,64,32,0.12)] backdrop-blur sm:p-8">
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-stone-500">Последние просмотры и сессии</p>
              <div className="mt-5 space-y-3">
                {data.recentSessions.map((session) => (
                  <article key={session.id} className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-medium tracking-[-0.04em] text-stone-950">{session.title}</h3>
                        <p className="mt-1 text-sm text-stone-500">{session.completedAt}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold tracking-[-0.04em] text-stone-950">+{session.earnedXp} XP</p>
                        <p className="text-sm text-stone-500">{session.durationMinutes} минут</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
