import { redirect } from "next/navigation";

import { DataEmptyState } from "@/components/bodyritual/data-empty-state";
import { HomeExperience } from "@/components/bodyritual/home-experience";
import { getHomeViewModel } from "@/lib/bodyritual-data";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

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
        description="Нужен хотя бы один активный пользователь с profile/progress и один active ritual с exercises/audioTracks. После этого home screen будет работать только на реальных данных из Postgres."
      />
    );
  }

  return <HomeExperience data={data} />;
}
