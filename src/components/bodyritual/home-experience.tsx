"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pause, Play, Sparkles } from "lucide-react";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";

import { completeRitualSession, startRitualSession } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { HomeViewModel } from "@/lib/bodyritual-data";
import { shouldUnoptimizeImage } from "@/lib/image-utils";

type RitualState = "ready" | "active" | "paused" | "completed" | "error";

type ActivePayload = {
  sessionId: string;
  totalSeconds: number;
  elapsedSeconds: number;
};

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.max(0, value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function HomeExperience({ data }: { data: HomeViewModel }) {
  const router = useRouter();
  const [ritualState, setRitualState] = useState<RitualState>(
    data.completedToday ? "completed" : "ready",
  );
  const [active, setActive] = useState<ActivePayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showFeaturedVideo, setShowFeaturedVideo] = useState(false);
  const featuredVideo = data.recommendations[0] ?? null;

  const totalSeconds = useMemo(
    () =>
      data.ritual.exercises.reduce(
        (sum, exercise) => sum + exercise.durationSeconds,
        0,
      ),
    [data.ritual.exercises],
  );

  const currentExercise = useMemo(() => {
    const elapsed = active?.elapsedSeconds ?? 0;
    let cursor = 0;

    for (const exercise of data.ritual.exercises) {
      cursor += exercise.durationSeconds;
      if (elapsed < cursor) {
        return exercise;
      }
    }

    return data.ritual.exercises.at(-1) ?? null;
  }, [active?.elapsedSeconds, data.ritual.exercises]);

  const currentExerciseIndex = currentExercise?.orderIndex ?? 0;
  const remainingSeconds = Math.max(
    0,
    (active?.totalSeconds ?? totalSeconds) - (active?.elapsedSeconds ?? 0),
  );
  const progress = active
    ? Math.min(1, active.elapsedSeconds / active.totalSeconds)
    : 0;

  const speakCue = useEffectEvent((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ru-RU";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  });

  useEffect(() => {
    if (ritualState !== "active" || !currentExercise) {
      return;
    }

    speakCue(currentExercise.audioCue);
  }, [currentExercise?.id, currentExercise, ritualState]);

  useEffect(() => {
    if (ritualState !== "active" || !active) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive((prev) => {
        if (!prev) {
          return prev;
        }

        const elapsed = prev.elapsedSeconds + 1;
        if (elapsed >= prev.totalSeconds) {
          window.clearInterval(timer);
          setRitualState("completed");

          startTransition(async () => {
            try {
              const result = await completeRitualSession(prev.sessionId);
              router.push(`/result/${result.sessionId}`);
            } catch (error) {
              setErrorMessage(
                error instanceof Error
                  ? error.message
                  : "Не удалось завершить ритуал.",
              );
              setRitualState("error");
            }
          });

          return { ...prev, elapsedSeconds: prev.totalSeconds };
        }

        return { ...prev, elapsedSeconds: elapsed };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active, ritualState, router]);

  async function handleStart() {
    setErrorMessage(null);

    if (featuredVideo?.embedUrl) {
      setShowFeaturedVideo(true);
      return;
    }

    if (ritualState === "completed" && data.completedSessionId) {
      router.push(`/result/${data.completedSessionId}`);
      return;
    }

    startTransition(async () => {
      try {
        const result = await startRitualSession(data.ritual.id);
        setActive({
          sessionId: result.sessionId,
          totalSeconds,
          elapsedSeconds: 0,
        });
        setRitualState("active");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Не удалось запустить ритуал.",
        );
        setRitualState("error");
      }
    });
  }

  function handleTogglePause() {
    setRitualState((current) => (current === "paused" ? "active" : "paused"));
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fffef9_0%,#f8f2e8_34%,#efe3d4_72%,#eadbcc_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.88),transparent_32%),radial-gradient(circle_at_20%_100%,rgba(227,189,138,0.26),transparent_28%),radial-gradient(circle_at_82%_82%,rgba(205,146,102,0.18),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.54))]" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 pb-8 pt-6 sm:px-8">
        <header className="flex flex-col-reverse gap-4 md:gap-0 md:flex-row items-start justify-between">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.32em] text-stone-500">
              Body Ritual
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.06em] text-stone-950 sm:text-3xl">
              {data.statusLine}
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-6 text-stone-600">
              {data.statusHint}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/leaderboard"
              className="rounded-full border border-white/70 bg-white/70 px-4 py-4 font-medium text-sm text-stone-700 shadow-[0_12px_32px_rgba(96,64,32,0.1)] backdrop-blur"
            >
              {data.user.xp} XP
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-3 rounded-full border border-white/70 bg-white/70 px-2 py-2 shadow-[0_12px_32px_rgba(96,64,32,0.1)] backdrop-blur"
            >
              <Image
                src={data.user.avatarUrl ?? "/globe.svg"}
                alt={data.user.name}
                width={36}
                height={36}
                unoptimized={shouldUnoptimizeImage(data.user.avatarUrl)}
                className="size-9 rounded-full bg-stone-200 object-cover"
              />
              <span className="pr-2 text-sm font-medium text-stone-800">
                {data.user.name}
              </span>
            </Link>
          </div>
        </header>

        <div className="relative flex flex-1 flex-col items-center justify-center pb-8 pt-8">
          {featuredVideo?.embedUrl && showFeaturedVideo ? (
            <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/76 shadow-[0_30px_120px_rgba(120,80,40,0.22)] backdrop-blur">
              <div className="aspect-video w-full bg-stone-950">
                <iframe
                  src={featuredVideo.embedUrl}
                  title={featuredVideo.title}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-stone-500">
                  <span>{featuredVideo.typeLabel}</span>
                  <span className="h-1 w-1 rounded-full bg-stone-300" />
                  <span>{featuredVideo.durationLabel}</span>
                  <span className="h-1 w-1 rounded-full bg-stone-300" />
                  <span>{featuredVideo.intensityLabel}</span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.06em] text-stone-950">
                  {featuredVideo.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {featuredVideo.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFeaturedVideo(false)}
                    className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700"
                  >
                    Свернуть
                  </button>
                  <a
                    href={featuredVideo.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white"
                  >
                    Открыть в VK
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="group relative flex size-[20rem] max-w-full items-center justify-center rounded-full border border-white/70 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(255,244,228,0.82)_45%,rgba(236,214,188,0.94)_100%)] shadow-[0_30px_120px_rgba(120,80,40,0.22)] transition duration-300 hover:scale-[1.01] sm:size-[24rem]"
              style={{
                backgroundImage:
                  ritualState === "active" || ritualState === "paused"
                    ? `conic-gradient(from 0deg, rgba(167,111,72,0.9) ${progress * 360}deg, rgba(255,255,255,0.76) 0deg)`
                    : undefined,
              }}
            >
              <div className="absolute inset-[10px] rounded-full bg-[radial-gradient(circle_at_35%_28%,#fffefb_0%,#fcf5ea_54%,#f2e4d5_100%)]" />
              <div className="relative z-10 flex max-w-[13rem] flex-col items-center gap-3 text-center">
                {featuredVideo && ritualState === "ready" ? (
                  <>
                    <div className="flex size-16 items-center justify-center rounded-full bg-stone-950 text-white shadow-[0_16px_44px_rgba(28,25,23,0.22)]">
                      <Play className="ml-1 size-7" />
                    </div>
                    <h2 className="text-3xl font-semibold tracking-[-0.07em] text-stone-950">
                      Смотреть
                    </h2>
                    <p className="max-w-[12rem] text-sm leading-6 text-stone-600">
                      {featuredVideo.title}
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                      {featuredVideo.durationLabel}
                    </p>
                  </>
                ) : ritualState === "ready" ? (
                  <>
                    <div className="flex size-16 items-center justify-center rounded-full bg-stone-950 text-white shadow-[0_16px_44px_rgba(28,25,23,0.22)]">
                      <Play className="ml-1 size-7" />
                    </div>
                    <h2 className="text-3xl font-semibold tracking-[-0.07em] text-stone-950">
                      Начать
                    </h2>
                    <p className="text-sm leading-6 text-stone-600">
                      {data.ritual.durationMinutes} минут зарядки
                    </p>
                  </>
                ) : null}

                {ritualState === "active" && !featuredVideo && (
                  <>
                    <div className="text-5xl font-semibold tracking-[-0.08em] text-stone-950">
                      {formatSeconds(remainingSeconds)}
                    </div>
                    <p className="text-sm text-stone-500">
                      Упражнение {currentExerciseIndex + 1} из{" "}
                      {data.ritual.exercises.length}
                    </p>
                    <p className="max-w-[11rem] text-base leading-6 font-medium text-stone-800">
                      {currentExercise?.title}
                    </p>
                  </>
                )}

                {ritualState === "paused" && !featuredVideo && (
                  <>
                    <div className="text-5xl font-semibold tracking-[-0.08em] text-stone-950">
                      {formatSeconds(remainingSeconds)}
                    </div>
                    <p className="text-sm text-stone-500">Ритуал на паузе</p>
                    <p className="max-w-[11rem] text-base leading-6 font-medium text-stone-800">
                      Нажми ниже, чтобы продолжить
                    </p>
                  </>
                )}

                {ritualState === "completed" && !featuredVideo && (
                  <>
                    <div className="flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_16px_44px_rgba(16,185,129,0.24)]">
                      <Sparkles className="size-7" />
                    </div>
                    <h2 className="text-3xl font-semibold tracking-[-0.07em] text-stone-950">
                      Готово
                    </h2>
                    <p className="text-sm leading-6 text-stone-600">
                      Ритуал завершён, можно посмотреть результат
                    </p>
                  </>
                )}

                {ritualState === "error" && !featuredVideo && (
                  <>
                    <div className="text-2xl font-semibold tracking-[-0.06em] text-stone-950">
                      Ошибка запуска
                    </div>
                    <p className="text-sm leading-6 text-stone-600">
                      {errorMessage ?? "Повтори попытку ещё раз."}
                    </p>
                  </>
                )}
              </div>
            </button>
          )}

          <div className="mt-5 min-h-11">
            {(ritualState === "active" || ritualState === "paused") &&
            active &&
            !featuredVideo ? (
              <Button
                onClick={handleTogglePause}
                className="rounded-full bg-stone-950 px-5 py-6 text-sm text-white shadow-[0_18px_44px_rgba(28,25,23,0.22)]"
              >
                {ritualState === "paused" ? (
                  <Play className="size-4" />
                ) : (
                  <Pause className="size-4" />
                )}
                {ritualState === "paused" ? "Продолжить" : "Пауза"}
              </Button>
            ) : (
              <p className="text-sm text-stone-500">
                {featuredVideo
                  ? `${featuredVideo.typeLabel} • ${featuredVideo.levelLabel} • ${featuredVideo.intensityLabel}`
                  : `${data.ritual.audioTitle} • ${data.ritual.description}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Link
            href="/leaderboard"
            className="inline-flex items-center justify-center rounded-full border border-stone-950 bg-stone-950 px-8 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_20px_50px_rgba(28,25,23,0.22)] transition hover:bg-stone-800"
          >
            Топ участников
          </Link>
        </div>
      </section>
    </main>
  );
}
