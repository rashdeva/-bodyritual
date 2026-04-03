import { redirect } from "next/navigation";

import { DataEmptyState } from "@/components/bodyritual/data-empty-state";
import { HomeExperience } from "@/components/bodyritual/home-experience";
import { getHomeViewModel } from "@/lib/bodyritual-data";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildVkVideoEmbedUrl } from "@/lib/vk-video";

const HOME_FALLBACK_VIDEO_URL = "https://vk.com/video-54183890_456239641";

export default async function HomePage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true },
  });

  if (!user?.onboardingCompleted) {
    redirect("/onboarding");
  }

  const data = await getHomeViewModel(session.user.id);

  if (!data) {
    return (
      <DataEmptyState
        title="В базе пока не хватает данных для главного экрана"
        description="Для video-first главной нужен хотя бы один опубликованный video в Postgres. Пока подборка пуста, можно открыть резервное видео."
        adminHref="/admin/videos"
        fallbackVideoUrl={HOME_FALLBACK_VIDEO_URL}
        fallbackVideoEmbedUrl={buildVkVideoEmbedUrl(HOME_FALLBACK_VIDEO_URL)}
        fallbackVideoTitle="Резервное видео для главного экрана"
      />
    );
  }

  return <HomeExperience data={data} />;
}
