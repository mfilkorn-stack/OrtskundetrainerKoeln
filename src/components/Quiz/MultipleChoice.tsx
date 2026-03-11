import { useState, useCallback, useEffect } from "react";
import { useQuizContext } from "../../context/QuizContext";
import { useProgress } from "../../hooks/useProgress";
import { QuizMap } from "../Map/QuizMap";
import { pickOne, pickRandom, shuffle } from "../../utils/random";
import type { Street } from "../../types/street";

interface MultipleChoiceProps {
  streets: Street[];
  districts: GeoJSON.FeatureCollection | null;
}

export function MultipleChoice({ streets, districts }: MultipleChoiceProps) {
  const { state, dispatch } = useQuizContext();
  const { recordAnswer } = useProgress();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const filteredStreets = streets.filter((s) => state.activeDistricts.includes(s.district));

  const generateQuestion = useCallback(() => {
    if (filteredStreets.length < 4) return;
    const target = pickOne(filteredStreets);
    const distractors = pickRandom(
      filteredStreets.filter((s) => s.id !== target.id),
      3
    );
    const choices = shuffle([target, ...distractors]);
    dispatch({
      type: "SET_QUESTION",
      question: { type: "multiple-choice", targetStreet: target, choices },
    });
    setSelectedAnswer(null);
  }, [filteredStreets, dispatch]);

  useEffect(() => {
    if (!state.currentQuestion) generateQuestion();
  }, [state.currentQuestion, generateQuestion]);

  const handleAnswer = (streetName: string) => {
    if (state.answered || !state.currentQuestion) return;
    setSelectedAnswer(streetName);
    const correct = streetName === state.currentQuestion.targetStreet.name;
    dispatch({ type: "ANSWER", correct });
    recordAnswer(state.currentQuestion.targetStreet.id, correct);
  };

  const q = state.currentQuestion;

  if (filteredStreets.length < 4) {
    return <div className="learn-info">Bitte wähle mindestens einen Stadtteil mit genügend Straßen.</div>;
  }

  return (
    <>
      <QuizMap
        highlightStreet={q?.targetStreet}
        highlightColor="#C5A23C"
        districts={districts}
      />
      <div className="quiz-panel">
        <div className="question-text">
          {q?.targetStreet.category === "nahverkehr"
            ? "Welche Haltestelle ist hier markiert?"
            : "Welche Straße ist hier markiert?"}
        </div>

        <div className="mc-options">
          {q?.choices?.map((choice) => {
            let className = "mc-option";
            if (state.answered) {
              className += " answered";
              if (choice.name === q.targetStreet.name) className += " correct";
              else if (choice.name === selectedAnswer) className += " wrong";
            }
            return (
              <button
                key={choice.id}
                className={className}
                onClick={() => handleAnswer(choice.name)}
                disabled={state.answered}
              >
                {choice.name}
              </button>
            );
          })}
        </div>

        {state.answered && (
          <>
            <div className={`feedback ${state.lastAnswerCorrect ? "correct" : "wrong"}`}>
              {state.lastAnswerCorrect ? "Richtig!" : `Falsch! Es war: ${q?.targetStreet.name}`}
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
