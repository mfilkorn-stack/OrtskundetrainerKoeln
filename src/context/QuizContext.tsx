import { createContext, useContext, useReducer, type ReactNode } from "react";
import type { QuizState, QuizAction } from "../types/quiz";

const initialState: QuizState = {
  appMode: "learn",
  quizMode: "multiple-choice",
  routeSubMode: "wache",
  learnSection: "hauptverkehr",
  activeDistricts: ["altstadt-nord", "altstadt-sued", "neustadt-nord", "neustadt-sued"],
  currentQuestion: null,
  currentRouteQuestion: null,
  score: 0,
  totalAnswered: 0,
  answered: false,
  lastAnswerCorrect: null,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "SET_APP_MODE":
      return { ...state, appMode: action.mode, answered: false, currentQuestion: null, currentRouteQuestion: null };
    case "SET_QUIZ_MODE":
      return { ...state, quizMode: action.mode, answered: false, currentQuestion: null, currentRouteQuestion: null };
    case "SET_ROUTE_SUB_MODE":
      return { ...state, routeSubMode: action.mode };
    case "SET_LEARN_SECTION":
      return { ...state, learnSection: action.section };
    case "TOGGLE_DISTRICT": {
      const districts = state.activeDistricts.includes(action.district)
        ? state.activeDistricts.filter((d) => d !== action.district)
        : [...state.activeDistricts, action.district];
      return { ...state, activeDistricts: districts.length > 0 ? districts : state.activeDistricts };
    }
    case "SET_QUESTION":
      return { ...state, currentQuestion: action.question, answered: false, lastAnswerCorrect: null };
    case "SET_ROUTE_QUESTION":
      return { ...state, currentRouteQuestion: action.question, answered: false, lastAnswerCorrect: null };
    case "ANSWER":
      return {
        ...state,
        answered: true,
        lastAnswerCorrect: action.correct,
        score: action.correct ? state.score + 1 : state.score,
        totalAnswered: state.totalAnswered + 1,
      };
    case "NEXT_QUESTION":
      return { ...state, answered: false, currentQuestion: null, currentRouteQuestion: null, lastAnswerCorrect: null };
    case "RESET_QUIZ":
      return { ...state, score: 0, totalAnswered: 0, currentQuestion: null, currentRouteQuestion: null, answered: false };
    default:
      return state;
  }
}

const QuizContext = createContext<{
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
} | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuizContext() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuizContext must be used within QuizProvider");
  return ctx;
}
