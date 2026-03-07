export interface StreetProgress {
  timesAsked: number;
  timesCorrect: number;
  lastAsked: number;
}

export interface LearnProgress {
  seen: Record<string, boolean>;
}

export interface AppProgress {
  version: number;
  streets: Record<string, StreetProgress>;
  learn: {
    hauptverkehr: LearnProgress;
    sonstige: LearnProgress;
    poi: LearnProgress;
  };
  totalSessions: number;
}

export const DEFAULT_PROGRESS: AppProgress = {
  version: 1,
  streets: {},
  learn: {
    hauptverkehr: { seen: {} },
    sonstige: { seen: {} },
    poi: { seen: {} },
  },
  totalSessions: 0,
};
