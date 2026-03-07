import type { District, Street } from "./street";

export type QuizMode = "map-to-name" | "name-to-map" | "multiple-choice" | "route";
export type LearnSection = "hauptverkehr" | "sonstige" | "poi";
export type AppMode = "learn" | "quiz" | "stats";
export type RouteSubMode = "wache" | "frei";

export interface QuizQuestion {
  type: QuizMode;
  targetStreet: Street;
  choices?: Street[];
}

export interface RouteQuizQuestion {
  start: { name: string; coordinates: [number, number] };
  end: { name: string; coordinates: [number, number] };
  subMode: RouteSubMode;
}

export interface QuizState {
  appMode: AppMode;
  quizMode: QuizMode;
  routeSubMode: RouteSubMode;
  learnSection: LearnSection;
  activeDistricts: District[];
  currentQuestion: QuizQuestion | null;
  currentRouteQuestion: RouteQuizQuestion | null;
  score: number;
  totalAnswered: number;
  answered: boolean;
  lastAnswerCorrect: boolean | null;
}

export type QuizAction =
  | { type: "SET_APP_MODE"; mode: AppMode }
  | { type: "SET_QUIZ_MODE"; mode: QuizMode }
  | { type: "SET_ROUTE_SUB_MODE"; mode: RouteSubMode }
  | { type: "SET_LEARN_SECTION"; section: LearnSection }
  | { type: "TOGGLE_DISTRICT"; district: District }
  | { type: "SET_QUESTION"; question: QuizQuestion }
  | { type: "SET_ROUTE_QUESTION"; question: RouteQuizQuestion }
  | { type: "ANSWER"; correct: boolean }
  | { type: "NEXT_QUESTION" }
  | { type: "RESET_QUIZ" };
