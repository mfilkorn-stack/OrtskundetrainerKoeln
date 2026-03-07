import { useState, useEffect, lazy, Suspense } from "react";
import "./App.css";
import { QuizProvider, useQuizContext } from "./context/QuizContext";
import { useStreetData } from "./hooks/useStreetData";
import { Header } from "./components/Layout/Header";
import { ModeSelector } from "./components/Layout/ModeSelector";
import { DistrictFilter } from "./components/Layout/DistrictFilter";
import { ProgressDashboard } from "./components/Stats/ProgressDashboard";

// Lazy-load map-dependent components so Leaflet doesn't crash the initial bundle
const LearnMode = lazy(() => import("./components/Learn/LearnMode").then(m => ({ default: m.LearnMode })));
const MultipleChoice = lazy(() => import("./components/Quiz/MultipleChoice").then(m => ({ default: m.MultipleChoice })));
const MapToName = lazy(() => import("./components/Quiz/MapToName").then(m => ({ default: m.MapToName })));
const NameToMap = lazy(() => import("./components/Quiz/NameToMap").then(m => ({ default: m.NameToMap })));
const RouteQuiz = lazy(() => import("./components/Quiz/RouteQuiz").then(m => ({ default: m.RouteQuiz })));

function AppContent() {
  const { state } = useQuizContext();
  const { streets, pois, loading, error } = useStreetData();
  const [districts, setDistricts] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/districts.geojson`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setDistricts)
      .catch((err) => console.warn("Failed to load districts:", err));
  }, []);

  if (loading) return <div className="loading">Daten werden geladen...</div>;
  if (error) return <div className="loading">Fehler: {error}</div>;

  return (
    <>
      <ModeSelector />
      <DistrictFilter />
      <div className="main-content">
        <Suspense fallback={<div className="loading">Karte wird geladen...</div>}>
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
        </Suspense>

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
