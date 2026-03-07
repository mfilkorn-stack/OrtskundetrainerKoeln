import { useState, useMemo } from "react";
import type { Street, PointOfInterest } from "../../types/street";

interface SearchBarProps {
  streets: Street[];
  pois: PointOfInterest[];
  onSelectStreet: (street: Street) => void;
  onSelectPOI: (poi: PointOfInterest) => void;
}

export function SearchBar({ streets, pois, onSelectStreet, onSelectPOI }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const streetResults = streets
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 8)
      .map((s) => ({ type: "street" as const, item: s, label: s.name, sub: s.district }));
    const poiResults = pois
      .filter((p) => p.name.toLowerCase().includes(q) || (p.address && p.address.toLowerCase().includes(q)))
      .slice(0, 5)
      .map((p) => ({ type: "poi" as const, item: p, label: p.name, sub: p.address || p.district }));
    return [...streetResults, ...poiResults];
  }, [query, streets, pois]);

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Straße oder Ort suchen..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
      />
      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((r, i) => (
            <div
              key={i}
              className="search-result-item"
              onMouseDown={() => {
                if (r.type === "street") onSelectStreet(r.item as Street);
                else onSelectPOI(r.item as PointOfInterest);
                setQuery("");
                setShowResults(false);
              }}
            >
              <div>{r.label}</div>
              <div className="item-type">{r.sub}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
