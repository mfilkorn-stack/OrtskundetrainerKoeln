import { readFileSync, writeFileSync } from "fs";

const OVERPASS = "https://overpass-api.de/api/interpreter";

// Overpass queries to find each POI
const queries = {
  "poi-feuerwache1": `[out:json];(way["amenity"="fire_station"]["addr:street"="Agrippastraße"](50.92,6.93,50.94,6.96);node["amenity"="fire_station"]["addr:street"="Agrippastraße"](50.92,6.93,50.94,6.96);way["name"~"Rettungswache 1"]["addr:city"="Köln"](50.92,6.93,50.94,6.96););out center;`,
  "poi-uniklinik": `[out:json];way["name"~"Uniklinik|Universitätsklinik"]["amenity"="hospital"](50.92,6.90,50.93,6.93);out center;`,
  "poi-antonius": `[out:json];way["name"~"Augustinerinnen|Severinsklösterchen"]["amenity"="hospital"](50.92,6.95,50.93,6.97);out center;`,
  "poi-rathaus": `[out:json];way["name"="Historisches Rathaus"](50.93,6.95,50.94,6.97);out center;`,
  "poi-polizei-waidmarkt": `[out:json];way["name"~"Polizeipräsidium"](50.93,6.95,50.94,6.96);out center;`,
  "poi-dom": `[out:json];way["name"="Kölner Dom"](50.93,6.95,50.95,6.97);out center;`,
  "poi-hbf": `[out:json];node["name"="Köln Hauptbahnhof"]["railway"="station"](50.94,6.95,50.95,6.97);out;`,
  "poi-museum-ludwig": `[out:json];way["name"="Museum Ludwig"](50.93,6.96,50.95,6.97);out center;`,
  "poi-bezirksrathaus": `[out:json];way["name"~"Bezirksrathaus"]["addr:street"~"Laurenz"](50.93,6.95,50.94,6.96);out center;`,
  "poi-gericht": `[out:json];(way["name"~"Verwaltungsgericht"](50.93,6.94,50.94,6.96);way["amenity"="courthouse"]["addr:street"~"Appellhofplatz"](50.93,6.94,50.94,6.96););out center;`,
  "poi-st-marien": `[out:json];(way["name"~"Marien"]["amenity"="hospital"](50.94,6.95,50.95,6.97);node["name"~"Marien"]["amenity"="hospital"](50.94,6.95,50.95,6.97););out center;`,
  "poi-seniorenhaus-st-maria": `[out:json];(way["name"~"St. Maria"]["amenity"~"nursing_home|social_facility"](50.93,6.95,50.94,6.96);node["name"~"St. Maria"]["amenity"~"nursing_home|social_facility"](50.93,6.95,50.94,6.96);way["addr:street"="Schwalbengasse"]["amenity"~"nursing_home|social_facility"](50.93,6.95,50.94,6.96););out center;`,
  "poi-residenz-am-dom": `[out:json];(way["name"~"Residenz am Dom"](50.94,6.95,50.95,6.96);node["name"~"Residenz am Dom"](50.94,6.95,50.95,6.96);way["addr:street"="An den Dominikanern"]["amenity"~"nursing_home|social_facility"](50.94,6.95,50.95,6.96););out center;`,
};

const pois = JSON.parse(readFileSync("public/data/pois.json", "utf-8"));

async function queryOverpass(q) {
  const res = await fetch(OVERPASS, {
    method: "POST",
    body: "data=" + encodeURIComponent(q),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const data = await res.json();
  return data.elements;
}

let updates = 0;
for (const [id, q] of Object.entries(queries)) {
  try {
    await new Promise(r => setTimeout(r, 2000));
    const elements = await queryOverpass(q);
    if (elements.length > 0) {
      const el = elements[0];
      const lat = el.center ? el.center.lat : el.lat;
      const lon = el.center ? el.center.lon : el.lon;
      const poi = pois.find(p => p.id === id);
      if (poi) {
        const oldCoords = [...poi.coordinates];
        poi.coordinates = [parseFloat(lat.toFixed(5)), parseFloat(lon.toFixed(5))];
        console.log(`✓ ${id}: [${oldCoords}] → [${poi.coordinates}] (${el.tags?.name || ""})`);
        updates++;
      }
    } else {
      console.log(`✗ ${id}: no results`);
    }
  } catch (e) {
    console.log(`✗ ${id}: ${e.message}`);
  }
}

writeFileSync("public/data/pois.json", JSON.stringify(pois, null, 2) + "\n");

// Also update FEUERWACHE_1 constant in street.ts
const fw = pois.find(p => p.id === "poi-feuerwache1");
if (fw) {
  const tsPath = "src/types/street.ts";
  let ts = readFileSync(tsPath, "utf-8");
  ts = ts.replace(
    /coordinates: \[[\d.]+, [\d.]+\] as \[number, number\]/,
    `coordinates: [${fw.coordinates[0]}, ${fw.coordinates[1]}] as [number, number]`
  );
  writeFileSync(tsPath, ts);
  console.log(`✓ Updated FEUERWACHE_1 in ${tsPath} to [${fw.coordinates}]`);
}

console.log(`\nUpdated ${updates}/${Object.keys(queries).length} POIs`);
