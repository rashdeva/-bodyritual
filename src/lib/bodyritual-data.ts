import type {
  DailyStatusType as DailyStatusTypeValue,
  FitnessLevel as FitnessLevelValue,
  PreferredTime as PreferredTimeValue,
} from "@/generated/prisma/enums";
import { DailyStatusType, RitualSessionStatus, RitualType, UserStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { buildRecommendationSummary, buildVideoMeta, getTopRecommendedVideos, type RecommendedVideo } from "@/lib/video-recommendation";
import { buildVkVideoEmbedUrl } from "@/lib/vk-video";

type HomeCommunityUser = {
  id: string;
  name: string;
  avatarUrl: string | null;
  level: number;
  streak: number;
  xp: number;
  rank: number;
  isCurrentUser: boolean;
  x: number;
  y: number;
};

export type HomeViewModel = {
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    level: number;
    streak: number;
    xp: number;
    rank: number;
    goal: string;
    preferredTime: PreferredTimeValue;
  };
  statusLine: string;
  statusHint: string;
  ritual: {
    id: string;
    title: string;
    type: typeof RitualType.MORNING | typeof RitualType.EVENING;
    description: string;
    durationMinutes: number;
    xpReward: number;
    audioTitle: string;
    audioUrl: string | null;
    exercises: Array<{
      id: string;
      title: string;
      description: string;
      durationSeconds: number;
      audioCue: string;
      orderIndex: number;
    }>;
  };
  recommendationProfile: {
    goalLabel: string;
    levelLabel: string;
    restrictionLabel: string;
    focusLabels: string[];
    timeLabel: string;
  };
  recommendations: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    durationLabel: string;
    typeLabel: string;
    levelLabel: string;
    intensityLabel: string;
    focusLabels: string[];
    videoUrl: string;
    embedUrl: string | null;
  }>;
  community: HomeCommunityUser[];
  completedToday: boolean;
  completedSessionId: string | null;
};

export type LeaderboardViewModel = {
  currentUserId: string;
  currentUserRank: number;
  entries: Array<{
    id: string;
    rank: number;
    name: string;
    avatarUrl: string | null;
    level: number;
    streak: number;
    xp: number;
    isCurrentUser: boolean;
  }>;
};

export type ResultViewModel = {
  sessionId: string;
  ritualTitle: string;
  durationMinutes: number;
  earnedXp: number;
  streak: number;
  level: number;
  rankBefore: number | null;
  rankAfter: number | null;
  completedAtLabel: string;
};

export type ProfileViewModel = {
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    level: number;
    xp: number;
    streak: number;
    longestStreak: number;
    goal: string;
    preferredTime: PreferredTimeValue;
    fitnessLevel: FitnessLevelValue;
    totalCompletedSessions: number;
    warmupGoal: string;
    focusAreas: string[];
    timeBudgetMinutes: number | null;
    restrictionLabel: string;
  };
  calendar: Array<{
    date: string;
    shortLabel: string;
    status: DailyStatusTypeValue | "EMPTY";
  }>;
  recentSessions: Array<{
    id: string;
    title: string;
    completedAt: string;
    earnedXp: number;
    durationMinutes: number;
  }>;
};

function getStartOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDayPart(timezone: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );

  return hour < 16 ? RitualType.MORNING : RitualType.EVENING;
}

function getDayPartLabel(type: typeof RitualType.MORNING | typeof RitualType.EVENING) {
  return type === RitualType.MORNING ? "Утро" : "Вечер";
}

function getWeekStart(date = new Date()) {
  const weekStart = new Date(getStartOfDay(date));
  const day = weekStart.getDay();
  const offset = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - offset);
  return weekStart;
}

function calculateLevelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 120) + 1);
}

function mapRecommendation(video: RecommendedVideo) {
  const meta = buildVideoMeta(video);

  return {
    id: video.id,
    slug: video.slug,
    title: video.title,
    description: video.description,
    durationLabel: meta.durationLabel,
    typeLabel: meta.typeLabel,
    levelLabel: meta.levelLabel,
    intensityLabel: meta.intensityLabel,
    focusLabels: video.focusTags,
    videoUrl: video.videoUrl,
    embedUrl: buildVkVideoEmbedUrl(video.videoUrl),
  };
}

function buildCloudPositions(length: number) {
  const points = [
    [10, 78],
    [20, 72],
    [33, 66],
    [46, 70],
    [58, 58],
    [71, 64],
    [82, 54],
    [16, 48],
    [35, 46],
    [61, 40],
    [78, 32],
    [48, 28],
  ];

  return Array.from({ length }, (_, index) => {
    const point = points[index % points.length] ?? [50, 50];
    return { x: point[0], y: point[1] };
  });
}

async function assertDatabaseReady() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await db.$queryRaw`SELECT 1`;
}

async function refreshRankPositions() {
  const progress = await db.userProgress.findMany({
    orderBy: [{ xp: "desc" }, { updatedAt: "asc" }],
  });

  await Promise.all(
    progress.map((entry, index) =>
      db.userProgress.update({
        where: { userId: entry.userId },
        data: { rankPosition: index + 1 },
      }),
    ),
  );
}

async function getCurrentUserRecord(userId: string) {
  const user = await db.user.findFirst({
    where: {
      id: userId,
      status: UserStatus.ACTIVE,
      profile: { isNot: null },
      progress: { isNot: null },
    },
    include: {
      profile: true,
      progress: true,
    },
    orderBy: [{ createdAt: "asc" }],
  });

  if (!user?.profile || !user.progress) {
    return null;
  }

  return user;
}

async function getLeaderboardRecords() {
  await refreshRankPositions();

  return db.user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      progress: { isNot: null },
    },
    include: {
      progress: true,
      profile: true,
    },
    orderBy: [{ xpTotal: "desc" }, { createdAt: "asc" }],
    take: 20,
  });
}

async function calculateRankForUser(userId: string) {
  const ordered = await db.userProgress.findMany({
    orderBy: [{ xp: "desc" }, { updatedAt: "asc" }],
    select: { userId: true },
  });

  return ordered.findIndex((entry) => entry.userId === userId) + 1;
}

export async function getHomeViewModel(userId: string): Promise<HomeViewModel | null> {
  await assertDatabaseReady();

  const [currentUser, leaderboard] = await Promise.all([getCurrentUserRecord(userId), getLeaderboardRecords()]);
  if (!currentUser) {
    return null;
  }

  const ritualType = getDayPart(currentUser.timezone);
  const today = getStartOfDay();
  const currentProfile = currentUser.profile!;
  const currentProgress = currentUser.progress!;
  const recommendationProfile = {
    warmupGoal: currentProfile.warmupGoal,
    fitnessLevel: currentProfile.fitnessLevel,
    focusAreas: currentProfile.focusAreas,
    timeBudgetMinutes: currentProfile.timeBudgetMinutes,
    restrictionLevel: currentProfile.restrictionLevel,
  };

  const [ritual, todayStatus, recommendations] = await Promise.all([
    db.ritual.findFirst({
      where: { type: ritualType, isActive: true },
      include: {
        exercises: { orderBy: { orderIndex: "asc" } },
        audioTracks: { take: 1, orderBy: { createdAt: "asc" } },
      },
    }),
    db.dailyStatus.findFirst({
      where: {
        userId: currentUser.id,
        ritualType,
        date: today,
      },
      orderBy: { updatedAt: "desc" },
    }),
    getTopRecommendedVideos(recommendationProfile, 4),
  ]);

  if (process.env.NODE_ENV !== "production") {
    console.info("[home] recommendation profile", {
      userId,
      warmupGoal: recommendationProfile.warmupGoal,
      fitnessLevel: recommendationProfile.fitnessLevel,
      focusAreas: recommendationProfile.focusAreas,
      timeBudgetMinutes: recommendationProfile.timeBudgetMinutes,
      restrictionLevel: recommendationProfile.restrictionLevel,
    });
    console.info("[home] recommendations resolved", {
      userId,
      count: recommendations.length,
      featuredVideoId: recommendations[0]?.id ?? null,
      featuredVideoTitle: recommendations[0]?.title ?? null,
      featuredVideoUrl: recommendations[0]?.videoUrl ?? null,
    });
  }

  if (!ritual || ritual.exercises.length === 0) {
    return null;
  }

  const positions = buildCloudPositions(Math.min(leaderboard.length, 12));

  return {
    user: {
      id: currentUser.id,
      name: currentUser.displayName,
      avatarUrl: currentUser.avatarUrl,
      level: currentProgress.level,
      streak: currentProgress.streak,
      xp: currentProgress.xp,
      rank: currentProgress.rankPosition ?? 1,
      goal: currentProfile.goal ?? "Держать мягкий ежедневный ритм",
      preferredTime: currentProfile.preferredTime,
    },
    statusLine: `${getDayPartLabel(ritualType)}• Уровень ${currentProfile.currentLevel} • День ${currentProgress.streak} `,
    statusHint:
      todayStatus?.status === DailyStatusType.COMPLETED
        ? "Сегодняшний ритуал уже завершён. Можно посмотреть результат."
        : "Твой ритуал уже готов. Один тап и зарядка начнётся.",
    ritual: {
      id: ritual.id,
      title: ritual.title,
      type: ritual.type,
      description: ritual.description ?? "Короткий голосовой ритуал без перегруза.",
      durationMinutes: ritual.durationMinutes,
      xpReward: ritual.xpReward,
      audioTitle: ritual.audioTracks[0]?.title ?? "Голосовой ритуал",
      audioUrl: ritual.audioTracks[0]?.fileUrl ?? null,
      exercises: ritual.exercises.map((exercise) => ({
        id: exercise.id,
        title: exercise.title,
        description: exercise.description ?? exercise.audioCue ?? exercise.title,
        durationSeconds: exercise.durationSeconds,
        audioCue: exercise.audioCue ?? exercise.title,
        orderIndex: exercise.orderIndex,
      })),
    },
    recommendationProfile: buildRecommendationSummary(recommendationProfile),
    recommendations: recommendations.map(mapRecommendation),
    community: leaderboard.slice(0, 12).map((entry, index) => ({
      id: entry.id,
      name: entry.displayName,
      avatarUrl: entry.avatarUrl,
      level: entry.progress?.level ?? 1,
      streak: entry.progress?.streak ?? 0,
      xp: entry.progress?.xp ?? 0,
      rank: entry.progress?.rankPosition ?? index + 1,
      isCurrentUser: entry.id === currentUser.id,
      x: positions[index]?.x ?? 50,
      y: positions[index]?.y ?? 50,
    })),
    completedToday: todayStatus?.status === DailyStatusType.COMPLETED,
    completedSessionId: todayStatus?.sessionId ?? null,
  };
}

export async function getLeaderboardViewModel(userId: string): Promise<LeaderboardViewModel | null> {
  await assertDatabaseReady();

  const [currentUser, leaderboard] = await Promise.all([getCurrentUserRecord(userId), getLeaderboardRecords()]);
  if (!currentUser) {
    return null;
  }

  return {
    currentUserId: currentUser.id,
    currentUserRank: currentUser.progress!.rankPosition ?? 1,
    entries: leaderboard.map((entry, index) => ({
      id: entry.id,
      rank: entry.progress?.rankPosition ?? index + 1,
      name: entry.displayName,
      avatarUrl: entry.avatarUrl,
      level: entry.progress?.level ?? 1,
      streak: entry.progress?.streak ?? 0,
      xp: entry.progress?.xp ?? 0,
      isCurrentUser: entry.id === currentUser.id,
    })),
  };
}

export async function getProfileViewModel(userId: string): Promise<ProfileViewModel | null> {
  await assertDatabaseReady();

  const currentUser = await getCurrentUserRecord(userId);
  if (!currentUser) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: currentUser.id },
    include: {
      profile: true,
      progress: true,
      ritualSessions: {
        where: { status: RitualSessionStatus.COMPLETED },
        include: { ritual: true },
        orderBy: { completedAt: "desc" },
        take: 8,
      },
      dailyStatuses: {
        orderBy: { date: "asc" },
        take: 21,
      },
    },
  });

  if (!user?.profile || !user.progress) {
    return null;
  }

  const recommendationSummary = buildRecommendationSummary({
    warmupGoal: user.profile.warmupGoal,
    fitnessLevel: user.profile.fitnessLevel,
    focusAreas: user.profile.focusAreas,
    timeBudgetMinutes: user.profile.timeBudgetMinutes,
    restrictionLevel: user.profile.restrictionLevel,
  });

  return {
    user: {
      id: user.id,
      name: user.displayName,
      avatarUrl: user.avatarUrl,
      level: user.progress.level,
      xp: user.progress.xp,
      streak: user.progress.streak,
      longestStreak: user.profile.longestStreak,
      goal: user.profile.goal ?? "Держать мягкий ежедневный ритм",
      preferredTime: user.profile.preferredTime,
      fitnessLevel: user.profile.fitnessLevel,
      totalCompletedSessions: user.progress.totalCompletedSessions,
      warmupGoal: recommendationSummary.goalLabel,
      focusAreas: recommendationSummary.focusLabels,
      timeBudgetMinutes: user.profile.timeBudgetMinutes,
      restrictionLabel: recommendationSummary.restrictionLabel,
    },
    calendar: user.dailyStatuses.map((status) => ({
      date: status.date.toISOString(),
      shortLabel: new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(status.date),
      status: status.status,
    })),
    recentSessions: user.ritualSessions.map((session) => ({
      id: session.id,
      title: session.ritual.title,
      completedAt: session.completedAt
        ? new Intl.DateTimeFormat("ru-RU", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          }).format(session.completedAt)
        : "В процессе",
      earnedXp: session.earnedXp,
      durationMinutes: session.ritual.durationMinutes,
    })),
  };
}

export async function getResultViewModel(sessionId: string, userId: string): Promise<ResultViewModel | null> {
  await assertDatabaseReady();

  const session = await db.ritualSession.findUnique({
    where: { id: sessionId },
    include: {
      ritual: true,
      user: {
        include: {
          profile: true,
          progress: true,
        },
      },
    },
  });

  if (!session?.user.profile || !session.user.progress || session.userId !== userId) {
    return null;
  }

  let noteData: { rankBefore?: number | null; rankAfter?: number | null } = {};
  if (session.notes) {
    try {
      noteData = JSON.parse(session.notes) as { rankBefore?: number | null; rankAfter?: number | null };
    } catch {
      noteData = {};
    }
  }

  return {
    sessionId: session.id,
    ritualTitle: session.ritual.title,
    durationMinutes: session.ritual.durationMinutes,
    earnedXp: session.earnedXp,
    streak: session.user.progress.streak,
    level: session.user.progress.level,
    rankBefore: noteData.rankBefore ?? null,
    rankAfter: noteData.rankAfter ?? session.user.progress.rankPosition ?? null,
    completedAtLabel: session.completedAt
      ? new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        }).format(session.completedAt)
      : "Только что",
  };
}

export async function startSessionForCurrentUser(userId: string, ritualId: string) {
  await assertDatabaseReady();

  const user = await getCurrentUserRecord(userId);
  if (!user) {
    throw new Error("No active user with profile and progress found in the database.");
  }

  const session = await db.ritualSession.create({
    data: {
      ritualId,
      userId: user.id,
      status: RitualSessionStatus.STARTED,
      startedAt: new Date(),
      completedPercent: 0,
    },
  });

  return { sessionId: session.id };
}

export async function completeSessionForCurrentUser(userId: string, sessionId: string) {
  await assertDatabaseReady();

  const session = await db.ritualSession.findUnique({
    where: { id: sessionId },
    include: {
      ritual: true,
      user: {
        include: {
          profile: true,
          progress: true,
        },
      },
    },
  });

  if (!session?.user.profile || !session.user.progress || session.userId !== userId) {
    throw new Error("Session not found.");
  }

  const completedAt = new Date();
  const today = getStartOfDay(completedAt);
  const weekStart = getWeekStart(completedAt);
  const rankBefore = await calculateRankForUser(session.userId);
  const newXp = session.user.progress.xp + session.ritual.xpReward;
  const newStreak = session.user.progress.streak + 1;
  const newLevel = calculateLevelFromXp(newXp);

  await db.$transaction([
    db.ritualSession.update({
      where: { id: sessionId },
      data: {
        status: RitualSessionStatus.COMPLETED,
        completedAt,
        completedPercent: 100,
        earnedXp: session.ritual.xpReward,
      },
    }),
    db.user.update({
      where: { id: session.userId },
      data: {
        xpTotal: newXp,
      },
    }),
    db.userProfile.update({
      where: { userId: session.userId },
      data: {
        experiencePoints: newXp,
        currentLevel: newLevel,
        currentStreak: newStreak,
        longestStreak: Math.max(session.user.profile.longestStreak, newStreak),
      },
    }),
    db.userProgress.update({
      where: { userId: session.userId },
      data: {
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        totalCompletedSessions: { increment: 1 },
        weeklyCompletedSessions: session.startedAt && session.startedAt >= weekStart ? { increment: 1 } : 1,
      },
    }),
    db.dailyStatus.upsert({
      where: {
        userId_date_ritualType: {
          userId: session.userId,
          date: today,
          ritualType: session.ritual.type,
        },
      },
      create: {
        userId: session.userId,
        date: today,
        ritualType: session.ritual.type,
        status: DailyStatusType.COMPLETED,
        sessionId,
      },
      update: {
        status: DailyStatusType.COMPLETED,
        sessionId,
      },
    }),
  ]);

  await refreshRankPositions();
  const rankAfter = await calculateRankForUser(session.userId);

  await db.ritualSession.update({
    where: { id: sessionId },
    data: {
      notes: JSON.stringify({ rankBefore, rankAfter }),
    },
  });

  return { sessionId };
}
