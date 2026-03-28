"use client";

import Link from "next/link";
import { startTransition, useState } from "react";

import { saveOnboardingSurvey } from "@/app/actions";
import type { InitialSurveyValues } from "@/lib/video-survey";
import {
  surveyFocusAreaOptions,
  surveyGoalOptions,
  surveyLevelOptions,
  surveyRestrictionOptions,
  surveyTimeOptions,
} from "@/lib/video-survey";

type WizardValues = InitialSurveyValues;

type OnboardingWizardProps = {
  errorMessage?: string;
  initialValues: WizardValues;
};

const totalSteps = 5;

function isStepComplete(step: number, values: WizardValues) {
  switch (step) {
    case 0:
      return Boolean(values.warmupGoal);
    case 1:
      return Boolean(values.fitnessLevel);
    case 2:
      return values.focusAreas.length > 0;
    case 3:
      return Boolean(values.timeBudget);
    case 4:
      return Boolean(values.restrictionLevel);
    default:
      return false;
  }
}

function StepDots({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-1.5 rounded-full transition-all ${index === currentStep ? "w-8 bg-stone-950" : "w-3 bg-stone-300"}`}
        />
      ))}
    </div>
  );
}

export function OnboardingWizard({ errorMessage, initialValues }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [values, setValues] = useState<WizardValues>(initialValues);

  function goNext() {
    if (!isStepComplete(currentStep, values)) {
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }

  function goBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fffef9_0%,#f6ede0_40%,#ecd9c6_100%)] px-4 py-4 sm:px-5 sm:py-6">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col rounded-[2rem] border border-white/70 bg-white/84 p-5 shadow-[0_28px_90px_rgba(96,64,32,0.12)] backdrop-blur sm:min-h-[720px] sm:max-w-xl sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700">
            Позже
          </Link>
          <StepDots currentStep={currentStep} />
          <span className="text-sm text-stone-500">
            {currentStep + 1}/{totalSteps}
          </span>
        </div>

        <div className="mt-6">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-stone-500">Onboarding</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-stone-950">
            Коротко настроим подбор разминок
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Главный экран останется экраном практики. Здесь мы просто один раз собираем профиль для подбора.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-[1.3rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <form
          action={(formData) => {
            setIsPending(true);
            startTransition(async () => {
              await saveOnboardingSurvey(formData);
            });
          }}
          className="mt-6 flex flex-1 flex-col"
        >
          <input type="hidden" name="warmupGoal" value={values.warmupGoal ?? ""} />
          <input type="hidden" name="fitnessLevel" value={values.fitnessLevel ?? ""} />
          <input type="hidden" name="timeBudget" value={values.timeBudget ?? ""} />
          <input type="hidden" name="restrictionLevel" value={values.restrictionLevel ?? ""} />
          {values.focusAreas.map((area) => (
            <input key={area} type="hidden" name="focusAreas" value={area} />
          ))}

          <div className="flex-1">
            {currentStep === 0 ? (
              <div>
                <p className="text-xl font-semibold tracking-[-0.05em] text-stone-950">Какая у тебя цель сейчас?</p>
                <div className="mt-5 space-y-3">
                  {surveyGoalOptions.map((option) => {
                    const active = values.warmupGoal === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValues((prev) => ({ ...prev, warmupGoal: option.value }))}
                        className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                          active ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-stone-50/80 text-stone-900"
                        }`}
                      >
                        <span className="block text-base font-medium">{option.label}</span>
                        <span className={`mt-2 block text-sm leading-6 ${active ? "text-stone-300" : "text-stone-600"}`}>{option.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div>
                <p className="text-xl font-semibold tracking-[-0.05em] text-stone-950">Какой у тебя уровень?</p>
                <div className="mt-5 grid gap-3">
                  {surveyLevelOptions.map((option) => {
                    const active = values.fitnessLevel === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValues((prev) => ({ ...prev, fitnessLevel: option.value }))}
                        className={`rounded-[1.5rem] border px-4 py-4 text-left text-base font-medium transition ${
                          active ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-stone-50/80 text-stone-900"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div>
                <p className="text-xl font-semibold tracking-[-0.05em] text-stone-950">На что хочешь сделать акцент?</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">Можно выбрать несколько зон.</p>
                <div className="mt-5 grid gap-3 grid-cols-2">
                  {surveyFocusAreaOptions.map((option) => {
                    const active = values.focusAreas.includes(option.value);

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setValues((prev) => ({
                            ...prev,
                            focusAreas: active
                              ? prev.focusAreas.filter((item) => item !== option.value)
                              : [...prev.focusAreas, option.value],
                          }))
                        }
                        className={`rounded-[1.4rem] border px-4 py-4 text-left text-sm font-medium transition ${
                          active ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-stone-50/80 text-stone-900"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div>
                <p className="text-xl font-semibold tracking-[-0.05em] text-stone-950">Сколько у тебя есть времени?</p>
                <div className="mt-5 grid gap-3">
                  {surveyTimeOptions.map((option) => {
                    const active = values.timeBudget === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValues((prev) => ({ ...prev, timeBudget: option.value }))}
                        className={`rounded-[1.5rem] border px-4 py-4 text-left text-base font-medium transition ${
                          active ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-stone-50/80 text-stone-900"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {currentStep === 4 ? (
              <div>
                <p className="text-xl font-semibold tracking-[-0.05em] text-stone-950">Есть ли ограничения?</p>
                <div className="mt-5 space-y-3">
                  {surveyRestrictionOptions.map((option) => {
                    const active = values.restrictionLevel === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValues((prev) => ({ ...prev, restrictionLevel: option.value }))}
                        className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                          active ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-stone-50/80 text-stone-900"
                        }`}
                      >
                        <span className="block text-base font-medium">{option.label}</span>
                        <span className={`mt-2 block text-sm leading-6 ${active ? "text-stone-300" : "text-stone-600"}`}>{option.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex items-center gap-3 border-t border-stone-200 pt-5">
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 0}
              className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-stone-700 disabled:opacity-40"
            >
              Назад
            </button>

            {currentStep < totalSteps - 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!isStepComplete(currentStep, values)}
                className="flex-1 rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white disabled:bg-stone-300"
              >
                Дальше
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isStepComplete(currentStep, values) || isPending}
                className="flex-1 rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white disabled:bg-stone-300"
              >
                {isPending ? "Сохраняем..." : "Завершить"}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
