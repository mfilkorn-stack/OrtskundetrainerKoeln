export type District = "altstadt-nord" | "altstadt-sued" | "neustadt-nord" | "neustadt-sued";

export type StreetCategory = "hauptverkehr" | "sonstige";

export interface Street {
  id: string;
  name: string;
  district: District;
  category: StreetCategory;
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString;
  center: [number, number]; // [lat, lng]
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: "krankenhaus" | "altenheim" | "oeffentliches_gebaeude";
  district: District;
  coordinates: [number, number]; // [lat, lng]
  address?: string;
}

export const DISTRICT_LABELS: Record<District, string> = {
  "altstadt-nord": "Altstadt-Nord",
  "altstadt-sued": "Altstadt-Süd",
  "neustadt-nord": "Neustadt-Nord",
  "neustadt-sued": "Neustadt-Süd",
};

export const FEUERWACHE_1 = {
  name: "Feuerwache 1",
  address: "Agrippastraße 18, 50676 Köln",
  coordinates: [50.9333, 6.9456] as [number, number],
};
