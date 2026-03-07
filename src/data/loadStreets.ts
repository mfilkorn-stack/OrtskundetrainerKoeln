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
    const response = await fetch(file);
    const geojson = await response.json();

    for (const feature of geojson.features) {
      const geometry = feature.geometry as GeoJSON.LineString | GeoJSON.MultiLineString;
      const coords = getStreetCoordinates(geometry);
      const center = polylineCenter(coords);
      const category: StreetCategory =
        feature.properties.category === "hauptverkehr" ? "hauptverkehr" : "sonstige";

      allStreets.push({
        id: feature.properties.id || `${district}-${feature.properties.name}`,
        name: feature.properties.name,
        district: district as District,
        category,
        geometry,
        center,
      });
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
  const response = await fetch(`${base}data/pois.json`);
  return response.json();
}
