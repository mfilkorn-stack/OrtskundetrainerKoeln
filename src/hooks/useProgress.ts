import { useState, useCallback } from "react";
import type { AppProgress } from "../types/progress";
import type { LearnSection } from "../types/quiz";
import { loadProgress, saveProgress, resetProgress as resetStorage } from "../utils/storage";

export function useProgress() {
  const [progress, setProgress] = useState<AppProgress>(loadProgress);

  const recordAnswer = useCallback((streetId: string, correct: boolean) => {
    setProgress((prev) => {
      const existing = prev.streets[streetId] || { timesAsked: 0, timesCorrect: 0, lastAsked: 0 };
      const updated: AppProgress = {
        ...prev,
        streets: {
          ...prev.streets,
          [streetId]: {
            timesAsked: existing.timesAsked + 1,
            timesCorrect: existing.timesCorrect + (correct ? 1 : 0),
            lastAsked: Date.now(),
          },
        },
      };
      saveProgress(updated);
      return updated;
    });
  }, []);

  const markLearned = useCallback((section: LearnSection, itemId: string) => {
    setProgress((prev) => {
      const updated: AppProgress = {
        ...prev,
        learn: {
          ...prev.learn,
          [section]: {
            seen: { ...prev.learn[section].seen, [itemId]: true },
          },
        },
      };
      saveProgress(updated);
      return updated;
    });
  }, []);

  const resetLearnSection = useCallback((section: LearnSection) => {
    setProgress((prev) => {
      const updated: AppProgress = {
        ...prev,
        learn: {
          ...prev.learn,
          [section]: { seen: {} },
        },
      };
      saveProgress(updated);
      return updated;
    });
  }, []);

  const resetAll = useCallback(() => {
    resetStorage();
    setProgress(loadProgress());
  }, []);

  return { progress, recordAnswer, markLearned, resetLearnSection, resetAll };
}
