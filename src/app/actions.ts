"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { completeSessionForCurrentUser, startSessionForCurrentUser } from "@/lib/bodyritual-data";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchVkVideoMetadata } from "@/lib/vk-video";
import { parseSurveyFormData, videoContextTagOptions, videoIntensityOptions, videoSafetyTagOptions, videoTypeOptions } from "@/lib/video-recommendation";
import { surveyFocusAreaOptions, surveyGoalOptions, surveyLevelOptions } from "@/lib/video-survey";

export async function startRitualSession(ritualId: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }

  const result = await startSessionForCurrentUser(session.user.id, { ritualId });
  revalidatePath("/");
  return result;
}

export async function startVideoSession(videoId: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }

  const result = await startSessionForCurrentUser(session.user.id, { videoId });
  revalidatePath("/");
  return result;
}

export async function completeRitualSession(sessionId: string) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }

  const result = await completeSessionForCurrentUser(session.user.id, sessionId);
  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/profile");
  revalidatePath(`/result/${sessionId}`);
  return result;
}

export async function saveOnboardingSurvey(formData: FormData) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  try {
    const payload = parseSurveyFormData(formData);

    await db.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        fitnessLevel: payload.fitnessLevel,
        warmupGoal: payload.warmupGoal,
        focusAreas: payload.focusAreas,
        timeBudgetMinutes: payload.timeBudgetMinutes,
        restrictionLevel: payload.restrictionLevel,
      },
      create: {
        userId: session.user.id,
        fitnessLevel: payload.fitnessLevel,
        warmupGoal: payload.warmupGoal,
        focusAreas: payload.focusAreas,
        timeBudgetMinutes: payload.timeBudgetMinutes,
        restrictionLevel: payload.restrictionLevel,
      },
    });

    await db.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    });

    revalidatePath("/");
    revalidatePath("/onboarding");
    revalidatePath("/profile");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить ответы.";
    redirect(`/onboarding?error=${encodeURIComponent(message)}`);
  }

  redirect("/");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function requireAdminUser() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  return session.user.id;
}

function parseAdminVideoFormData(formData: FormData) {
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const intensity = String(formData.get("intensity") ?? "").trim();
  const goalTags = formData.getAll("goalTags").map((value) => String(value));
  const focusTags = formData.getAll("focusTags").map((value) => String(value));
  const safetyTags = formData.getAll("safetyTags").map((value) => String(value));
  const contextTags = formData.getAll("contextTags").map((value) => String(value));
  const isPublished = formData.get("isPublished") === "on";

  const allowedLevels = new Set<string>(surveyLevelOptions.map((option) => option.value));
  const allowedTypes = new Set<string>(videoTypeOptions.map((option) => option.value));
  const allowedIntensity = new Set<string>(videoIntensityOptions.map((option) => option.value));
  const allowedGoals = new Set<string>(surveyGoalOptions.map((option) => option.value));
  const allowedFocus = new Set<string>(surveyFocusAreaOptions.map((option) => option.value));
  const allowedSafety = new Set<string>(videoSafetyTagOptions.map((option) => option.value));
  const allowedContexts = new Set<string>(videoContextTagOptions.map((option) => option.value));

  if (!videoUrl) {
    throw new Error("VK video URL is required.");
  }

  if (!allowedLevels.has(level as (typeof surveyLevelOptions)[number]["value"])) {
    throw new Error("Invalid level.");
  }

  if (!allowedTypes.has(type as (typeof videoTypeOptions)[number]["value"])) {
    throw new Error("Invalid type.");
  }

  if (!allowedIntensity.has(intensity as (typeof videoIntensityOptions)[number]["value"])) {
    throw new Error("Invalid intensity.");
  }

  if (goalTags.length === 0 || goalTags.some((value) => !allowedGoals.has(value as (typeof surveyGoalOptions)[number]["value"]))) {
    throw new Error("Select at least one valid goal tag.");
  }

  if (focusTags.length === 0 || focusTags.some((value) => !allowedFocus.has(value))) {
    throw new Error("Select at least one valid focus tag.");
  }

  if (safetyTags.some((value) => !allowedSafety.has(value))) {
    throw new Error("Invalid safety tag.");
  }

  if (contextTags.some((value) => !allowedContexts.has(value))) {
    throw new Error("Invalid context tag.");
  }

  return {
    videoUrl,
    level: level as (typeof surveyLevelOptions)[number]["value"],
    type: type as (typeof videoTypeOptions)[number]["value"],
    intensity: intensity as (typeof videoIntensityOptions)[number]["value"],
    goalTags: goalTags as Array<(typeof surveyGoalOptions)[number]["value"]>,
    focusTags,
    safetyTags,
    contextTags,
    isPublished,
  };
}

export async function createAdminVideo(formData: FormData) {
  await requireAdminUser();

  try {
    const payload = parseAdminVideoFormData(formData);
    const metadata = await fetchVkVideoMetadata(payload.videoUrl);
    const baseSlug = slugify(metadata.title) || "video";
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    await db.video.create({
      data: {
        slug,
        title: metadata.title,
        description: metadata.description,
        videoUrl: payload.videoUrl,
        thumbnailUrl: metadata.thumbnailUrl,
        durationSec: metadata.durationSec,
        level: payload.level,
        type: payload.type,
        intensity: payload.intensity,
        goalTags: payload.goalTags,
        focusTags: payload.focusTags,
        safetyTags: payload.safetyTags,
        contextTags: payload.contextTags,
        isPublished: payload.isPublished,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/videos");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create video.";
    redirect(`/admin/videos?error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/videos?created=1");
}

export async function updateAdminVideo(formData: FormData) {
  await requireAdminUser();

  const videoId = String(formData.get("videoId") ?? "").trim();

  try {
    if (!videoId) {
      throw new Error("Video id is required.");
    }

    const existingVideo = await db.video.findUnique({
      where: { id: videoId },
    });

    if (!existingVideo) {
      throw new Error("Video not found.");
    }

    const payload = parseAdminVideoFormData(formData);
    const nextData = {
      videoUrl: payload.videoUrl,
      level: payload.level,
      type: payload.type,
      intensity: payload.intensity,
      goalTags: payload.goalTags,
      focusTags: payload.focusTags,
      safetyTags: payload.safetyTags,
      contextTags: payload.contextTags,
      isPublished: payload.isPublished,
    };

    if (existingVideo.videoUrl === payload.videoUrl) {
      await db.video.update({
        where: { id: videoId },
        data: nextData,
      });
    } else {
      const metadata = await fetchVkVideoMetadata(payload.videoUrl);

      await db.video.update({
        where: { id: videoId },
        data: {
          ...nextData,
          title: metadata.title,
          description: metadata.description,
          thumbnailUrl: metadata.thumbnailUrl,
          durationSec: metadata.durationSec,
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/admin/videos");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update video.";
    redirect(`/admin/videos?edit=${encodeURIComponent(videoId)}&error=${encodeURIComponent(message)}`);
  }

  redirect("/admin/videos?updated=1");
}
