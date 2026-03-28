import type { FitnessLevel, RestrictionLevel, WarmupGoal } from "@/generated/prisma/enums";
import { FitnessLevel as FitnessLevelEnum, RestrictionLevel as RestrictionLevelEnum, WarmupGoal as WarmupGoalEnum } from "@/generated/prisma/enums";

export const surveyGoalOptions = [
  { value: WarmupGoalEnum.PRE_WORKOUT, label: "Разогреться перед тренировкой", description: "Короткий бодрый разогрев перед нагрузкой." },
  { value: WarmupGoalEnum.DESK_RESET, label: "Размяться после сидения", description: "Снять зажимы после офиса, дороги или долгой работы." },
  { value: WarmupGoalEnum.RECOVERY, label: "Восстановиться мягко", description: "Лёгкая активность без перегруза и резких движений." },
  { value: WarmupGoalEnum.FLEXIBILITY, label: "Улучшить гибкость", description: "Сессии на мобильность и диапазон движения." },
] as const;

export const surveyLevelOptions = [
  { value: FitnessLevelEnum.BEGINNER, label: "Новичок" },
  { value: FitnessLevelEnum.INTERMEDIATE, label: "Средний" },
  { value: FitnessLevelEnum.ADVANCED, label: "Продвинутый" },
] as const;

export const surveyFocusAreaOptions = [
  { value: "neck", label: "Шея" },
  { value: "shoulders", label: "Плечи" },
  { value: "upper_back", label: "Верх спины" },
  { value: "lower_back", label: "Поясница" },
  { value: "hips", label: "Таз и бёдра" },
  { value: "legs", label: "Ноги" },
  { value: "full_body", label: "Всё тело" },
] as const;

export const surveyTimeOptions = [
  { value: "3_5_min", label: "3-5 минут", minutes: 5 },
  { value: "5_10_min", label: "5-10 минут", minutes: 10 },
  { value: "10_plus_min", label: "10+ минут", minutes: 15 },
] as const;

export const surveyRestrictionOptions = [
  { value: RestrictionLevelEnum.NONE, label: "Без ограничений", description: "Показывать обычные варианты по уровню." },
  { value: RestrictionLevelEnum.GENTLE_ONLY, label: "Только мягко", description: "Без резкой интенсивности и жёсткой нагрузки." },
  { value: RestrictionLevelEnum.PAIN_OR_INJURY, label: "Есть боль или травма", description: "Только щадящие варианты с повышенным фильтром безопасности." },
] as const;

export type TimeBudgetValue = (typeof surveyTimeOptions)[number]["value"];

export type InitialSurveyValues = {
  warmupGoal: WarmupGoal | null;
  fitnessLevel: FitnessLevel | null;
  focusAreas: string[];
  timeBudget: TimeBudgetValue | null;
  restrictionLevel: RestrictionLevel | null;
};
