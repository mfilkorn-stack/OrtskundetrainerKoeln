export type District = "altstadt-nord" | "altstadt-sued" | "neustadt-nord" | "neustadt-sued";

export type StreetCategory = "hauptverkehr" | "sonstige" | "nahverkehr";

export interface Street {
  id: string;
  name: string;
  district: District;
  category: StreetCategory;
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString | GeoJSON.Point;
  center: [number, number]; // [lat, lng]
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: "krankenhaus" | "altenheim" | "oeffentliches_gebaeude" | "schule" | "kirche" | "kultur" | "wahrzeichen" | "hotel";
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
  coordinates: [50.93375, 6.95388] as [number, number],
};
