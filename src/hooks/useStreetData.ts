import { useState, useEffect } from "react";
import type { Street, PointOfInterest } from "../types/street";
import { loadAllStreets, loadPOIs } from "../data/loadStreets";

export function useStreetData() {
  const [streets, setStreets] = useState<Street[]>([]);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadAllStreets(), loadPOIs()])
      .then(([loadedStreets, loadedPois]) => {
        setStreets(loadedStreets);
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
