import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/bodyritual/onboarding-wizard";
import { getAuthSession } from "@/lib/auth";
import { getRecommendationProfile } from "@/lib/video-recommendation";
import { surveyTimeOptions } from "@/lib/video-survey";

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const [params, profile] = await Promise.all([searchParams, getRecommendationProfile(session.user.id)]);
  const selectedTime = surveyTimeOptions.find((option) => option.minutes === profile?.timeBudgetMinutes)?.value ?? null;

  return (
    <OnboardingWizard
      errorMessage={params.error}
      initialValues={{
        warmupGoal: profile?.warmupGoal ?? null,
        fitnessLevel: profile?.fitnessLevel ?? null,
        focusAreas: profile?.focusAreas ?? [],
        timeBudget: selectedTime,
        restrictionLevel: profile?.restrictionLevel ?? null,
      }}
    />
  );
}
