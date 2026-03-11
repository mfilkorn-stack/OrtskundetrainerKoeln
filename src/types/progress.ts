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
    nahverkehr: LearnProgress;
    poi: LearnProgress;
  };
  totalSessions: number;
}

export const DEFAULT_PROGRESS: AppProgress = {
  version: 2,
  streets: {},
  learn: {
    hauptverkehr: { seen: {} },
    sonstige: { seen: {} },
    nahverkehr: { seen: {} },
    poi: { seen: {} },
  },
  totalSessions: 0,
};
