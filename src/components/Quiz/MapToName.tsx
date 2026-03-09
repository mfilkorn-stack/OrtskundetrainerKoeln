import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuizContext } from "../../context/QuizContext";
import { useProgress } from "../../hooks/useProgress";
import { QuizMap } from "../Map/QuizMap";
import { pickOne } from "../../utils/random";
import { streetNamesMatch, filterStreetNames } from "../../utils/fuzzyMatch";
import type { Street } from "../../types/street";

interface MapToNameProps {
  streets: Street[];
  districts: GeoJSON.FeatureCollection | null;
}

export function MapToName({ streets, districts }: MapToNameProps) {
  const { state, dispatch } = useQuizContext();
  const { recordAnswer } = useProgress();
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredStreets = streets.filter((s) => state.activeDistricts.includes(s.district));
  const allNames = useMemo(() => [...new Set(filteredStreets.map((s) => s.name))], [filteredStreets]);

  const generateQuestion = useCallback(() => {
    if (filteredStreets.length === 0) return;
    const target = pickOne(filteredStreets);
    dispatch({
      type: "SET_QUESTION",
      question: { type: "map-to-name", targetStreet: target },
    });
    setInput("");
  }, [filteredStreets, dispatch]);

  useEffect(() => {
    if (!state.currentQuestion) generateQuestion();
  }, [state.currentQuestion, generateQuestion]);

  const handleSubmit = () => {
    if (state.answered || !state.currentQuestion || !input.trim()) return;
    const correct = streetNamesMatch(input, state.currentQuestion.targetStreet.name);
    dispatch({ type: "ANSWER", correct });
    recordAnswer(state.currentQuestion.targetStreet.id, correct);
  };

  const suggestions = useMemo(() => {
    if (!showSuggestions || input.length < 2) return [];
    return filterStreetNames(input, allNames).slice(0, 6);
  }, [input, showSuggestions, allNames]);

  const q = state.currentQuestion;

  if (filteredStreets.length === 0) {
    return <div className="learn-info">Bitte wähle mindestens einen Stadtteil.</div>;
  }

  return (
    <>
      <QuizMap
        highlightStreet={q?.targetStreet}
        highlightColor="#C5A23C"
        districts={districts}
      />
      <div className="quiz-panel">
        <div className="question-text">Wie heißt die markierte Straße?</div>

        {!state.answered && (
          <div className="autocomplete-wrapper">
            <input
              type="text"
              placeholder="Straßenname eingeben..."
              value={input}
              onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            {suggestions.length > 0 && (
              <div className="autocomplete-list">
                {suggestions.map((name) => (
                  <div
                    key={name}
                    className="autocomplete-item"
                    onMouseDown={() => { setInput(name); setShowSuggestions(false); }}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!state.answered && (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!input.trim()}>
            Prüfen
          </button>
        )}

        {state.answered && (
          <>
            <div className={`feedback ${state.lastAnswerCorrect ? "correct" : "wrong"}`}>
              {state.lastAnswerCorrect
                ? "Richtig!"
                : `Falsch! Es war: ${q?.targetStreet.name}`}
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
