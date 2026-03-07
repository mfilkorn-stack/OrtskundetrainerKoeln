import { useState, useEffect } from "react";
import "./App.css";
import { QuizProvider, useQuizContext } from "./context/QuizContext";
import { useStreetData } from "./hooks/useStreetData";
import { Header } from "./components/Layout/Header";
import { ModeSelector } from "./components/Layout/ModeSelector";
import { DistrictFilter } from "./components/Layout/DistrictFilter";
import { LearnMode } from "./components/Learn/LearnMode";
import { MultipleChoice } from "./components/Quiz/MultipleChoice";
import { MapToName } from "./components/Quiz/MapToName";
import { NameToMap } from "./components/Quiz/NameToMap";
import { RouteQuiz } from "./components/Quiz/RouteQuiz";
import { ProgressDashboard } from "./components/Stats/ProgressDashboard";

function AppContent() {
  const { state } = useQuizContext();
  const { streets, pois, loading, error } = useStreetData();
  const [districts, setDistricts] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/data/districts.geojson")
      .then((res) => res.json())
      .then(setDistricts)
      .catch(() => {});
  }, []);

  if (loading) return <div className="loading">Daten werden geladen...</div>;
  if (error) return <div className="loading">Fehler: {error}</div>;

  return (
    <>
      <ModeSelector />
      <DistrictFilter />
      <div className="main-content">
        {state.appMode === "learn" && (
          <LearnMode streets={streets} pois={pois} districts={districts} />
        )}

        {state.appMode === "quiz" && state.quizMode === "multiple-choice" && (
          <MultipleChoice streets={streets} districts={districts} />
        )}

        {state.appMode === "quiz" && state.quizMode === "map-to-name" && (
          <MapToName streets={streets} districts={districts} />
        )}

        {state.appMode === "quiz" && state.quizMode === "name-to-map" && (
          <NameToMap streets={streets} districts={districts} />
        )}

        {state.appMode === "quiz" && state.quizMode === "route" && (
          <RouteQuiz streets={streets} districts={districts} />
        )}

        {state.appMode === "stats" && (
          <ProgressDashboard streets={streets} />
        )}
      </div>

      {state.appMode === "quiz" && (
        <div className="score-bar">
          <span>Richtig: {state.score} / {state.totalAnswered}</span>
          <span>
            {state.totalAnswered > 0
              ? `${Math.round((state.score / state.totalAnswered) * 100)}%`
              : "–"}
          </span>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <QuizProvider>
      <div className="app">
        <Header />
        <AppContent />
      </div>
    </QuizProvider>
  );
}

export default App;
