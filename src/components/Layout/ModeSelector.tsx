import { useQuizContext } from "../../context/QuizContext";
import type { AppMode, QuizMode } from "../../types/quiz";

export function ModeSelector() {
  const { state, dispatch } = useQuizContext();

  const setAppMode = (mode: AppMode) => dispatch({ type: "SET_APP_MODE", mode });
  const setQuizMode = (mode: QuizMode) => {
    dispatch({ type: "SET_APP_MODE", mode: "quiz" });
    dispatch({ type: "SET_QUIZ_MODE", mode });
  };

  return (
    <div className="mode-tabs">
      <button
        className={`mode-tab ${state.appMode === "learn" ? "active" : ""}`}
        onClick={() => setAppMode("learn")}
      >
        Lernen
      </button>
      <button
        className={`mode-tab ${state.appMode === "quiz" && state.quizMode === "multiple-choice" ? "active" : ""}`}
        onClick={() => setQuizMode("multiple-choice")}
      >
        Multiple Choice
      </button>
      <button
        className={`mode-tab ${state.appMode === "quiz" && state.quizMode === "map-to-name" ? "active" : ""}`}
        onClick={() => setQuizMode("map-to-name")}
      >
        Karte → Name
      </button>
      <button
        className={`mode-tab ${state.appMode === "quiz" && state.quizMode === "name-to-map" ? "active" : ""}`}
        onClick={() => setQuizMode("name-to-map")}
      >
        Name → Karte
      </button>
      <button
        className={`mode-tab ${state.appMode === "quiz" && state.quizMode === "route" ? "active" : ""}`}
        onClick={() => setQuizMode("route")}
      >
        Route
      </button>
      <button
        className={`mode-tab ${state.appMode === "stats" ? "active" : ""}`}
        onClick={() => setAppMode("stats")}
      >
        Statistik
      </button>
    </div>
  );
}
