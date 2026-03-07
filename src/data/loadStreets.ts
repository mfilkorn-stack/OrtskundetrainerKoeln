import type { Street, District, StreetCategory, PointOfInterest } from "../types/street";
import { polylineCenter, getStreetCoordinates } from "../utils/geo";

const base = import.meta.env.BASE_URL;

const DISTRICT_FILES: Record<District, string> = {
  "altstadt-nord": `${base}data/streets-altstadt-nord.geojson`,
  "altstadt-sued": `${base}data/streets-altstadt-sued.geojson`,
  "neustadt-nord": `${base}data/streets-neustadt-nord.geojson`,
  "neustadt-sued": `${base}data/streets-neustadt-sued.geojson`,
};

export async function loadAllStreets(): Promise<Street[]> {
  const allStreets: Street[] = [];

  for (const [district, file] of Object.entries(DISTRICT_FILES)) {
    try {
      const response = await fetch(file);
      if (!response.ok) {
        console.warn(`Failed to load ${file}: ${response.status}`);
        continue;
      }
      const geojson = await response.json();
      if (!geojson?.features) {
        console.warn(`No features in ${file}`);
        continue;
      }

      for (const feature of geojson.features) {
        const geometry = feature.geometry as GeoJSON.LineString | GeoJSON.MultiLineString;
        if (!geometry?.coordinates) continue;
        const coords = getStreetCoordinates(geometry);
        if (coords.length === 0) continue;
        const center = polylineCenter(coords);
        // Use explicit category from GeoJSON if present, otherwise derive from highway tag
        const cat = feature.properties.category as string | undefined;
        const hw = feature.properties.highway as string | undefined;
        const category: StreetCategory =
          cat === "hauptverkehr" || cat === "sonstige"
            ? cat
            : hw === "primary" || hw === "secondary"
              ? "hauptverkehr"
              : "sonstige";

        allStreets.push({
          id: feature.properties.id || `${district}-${feature.properties.name}`,
          name: feature.properties.name,
          district: district as District,
          category,
          geometry,
          center,
        });
      }
    } catch (err) {
      console.warn(`Error loading ${file}:`, err);
      continue;
    }
  }

  // Deduplicate by name within the same district
  const seen = new Set<string>();
  return allStreets.filter((s) => {
    const key = `${s.district}-${s.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function loadPOIs(): Promise<PointOfInterest[]> {
  try {
    const response = await fetch(`${base}data/pois.json`);
    if (!response.ok) {
      console.warn(`Failed to load pois.json: ${response.status}`);
      return [];
    }
    return await response.json();
  } catch (err) {
    console.warn("Error loading POIs:", err);
    return [];
  }
}
