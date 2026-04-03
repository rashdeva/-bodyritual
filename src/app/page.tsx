import { redirect } from "next/navigation";

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
    redirect("/auth");
  }

  return <HomeExperience data={data} />;
}
