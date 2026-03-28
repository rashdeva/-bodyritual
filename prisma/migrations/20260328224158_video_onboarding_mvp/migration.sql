-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'PAUSED');

-- CreateEnum
CREATE TYPE "PreferredTime" AS ENUM ('MORNING', 'EVENING', 'BOTH');

-- CreateEnum
CREATE TYPE "FitnessLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "WarmupGoal" AS ENUM ('PRE_WORKOUT', 'DESK_RESET', 'RECOVERY', 'FLEXIBILITY');

-- CreateEnum
CREATE TYPE "RestrictionLevel" AS ENUM ('NONE', 'GENTLE_ONLY', 'PAIN_OR_INJURY');

-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('WARMUP', 'MOBILITY', 'STRETCH', 'RECOVERY');

-- CreateEnum
CREATE TYPE "VideoIntensity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RitualType" AS ENUM ('MORNING', 'EVENING');

-- CreateEnum
CREATE TYPE "RitualSessionStatus" AS ENUM ('STARTED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "DailyStatusType" AS ENUM ('COMPLETED', 'MISSED', 'REST');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "authProvider" TEXT,
    "authProviderAccountId" TEXT,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "goal" TEXT,
    "preferredTime" "PreferredTime" NOT NULL DEFAULT 'MORNING',
    "fitnessLevel" "FitnessLevel" NOT NULL DEFAULT 'BEGINNER',
    "warmupGoal" "WarmupGoal",
    "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timeBudgetMinutes" INTEGER,
    "restrictionLevel" "RestrictionLevel",
    "experiencePoints" INTEGER NOT NULL DEFAULT 0,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserProgress" (
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "rankPosition" INTEGER,
    "totalCompletedSessions" INTEGER NOT NULL DEFAULT 0,
    "weeklyCompletedSessions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Ritual" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "RitualType" NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 25,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ritual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "ritualId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationSeconds" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "audioCue" TEXT,
    "illustrationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioTrack" (
    "id" TEXT NOT NULL,
    "ritualId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "durationSeconds" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ru',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RitualSession" (
    "id" TEXT NOT NULL,
    "status" "RitualSessionStatus" NOT NULL DEFAULT 'STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedPercent" INTEGER NOT NULL DEFAULT 0,
    "earnedXp" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ritualId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RitualSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ritualType" "RitualType" NOT NULL,
    "status" "DailyStatusType" NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "durationSec" INTEGER NOT NULL,
    "level" "FitnessLevel" NOT NULL,
    "type" "VideoType" NOT NULL,
    "goalTags" "WarmupGoal"[],
    "focusTags" TEXT[],
    "safetyTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contextTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "intensity" "VideoIntensity" NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_authProvider_authProviderAccountId_key" ON "User"("authProvider", "authProviderAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Ritual_slug_key" ON "Ritual"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_ritualId_orderIndex_key" ON "Exercise"("ritualId", "orderIndex");

-- CreateIndex
CREATE INDEX "RitualSession_userId_createdAt_idx" ON "RitualSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RitualSession_ritualId_status_idx" ON "RitualSession"("ritualId", "status");

-- CreateIndex
CREATE INDEX "DailyStatus_userId_date_idx" ON "DailyStatus"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStatus_userId_date_ritualType_key" ON "DailyStatus"("userId", "date", "ritualType");

-- CreateIndex
CREATE UNIQUE INDEX "Video_slug_key" ON "Video"("slug");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_ritualId_fkey" FOREIGN KEY ("ritualId") REFERENCES "Ritual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioTrack" ADD CONSTRAINT "AudioTrack_ritualId_fkey" FOREIGN KEY ("ritualId") REFERENCES "Ritual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RitualSession" ADD CONSTRAINT "RitualSession_ritualId_fkey" FOREIGN KEY ("ritualId") REFERENCES "Ritual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RitualSession" ADD CONSTRAINT "RitualSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyStatus" ADD CONSTRAINT "DailyStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

