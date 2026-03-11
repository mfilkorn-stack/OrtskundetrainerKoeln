import { useState, useEffect } from "react";
import type { Street, PointOfInterest } from "../types/street";
import { loadAllStreets, loadStations, loadPOIs } from "../data/loadStreets";

export function useStreetData() {
  const [streets, setStreets] = useState<Street[]>([]);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadAllStreets(), loadStations(), loadPOIs()])
      .then(([loadedStreets, loadedStations, loadedPois]) => {
        setStreets([...loadedStreets, ...loadedStations]);
        setPois(loadedPois);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { streets, pois, loading, error };
}
