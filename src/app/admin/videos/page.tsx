import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminVideo, updateAdminVideo } from "@/app/actions";
import { MobileVideoLibrary } from "@/app/admin/videos/mobile-video-library";
import { Input } from "@/components/ui/input";
import { getAuthSession, isAdminUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  buildVideoMeta,
  videoContextTagOptions,
  videoIntensityOptions,
  videoSafetyTagOptions,
  videoTypeOptions,
} from "@/lib/video-recommendation";
import { surveyFocusAreaOptions, surveyGoalOptions, surveyLevelOptions } from "@/lib/video-survey";

type AdminVideosPageProps = {
  searchParams: Promise<{
    error?: string;
    created?: string;
    updated?: string;
    edit?: string;
  }>;
};

export default async function AdminVideosPage({ searchParams }: AdminVideosPageProps) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  if (!isAdminUser(session.user.id)) {
    redirect("/");
  }

  const [params, videos] = await Promise.all([
    searchParams,
    db.video.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 24,
    }),
  ]);
  const selectedVideo = params.edit ? videos.find((video) => video.id === params.edit) ?? null : null;
  const isEditing = selectedVideo !== null;
  const formAction = isEditing ? updateAdminVideo : createAdminVideo;
  const mobileLibraryVideos = videos.map((video) => {
    const meta = buildVideoMeta(video);

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      isPublished: video.isPublished,
      metaLabel: `${meta.typeLabel} • ${meta.levelLabel} • ${meta.durationLabel} • ${meta.intensityLabel}`,
      goalTags: video.goalTags,
      focusTags: video.focusTags,
    };
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffefb_0%,#f7eee2_44%,#f1e2d2_100%)] px-4 py-5 pb-28 sm:px-6 lg:pb-5">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.32em] text-stone-500">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-stone-950">Видео и теги</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">Сюда добавляем ссылку на видео во VK и проставляем теги для рекомендаций.</p>
          </div>
          <Link href="/" className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm text-stone-800 shadow-sm">
            На главную
          </Link>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-white/70 bg-white/82 p-5 shadow-[0_28px_90px_rgba(96,64,32,0.12)] sm:p-6">
            {params.error ? (
              <div className="mb-4 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                {params.error}
              </div>
            ) : null}

            {params.created ? (
              <div className="mb-4 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                Видео добавлено.
              </div>
            ) : null}

            {params.updated ? (
              <div className="mb-4 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                Видео обновлено.
              </div>
            ) : null}

            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.28em] text-stone-500">{isEditing ? "Editing" : "Create"}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-stone-950">
                  {isEditing ? "Редактирование видео" : "Добавить видео"}
                </h2>
              </div>
              {isEditing ? (
                <Link href="/admin/videos" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-800 shadow-sm">
                  Новое видео
                </Link>
              ) : null}
            </div>

            <form action={formAction} className="space-y-5">
              {isEditing ? <input type="hidden" name="videoId" value={selectedVideo.id} /> : null}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">VK ссылка на видео</span>
                <Input
                  name="videoUrl"
                  required
                  placeholder="https://vk.com/video-203029839_456239089"
                  defaultValue={selectedVideo?.videoUrl ?? ""}
                  className="h-11 rounded-xl border-stone-200 bg-stone-50/70 px-3"
                />
                <span className="mt-2 block text-xs leading-5 text-stone-500">
                  {isEditing
                    ? "Если поменяешь ссылку, название, описание, превью и длительность подтянем заново."
                    : "Название, описание, превью и длительность подтянем автоматически с бэкенда."}
                </span>
              </label>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-stone-700">Уровень</legend>
                <div className="space-y-2">
                  {surveyLevelOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-3 text-sm text-stone-800">
                      <input
                        type="radio"
                        name="level"
                        value={option.value}
                        defaultChecked={selectedVideo ? option.value === selectedVideo.level : option.value === surveyLevelOptions[0].value}
                        className="accent-stone-950"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-stone-700">Тип</legend>
                <div className="space-y-2">
                  {videoTypeOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-3 text-sm text-stone-800">
                      <input
                        type="radio"
                        name="type"
                        value={option.value}
                        defaultChecked={selectedVideo ? option.value === selectedVideo.type : option.value === videoTypeOptions[0].value}
                        className="accent-stone-950"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-stone-700">Интенсивность</legend>
                <div className="space-y-2">
                  {videoIntensityOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-3 text-sm text-stone-800">
                      <input
                        type="radio"
                        name="intensity"
                        value={option.value}
                        defaultChecked={selectedVideo ? option.value === selectedVideo.intensity : option.value === videoIntensityOptions[0].value}
                        className="accent-stone-950"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-stone-700">Goal tags</legend>
                <div className="space-y-2">
                  {surveyGoalOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-3 text-sm text-stone-800">
                      <input
                        type="checkbox"
                        name="goalTags"
                        value={option.value}
                        defaultChecked={selectedVideo?.goalTags.includes(option.value) ?? false}
                        className="accent-stone-950"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-stone-700">Focus tags</legend>
                <div className="space-y-2">
                  {surveyFocusAreaOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-3 text-sm text-stone-800">
                      <input
                        type="checkbox"
                        name="focusTags"
                        value={option.value}
                        defaultChecked={selectedVideo?.focusTags.includes(option.value) ?? false}
                        className="accent-stone-950"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-stone-700">Safety tags</legend>
                <div className="space-y-2">
                  {videoSafetyTagOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-3 text-sm text-stone-800">
                      <input
                        type="checkbox"
                        name="safetyTags"
                        value={option.value}
                        defaultChecked={selectedVideo?.safetyTags.includes(option.value) ?? false}
                        className="accent-stone-950"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-stone-700">Context tags</legend>
                <div className="space-y-2">
                  {videoContextTagOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-3 text-sm text-stone-800">
                      <input
                        type="checkbox"
                        name="contextTags"
                        value={option.value}
                        defaultChecked={selectedVideo?.contextTags.includes(option.value) ?? false}
                        className="accent-stone-950"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-3 text-sm text-stone-800">
                <input type="checkbox" name="isPublished" defaultChecked={selectedVideo?.isPublished ?? true} className="accent-stone-950" />
                Сразу публиковать
              </label>

              <button type="submit" className="w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white shadow-[0_16px_40px_rgba(28,25,23,0.16)]">
                {isEditing ? "Сохранить изменения" : "Добавить видео"}
              </button>
            </form>
          </section>

          <section className="hidden rounded-[2rem] border border-white/70 bg-white/82 p-5 shadow-[0_28px_90px_rgba(96,64,32,0.12)] lg:block sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.28em] text-stone-500">Library</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-stone-950">Уже заведённые видео</h2>
              </div>
              <p className="text-sm text-stone-500">{videos.length} шт.</p>
            </div>

            <div className="mt-5 space-y-3">
              {videos.length > 0 ? (
                videos.map((video) => {
                  const meta = buildVideoMeta(video);

                  return (
                    <article
                      key={video.id}
                      className={`relative rounded-[1.4rem] border bg-stone-50/70 px-4 py-4 transition-colors ${
                        selectedVideo?.id === video.id ? "border-stone-950 ring-1 ring-stone-950/10" : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <Link href={`/admin/videos?edit=${encodeURIComponent(video.id)}`} aria-label={`Редактировать ${video.title}`} className="absolute inset-0 rounded-[1.4rem]" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="relative z-10">
                          <h3 className="text-lg font-medium tracking-[-0.04em] text-stone-950">{video.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-stone-500">{video.description ?? "Без описания"}</p>
                        </div>
                        <span
                          className={`relative z-10 rounded-full px-3 py-1 text-xs ${
                            video.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-700"
                          }`}
                        >
                          {video.isPublished ? "published" : "draft"}
                        </span>
                      </div>
                      <p className="relative z-10 mt-3 text-xs uppercase tracking-[0.18em] text-stone-500">
                        {meta.typeLabel} • {meta.levelLabel} • {meta.durationLabel} • {meta.intensityLabel}
                      </p>
                      <p className="relative z-10 mt-2 text-sm text-stone-500">Goal: {video.goalTags.join(", ")}</p>
                      <p className="relative z-10 mt-1 text-sm text-stone-500">Focus: {video.focusTags.join(", ")}</p>
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="relative z-10 mt-3 inline-flex text-sm font-medium text-stone-900 underline underline-offset-4"
                      >
                        Открыть ссылку
                      </a>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-stone-300 bg-stone-50/70 px-4 py-4 text-sm leading-6 text-stone-600">
                  В библиотеке пока нет видео. Добавь первое справа и оно сразу начнёт участвовать в рекомендациях на главной.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      <MobileVideoLibrary selectedVideoId={selectedVideo?.id} videos={mobileLibraryVideos} />
    </main>
  );
}
