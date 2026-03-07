import type { AppProgress } from "../types/progress";
import { DEFAULT_PROGRESS } from "../types/progress";

const STORAGE_KEY = "ortskundetrainer-koeln-progress";

export function loadProgress(): AppProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as AppProgress;
    if (parsed.version !== DEFAULT_PROGRESS.version) {
      return { ...DEFAULT_PROGRESS };
    }
    return parsed;
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: AppProgress): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}
