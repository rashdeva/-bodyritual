import type {
  FitnessLevel as FitnessLevelValue,
  RestrictionLevel as RestrictionLevelValue,
  VideoIntensity as VideoIntensityValue,
  VideoType as VideoTypeValue,
  WarmupGoal as WarmupGoalValue,
} from "@/generated/prisma/enums";
import { FitnessLevel, RestrictionLevel, VideoIntensity, VideoType, WarmupGoal } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { surveyFocusAreaOptions, surveyGoalOptions, surveyLevelOptions, surveyRestrictionOptions, surveyTimeOptions } from "@/lib/video-survey";

export const videoTypeOptions = [
  { value: VideoType.WARMUP, label: "Разогрев" },
  { value: VideoType.MOBILITY, label: "Мобильность" },
  { value: VideoType.STRETCH, label: "Стретч" },
  { value: VideoType.RECOVERY, label: "Восстановление" },
] as const;

export const videoIntensityOptions = [
  { value: VideoIntensity.LOW, label: "Низкая" },
  { value: VideoIntensity.MEDIUM, label: "Средняя" },
  { value: VideoIntensity.HIGH, label: "Высокая" },
] as const;

export const videoSafetyTagOptions = [
  { value: "gentle", label: "Gentle" },
  { value: "no_jump", label: "No jump" },
  { value: "injury_caution", label: "Injury caution" },
] as const;

export const videoContextTagOptions = [
  { value: "morning", label: "Morning" },
  { value: "office", label: "Office" },
  { value: "pre_workout", label: "Pre-workout" },
  { value: "evening", label: "Evening" },
] as const;

const focusAreaSet = new Set<string>(surveyFocusAreaOptions.map((option) => option.value));
const timeOptionMap = new Map<string, number>(surveyTimeOptions.map((option) => [option.value, option.minutes]));

export type RecommendationProfile = {
  warmupGoal: WarmupGoalValue | null;
  fitnessLevel: FitnessLevelValue;
  focusAreas: string[];
  timeBudgetMinutes: number | null;
  restrictionLevel: RestrictionLevelValue | null;
};

export type RecommendedVideo = {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationSec: number;
  level: FitnessLevelValue;
  type: VideoTypeValue;
  intensity: VideoIntensityValue;
  videoUrl: string;
  thumbnailUrl: string | null;
  goalTags: WarmupGoalValue[];
  focusTags: string[];
  safetyTags: string[];
  contextTags: string[];
  score: number;
};

function getLevelRank(level: FitnessLevelValue) {
  switch (level) {
    case FitnessLevel.BEGINNER:
      return 1;
    case FitnessLevel.INTERMEDIATE:
      return 2;
    case FitnessLevel.ADVANCED:
      return 3;
    default:
      return 1;
  }
}

function getAllowedDurationSec(timeBudgetMinutes: number | null) {
  if (!timeBudgetMinutes) {
    return null;
  }

  return timeBudgetMinutes * 60;
}

function hasCompletedRecommendationProfile(profile: RecommendationProfile) {
  return Boolean(profile.warmupGoal && profile.focusAreas.length > 0 && profile.timeBudgetMinutes && profile.restrictionLevel);
}

function sanitizeFocusAreas(values: string[]) {
  return values.filter((value, index) => focusAreaSet.has(value) && values.indexOf(value) === index);
}

function durationLabel(durationSec: number) {
  const minutes = Math.max(1, Math.round(durationSec / 60));
  return `${minutes} мин`;
}

function getGoalLabel(goal: WarmupGoalValue | null) {
  return surveyGoalOptions.find((option) => option.value === goal)?.label ?? "Не выбрано";
}

function getRestrictionLabel(restriction: RestrictionLevelValue | null) {
  return surveyRestrictionOptions.find((option) => option.value === restriction)?.label ?? "Не выбрано";
}

function getLevelLabel(level: FitnessLevelValue) {
  return surveyLevelOptions.find((option) => option.value === level)?.label ?? "Уровень";
}

function getIntensityLabel(intensity: VideoIntensityValue) {
  switch (intensity) {
    case VideoIntensity.LOW:
      return "Низкая";
    case VideoIntensity.MEDIUM:
      return "Средняя";
    case VideoIntensity.HIGH:
      return "Высокая";
  }
}

function getTypeLabel(type: VideoTypeValue) {
  switch (type) {
    case VideoType.WARMUP:
      return "Разогрев";
    case VideoType.MOBILITY:
      return "Мобильность";
    case VideoType.STRETCH:
      return "Стретч";
    case VideoType.RECOVERY:
      return "Восстановление";
  }
}

function isSafetyCompatible(profile: RecommendationProfile, video: { safetyTags: string[]; intensity: VideoIntensityValue }) {
  if (!profile.restrictionLevel || profile.restrictionLevel === RestrictionLevel.NONE) {
    return true;
  }

  if (video.intensity === VideoIntensity.HIGH) {
    return false;
  }

  if (profile.restrictionLevel === RestrictionLevel.GENTLE_ONLY) {
    return true;
  }

  if (!video.safetyTags.includes("gentle")) {
    return false;
  }

  return true;
}

function scoreVideo(
  profile: RecommendationProfile,
  video: {
    durationSec: number;
    level: FitnessLevelValue;
    goalTags: WarmupGoalValue[];
    focusTags: string[];
    safetyTags: string[];
    contextTags: string[];
    intensity: VideoIntensityValue;
  },
) {
  const userLevelRank = getLevelRank(profile.fitnessLevel);
  const videoLevelRank = getLevelRank(video.level);
  const allowedDurationSec = getAllowedDurationSec(profile.timeBudgetMinutes);

  if (videoLevelRank > userLevelRank) {
    return Number.NEGATIVE_INFINITY;
  }

  if (allowedDurationSec && video.durationSec > allowedDurationSec) {
    return Number.NEGATIVE_INFINITY;
  }

  if (!isSafetyCompatible(profile, video)) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;

  if (profile.warmupGoal && video.goalTags.includes(profile.warmupGoal)) {
    score += 4;
  }

  const matchingFocusCount = profile.focusAreas.filter((focus) => video.focusTags.includes(focus)).length;
  score += matchingFocusCount * 2;

  if (matchingFocusCount === 0 && profile.focusAreas.length > 0 && video.focusTags.includes("full_body")) {
    score += 1;
  }

  if (video.level === profile.fitnessLevel) {
    score += 2;
  } else if (videoLevelRank < userLevelRank) {
    score += 1;
  }

  if (allowedDurationSec && video.durationSec >= Math.max(180, allowedDurationSec - 120) && video.durationSec <= allowedDurationSec) {
    score += 1;
  }

  if (profile.restrictionLevel && profile.restrictionLevel !== RestrictionLevel.NONE && video.safetyTags.includes("gentle")) {
    score += 3;
  }

  if (profile.restrictionLevel === RestrictionLevel.GENTLE_ONLY && video.safetyTags.includes("no_jump")) {
    score += 1;
  }

  if (
    profile.warmupGoal === WarmupGoal.DESK_RESET &&
    video.contextTags.includes("office")
  ) {
    score += 1;
  }

  if (
    profile.warmupGoal === WarmupGoal.PRE_WORKOUT &&
    video.contextTags.includes("pre_workout")
  ) {
    score += 1;
  }

  return score;
}

export async function getRecommendationProfile(userId: string): Promise<RecommendationProfile | null> {
  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: {
      warmupGoal: true,
      fitnessLevel: true,
      focusAreas: true,
      timeBudgetMinutes: true,
      restrictionLevel: true,
    },
  });

  if (!profile) {
    return null;
  }

  return {
    warmupGoal: profile.warmupGoal,
    fitnessLevel: profile.fitnessLevel,
    focusAreas: sanitizeFocusAreas(profile.focusAreas),
    timeBudgetMinutes: profile.timeBudgetMinutes,
    restrictionLevel: profile.restrictionLevel,
  };
}

export async function getTopRecommendedVideos(profile: RecommendationProfile, limit = 3): Promise<RecommendedVideo[]> {
  const videos = await db.video.findMany({
    where: { isPublished: true },
    orderBy: [{ createdAt: "desc" }],
  });

  if (!hasCompletedRecommendationProfile(profile)) {
    return videos.slice(0, limit).map((video) => ({
      id: video.id,
      slug: video.slug,
      title: video.title,
      description: video.description ?? "Видео доступно на главной странице.",
      durationSec: video.durationSec,
      level: video.level,
      type: video.type,
      intensity: video.intensity,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      goalTags: video.goalTags,
      focusTags: video.focusTags,
      safetyTags: video.safetyTags,
      contextTags: video.contextTags,
      score: 0,
    }));
  }

  const rankedVideos = videos
    .map((video) => ({
      ...video,
      score: scoreVideo(profile, video),
    }))
    .filter((video) => Number.isFinite(video.score) && video.score > 0)
    .sort((a, b) => b.score - a.score || a.durationSec - b.durationSec);

  const selectedVideos = (rankedVideos.length > 0 ? rankedVideos : videos).slice(0, limit);

  return selectedVideos.map((video) => {
    const score = "score" in video ? Number(video.score) : 0;

    return {
      id: video.id,
      slug: video.slug,
      title: video.title,
      description: video.description ?? "Подобрано под текущий запрос и твой уровень.",
      durationSec: video.durationSec,
      level: video.level,
      type: video.type,
      intensity: video.intensity,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      goalTags: video.goalTags,
      focusTags: video.focusTags,
      safetyTags: video.safetyTags,
      contextTags: video.contextTags,
      score,
    };
  });
}

export function parseSurveyFormData(formData: FormData) {
  const warmupGoal = formData.get("warmupGoal");
  const fitnessLevel = formData.get("fitnessLevel");
  const timeBudget = formData.get("timeBudget");
  const restrictionLevel = formData.get("restrictionLevel");
  const focusAreas = sanitizeFocusAreas(formData.getAll("focusAreas").map((value) => String(value)));

  if (!warmupGoal || !Object.values(WarmupGoal).includes(warmupGoal as WarmupGoalValue)) {
    throw new Error("Выбери цель разминки.");
  }

  if (!fitnessLevel || !Object.values(FitnessLevel).includes(fitnessLevel as FitnessLevelValue)) {
    throw new Error("Выбери свой уровень.");
  }

  if (focusAreas.length === 0) {
    throw new Error("Выбери хотя бы одну зону фокуса.");
  }

  if (!timeBudget || !timeOptionMap.has(String(timeBudget))) {
    throw new Error("Выбери длительность.");
  }

  if (!restrictionLevel || !Object.values(RestrictionLevel).includes(restrictionLevel as RestrictionLevelValue)) {
    throw new Error("Укажи ограничения.");
  }

  return {
    warmupGoal: warmupGoal as WarmupGoalValue,
    fitnessLevel: fitnessLevel as FitnessLevelValue,
    focusAreas,
    timeBudgetMinutes: timeOptionMap.get(String(timeBudget)) ?? null,
    restrictionLevel: restrictionLevel as RestrictionLevelValue,
  };
}

export function buildRecommendationSummary(profile: RecommendationProfile) {
  return {
    goalLabel: getGoalLabel(profile.warmupGoal),
    levelLabel: getLevelLabel(profile.fitnessLevel),
    restrictionLabel: getRestrictionLabel(profile.restrictionLevel),
    focusLabels: profile.focusAreas.map((focus) => surveyFocusAreaOptions.find((option) => option.value === focus)?.label ?? focus),
    timeLabel:
      surveyTimeOptions.find((option) => option.minutes === profile.timeBudgetMinutes)?.label ??
      (profile.timeBudgetMinutes ? `${profile.timeBudgetMinutes} минут` : "Не выбрано"),
  };
}

export function buildVideoMeta(video: Pick<RecommendedVideo, "durationSec" | "type" | "level" | "intensity">) {
  return {
    durationLabel: durationLabel(video.durationSec),
    typeLabel: getTypeLabel(video.type),
    levelLabel: getLevelLabel(video.level),
    intensityLabel: getIntensityLabel(video.intensity),
  };
}

export function recommendationProfileCompleted(profile: RecommendationProfile | null) {
  return profile ? hasCompletedRecommendationProfile(profile) : false;
}
