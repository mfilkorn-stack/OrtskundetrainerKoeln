import { useState, useCallback, useEffect } from "react";
import { useQuizContext } from "../../context/QuizContext";
import { useProgress } from "../../hooks/useProgress";
import { QuizMap } from "../Map/QuizMap";
import { pickOne } from "../../utils/random";
import { FEUERWACHE_1, type Street } from "../../types/street";

interface RouteQuizProps {
  streets: Street[];
  districts: GeoJSON.FeatureCollection | null;
}

export function RouteQuiz({ streets, districts }: RouteQuizProps) {
  const { state, dispatch } = useQuizContext();
  const { recordAnswer } = useProgress();
  const [routeLine, setRouteLine] = useState<[number, number][] | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);

  const filteredStreets = streets.filter((s) => state.activeDistricts.includes(s.district));

  const generateQuestion = useCallback(() => {
    if (filteredStreets.length < 2) return;
    setRouteLine(null);
    setShowRoute(false);
    setRouteError(false);

    const endStreet = pickOne(filteredStreets);

    if (state.routeSubMode === "wache") {
      dispatch({
        type: "SET_ROUTE_QUESTION",
        question: {
          start: { name: FEUERWACHE_1.name, coordinates: FEUERWACHE_1.coordinates },
          end: { name: endStreet.name, coordinates: endStreet.center },
          subMode: "wache",
        },
      });
    } else {
      const startStreet = pickOne(filteredStreets.filter((s) => s.id !== endStreet.id));
      dispatch({
        type: "SET_ROUTE_QUESTION",
        question: {
          start: { name: startStreet.name, coordinates: startStreet.center },
          end: { name: endStreet.name, coordinates: endStreet.center },
          subMode: "frei",
        },
      });
    }
  }, [filteredStreets, state.routeSubMode, dispatch]);

  useEffect(() => {
    if (!state.currentRouteQuestion) generateQuestion();
  }, [state.currentRouteQuestion, generateQuestion]);

  const fetchRoute = useCallback(async () => {
    if (!state.currentRouteQuestion) return;
    setRouteLoading(true);
    try {
      const { start, end } = state.currentRouteQuestion;
      const url = `https://router.project-osrm.org/route/v1/driving/${start.coordinates[1]},${start.coordinates[0]};${end.coordinates[1]},${end.coordinates[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        );
        setRouteLine(coords);
      } else {
        setRouteError(true);
      }
    } catch {
      setRouteError(true);
    } finally {
      setRouteLoading(false);
    }
  }, [state.currentRouteQuestion]);

  const handleShowRoute = () => {
    setShowRoute(true);
    fetchRoute();
  };

  const handleSelfAssess = (correct: boolean) => {
    dispatch({ type: "ANSWER", correct });
    if (state.currentRouteQuestion) {
      recordAnswer(`route-${state.currentRouteQuestion.end.name}`, correct);
    }
  };

  const rq = state.currentRouteQuestion;

  if (filteredStreets.length < 2) {
    return <div className="learn-info">Bitte wähle mindestens einen Stadtteil mit genügend Straßen.</div>;
  }

  return (
    <>
      <div className="route-mode-toggle">
        <button
          className={`route-mode-btn ${state.routeSubMode === "wache" ? "active" : ""}`}
          onClick={() => { dispatch({ type: "SET_ROUTE_SUB_MODE", mode: "wache" }); dispatch({ type: "NEXT_QUESTION" }); }}
        >
          Ab Feuerwache
        </button>
        <button
          className={`route-mode-btn ${state.routeSubMode === "frei" ? "active" : ""}`}
          onClick={() => { dispatch({ type: "SET_ROUTE_SUB_MODE", mode: "frei" }); dispatch({ type: "NEXT_QUESTION" }); }}
        >
          Freier Modus
        </button>
      </div>

      <QuizMap
        routeStart={rq?.start.coordinates}
        routeEnd={rq?.end.coordinates}
        routeLine={showRoute ? routeLine : null}
        districts={districts}
      />

      <div className="quiz-panel">
        {rq && (
          <div className="route-info">
            <div className="route-point">
              <span className="route-marker start" />
              <strong>Von:</strong> {rq.start.name}
            </div>
            <span>→</span>
            <div className="route-point">
              <span className="route-marker end" />
              <strong>Nach:</strong> {rq.end.name}
            </div>
          </div>
        )}

        {!showRoute && !state.answered && (
          <div style={{ textAlign: "center" }}>
            <p style={{ marginBottom: 12, color: "#666" }}>
              Überlege dir den schnellsten Weg, dann klicke auf "Lösung anzeigen".
            </p>
            <button className="btn btn-primary" onClick={handleShowRoute}>
              Lösung anzeigen
            </button>
          </div>
        )}

        {showRoute && routeLoading && (
          <div className="learn-info">Route wird geladen...</div>
        )}

        {showRoute && routeError && (
          <div className="feedback wrong">Route konnte nicht geladen werden. Beurteile deine Antwort selbst.</div>
        )}

        {showRoute && !state.answered && (
          <div>
            <p style={{ textAlign: "center", marginBottom: 8, fontWeight: 600 }}>
              Wie gut war dein gedachter Weg?
            </p>
            <div className="self-assess">
              <button className="btn btn-success" onClick={() => handleSelfAssess(true)}>
                Richtig
              </button>
              <button className="btn btn-warning" onClick={() => handleSelfAssess(false)}>
                Teilweise
              </button>
              <button className="btn btn-error" onClick={() => handleSelfAssess(false)}>
                Falsch
              </button>
            </div>
          </div>
        )}

        {state.answered && (
          <button className="btn btn-primary" onClick={() => { dispatch({ type: "NEXT_QUESTION" }); generateQuestion(); }}>
            Nächste Route
          </button>
        )}
      </div>
    </>
  );
}
