import { useState, useMemo, useCallback } from "react";
import { useQuizContext } from "../../context/QuizContext";
import { useProgress } from "../../hooks/useProgress";
import { QuizMap } from "../Map/QuizMap";
import { SearchBar } from "./SearchBar";
import type { Street, PointOfInterest } from "../../types/street";
import type { LearnSection } from "../../types/quiz";

interface LearnModeProps {
  streets: Street[];
  pois: PointOfInterest[];
  districts: GeoJSON.FeatureCollection | null;
}

export function LearnMode({ streets, pois, districts }: LearnModeProps) {
  const { state, dispatch } = useQuizContext();
  const { progress, markLearned, resetLearnSection } = useProgress();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStreet, setSelectedStreet] = useState<Street | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<PointOfInterest | null>(null);

  const section = state.learnSection;

  const filteredStreets = useMemo(() => {
    const byDistrict = streets.filter((s) => state.activeDistricts.includes(s.district));
    if (section === "hauptverkehr") return byDistrict.filter((s) => s.category === "hauptverkehr");
    if (section === "sonstige") return byDistrict.filter((s) => s.category === "sonstige");
    if (section === "nahverkehr") return byDistrict.filter((s) => s.category === "nahverkehr");
    return [];
  }, [streets, state.activeDistricts, section]);

  const filteredPOIs = useMemo(() => {
    return pois.filter((p) => state.activeDistricts.includes(p.district));
  }, [pois, state.activeDistricts]);

  const items: (Street | PointOfInterest)[] = section === "poi" ? filteredPOIs : filteredStreets;
  const seenCount = Object.keys(progress.learn[section].seen).length;
  const totalCount = items.length;
  const safeIndex = Math.min(currentIndex, Math.max(0, totalCount - 1));

  const currentItem = items[safeIndex] as (Street | PointOfInterest) | undefined;

  const handleNext = useCallback(() => {
    if (currentItem) {
      markLearned(section, currentItem.id);
    }
    setCurrentIndex((prev) => Math.min(prev + 1, totalCount - 1));
    setSelectedStreet(null);
    setSelectedPOI(null);
  }, [currentItem, section, totalCount, markLearned]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    setSelectedStreet(null);
    setSelectedPOI(null);
  }, []);

  const handleSearchStreet = useCallback((street: Street) => {
    setSelectedStreet(street);
    setSelectedPOI(null);
  }, []);

  const handleSearchPOI = useCallback((poi: PointOfInterest) => {
    setSelectedPOI(poi);
    setSelectedStreet(null);
  }, []);

  const handleSetSection = (s: LearnSection) => {
    dispatch({ type: "SET_LEARN_SECTION", section: s });
    setCurrentIndex(0);
    setSelectedStreet(null);
    setSelectedPOI(null);
  };

  // Determine what to show on map
  const mapStreet = selectedStreet || (section !== "poi" && currentItem ? (currentItem as Street) : null);
  const mapPOI = selectedPOI || (section === "poi" && currentItem ? (currentItem as PointOfInterest) : null);

  return (
    <>
      <div className="learn-section-tabs">
        <button
          className={`learn-section-tab ${section === "hauptverkehr" ? "active" : ""}`}
          onClick={() => handleSetSection("hauptverkehr")}
        >
          Hauptstraßen
        </button>
        <button
          className={`learn-section-tab ${section === "sonstige" ? "active" : ""}`}
          onClick={() => handleSetSection("sonstige")}
        >
          Weitere Straßen
        </button>
        <button
          className={`learn-section-tab ${section === "nahverkehr" ? "active" : ""}`}
          onClick={() => handleSetSection("nahverkehr")}
        >
          Nahverkehr
        </button>
        <button
          className={`learn-section-tab ${section === "poi" ? "active" : ""}`}
          onClick={() => handleSetSection("poi")}
        >
          Wichtige Orte
        </button>
      </div>

      <SearchBar
        streets={streets}
        pois={pois}
        onSelectStreet={handleSearchStreet}
        onSelectPOI={handleSearchPOI}
      />

      <QuizMap
        highlightStreet={mapStreet as Street | null}
        highlightColor="#C5A23C"
        poi={mapPOI as PointOfInterest | null}
        districts={districts}
      />

      {totalCount === 0 ? (
        <div className="learn-info">
          Keine Einträge für die gewählten Stadtteile.
        </div>
      ) : (
        <>
          <div className="learn-info">
            <div className="street-name-display">
              {section === "poi"
                ? (currentItem as PointOfInterest)?.name
                : (currentItem as Street)?.name}
            </div>
            {section === "poi" && (currentItem as PointOfInterest)?.address && (
              <div style={{ marginTop: 4, color: "#666", fontSize: "0.9rem" }}>
                {(currentItem as PointOfInterest).address}
              </div>
            )}
          </div>

          <div className="learn-nav">
            <button className="btn btn-secondary" onClick={handlePrev} disabled={safeIndex === 0}>
              Zurück
            </button>
            <span className="learn-counter">
              {safeIndex + 1} / {totalCount}
            </span>
            <button className="btn btn-primary" onClick={handleNext} disabled={safeIndex >= totalCount - 1}>
              Gelernt →
            </button>
          </div>

          <div style={{ textAlign: "center", fontSize: "0.8rem", color: "#666", padding: "0 16px" }}>
            {seenCount} von {totalCount} gelernt
            {seenCount > 0 && (
              <button
                onClick={() => resetLearnSection(section)}
                style={{ marginLeft: 12, color: "var(--navy)", background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}
              >
                Zurücksetzen
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
