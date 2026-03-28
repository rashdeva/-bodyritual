"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type MobileVideoLibraryProps = {
  selectedVideoId?: string;
  videos: Array<{
    id: string;
    title: string;
    description: string | null;
    videoUrl: string;
    isPublished: boolean;
    metaLabel: string;
    goalTags: string[];
    focusTags: string[];
  }>;
};

export function MobileVideoLibrary({ selectedVideoId, videos }: MobileVideoLibraryProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (videos.length === 0) {
    return null;
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto flex w-full items-center justify-between rounded-full border border-stone-900/10 bg-stone-950 px-5 py-4 text-left text-white shadow-[0_18px_60px_rgba(28,25,23,0.32)]"
        >
          <span>
            <span className="block text-[0.7rem] uppercase tracking-[0.26em] text-white/55">Library</span>
            <span className="mt-1 block text-sm font-medium">
              {selectedVideoId ? "Сменить или открыть видео" : "Открыть добавленные видео"}
            </span>
          </span>
          <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium">{videos.length} шт.</span>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-video-library-title">
          <button type="button" aria-label="Закрыть список видео" className="absolute inset-0 bg-stone-950/45 backdrop-blur-[2px]" onClick={() => setOpen(false)} />

          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-hidden rounded-t-[2rem] border border-white/70 bg-[linear-gradient(180deg,#fffefb_0%,#f7eee2_70%,#f1e2d2_100%)] shadow-[0_-18px_60px_rgba(28,25,23,0.22)]">
            <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-stone-300" />
            <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-4">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.26em] text-stone-500">Library</p>
                <h2 id="mobile-video-library-title" className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-stone-950">
                  Уже добавленные видео
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">Выбери карточку, чтобы открыть редактирование, или перейди во VK.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-sm text-stone-700"
              >
                Закрыть
              </button>
            </div>

            <div className="max-h-[calc(82vh-7.5rem)] space-y-3 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
              {videos.map((video) => (
                <article
                  key={video.id}
                  className={`relative rounded-[1.4rem] border bg-white/78 px-4 py-4 shadow-[0_10px_35px_rgba(96,64,32,0.08)] ${
                    selectedVideoId === video.id ? "border-stone-950 ring-1 ring-stone-950/10" : "border-stone-200"
                  }`}
                >
                  <Link
                    href={`/admin/videos?edit=${encodeURIComponent(video.id)}`}
                    aria-label={`Редактировать ${video.title}`}
                    onClick={() => setOpen(false)}
                    className="absolute inset-0 rounded-[1.4rem]"
                  />
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-medium tracking-[-0.03em] text-stone-950">{video.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-stone-500">{video.description ?? "Без описания"}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                        video.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {video.isPublished ? "published" : "draft"}
                    </span>
                  </div>
                  <p className="relative z-10 mt-3 text-[0.7rem] uppercase tracking-[0.18em] text-stone-500">{video.metaLabel}</p>
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
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
