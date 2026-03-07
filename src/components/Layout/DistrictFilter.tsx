import { useQuizContext } from "../../context/QuizContext";
import { DISTRICT_LABELS, type District } from "../../types/street";

const DISTRICTS: District[] = ["altstadt-nord", "altstadt-sued", "neustadt-nord", "neustadt-sued"];

export function DistrictFilter() {
  const { state, dispatch } = useQuizContext();

  return (
    <div className="district-filter">
      {DISTRICTS.map((d) => (
        <button
          key={d}
          className={`district-chip ${state.activeDistricts.includes(d) ? "active" : ""}`}
          onClick={() => dispatch({ type: "TOGGLE_DISTRICT", district: d })}
        >
          {DISTRICT_LABELS[d]}
        </button>
      ))}
    </div>
  );
}
