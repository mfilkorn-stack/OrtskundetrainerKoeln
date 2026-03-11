import { useState, useCallback, useEffect } from "react";
import { useQuizContext } from "../../context/QuizContext";
import { useProgress } from "../../hooks/useProgress";
import { QuizMap } from "../Map/QuizMap";
import { pickOne } from "../../utils/random";
import { distanceMeters, distanceToPolyline, getStreetCoordinates } from "../../utils/geo";
import type { Street } from "../../types/street";

interface NameToMapProps {
  streets: Street[];
  districts: GeoJSON.FeatureCollection | null;
}

export function NameToMap({ streets, districts }: NameToMapProps) {
  const { state, dispatch } = useQuizContext();
  const { recordAnswer } = useProgress();
  const [userMarker, setUserMarker] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const filteredStreets = streets.filter((s) => state.activeDistricts.includes(s.district));

  const generateQuestion = useCallback(() => {
    if (filteredStreets.length === 0) return;
    const target = pickOne(filteredStreets);
    dispatch({
      type: "SET_QUESTION",
      question: { type: "name-to-map", targetStreet: target },
    });
    setUserMarker(null);
    setDistance(null);
  }, [filteredStreets, dispatch]);

  useEffect(() => {
    if (!state.currentQuestion) generateQuestion();
  }, [state.currentQuestion, generateQuestion]);

  const handleMapClick = useCallback((latlng: [number, number]) => {
    if (state.answered) return;
    setUserMarker(latlng);
  }, [state.answered]);

  const handleSubmit = () => {
    if (state.answered || !state.currentQuestion || !userMarker) return;
    const geom = state.currentQuestion.targetStreet.geometry;
    const dist = geom.type === "Point"
      ? distanceMeters(userMarker[0], userMarker[1], state.currentQuestion.targetStreet.center[0], state.currentQuestion.targetStreet.center[1])
      : distanceToPolyline(userMarker[0], userMarker[1], getStreetCoordinates(geom));
    setDistance(Math.round(dist));
    const correct = dist < 50;
    dispatch({ type: "ANSWER", correct });
    recordAnswer(state.currentQuestion.targetStreet.id, correct);
  };

  const q = state.currentQuestion;

  if (filteredStreets.length === 0) {
    return <div className="learn-info">Bitte wähle mindestens einen Stadtteil.</div>;
  }

  const feedbackClass = distance !== null
    ? distance < 50 ? "correct" : distance < 150 ? "close" : "wrong"
    : "";

  return (
    <>
      <QuizMap
        highlightStreet={state.answered ? null : undefined}
        showCorrectStreet={state.answered ? q?.targetStreet : undefined}
        userMarker={userMarker}
        onMapClick={state.answered ? undefined : handleMapClick}
        districts={districts}
      />
      <div className="quiz-panel">
        {q && (
          <div className="street-name-display">{q.targetStreet.name}</div>
        )}
        <div className="question-text">
          {q?.targetStreet.category === "nahverkehr"
            ? "Klicke auf die Karte, wo diese Haltestelle liegt!"
            : "Klicke auf die Karte, wo diese Straße liegt!"}
        </div>

        {!state.answered && userMarker && (
          <button className="btn btn-primary" onClick={handleSubmit}>
            Prüfen
          </button>
        )}

        {state.answered && distance !== null && (
          <>
            <div className={`feedback ${feedbackClass}`}>
              {distance < 50
                ? `Richtig! (${distance}m Abstand)`
                : distance < 150
                ? `Nah dran! ${distance}m Abstand`
                : `Leider daneben. ${distance}m Abstand`}
            </div>
            <button className="btn btn-primary" onClick={() => { dispatch({ type: "NEXT_QUESTION" }); generateQuestion(); }}>
              Nächste Frage
            </button>
          </>
        )}
      </div>
    </>
  );
}
