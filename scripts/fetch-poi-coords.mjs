#!/usr/bin/env node

/**
 * Fetches real POI coordinates from OpenStreetMap Overpass API.
 *
 * Usage:
 *   node scripts/fetch-poi-coords.mjs           # only fetch POIs with imprecise/missing coords
 *   node scripts/fetch-poi-coords.mjs --force    # re-fetch all POIs
 */

import { readFileSync, writeFileSync } from "fs";

const OVERPASS = "https://overpass-api.de/api/interpreter";
const DELAY_MS = 2000;
const MAX_RETRIES = 3;
const FORCE = process.argv.includes("--force");

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
  "poi-st-marien": `[out:json];(way["name"~"Marien|Cellitinnen"]["amenity"="hospital"](50.94,6.95,50.95,6.97);way["addr:street"="Kunibertskloster"]["amenity"="hospital"](50.94,6.95,50.95,6.97);node["name"~"Marien"]["amenity"="hospital"](50.94,6.95,50.95,6.97););out center;`,
  "poi-seniorenhaus-st-maria": `[out:json];(way["name"~"St. Maria"]["amenity"~"nursing_home|social_facility"](50.93,6.95,50.94,6.96);node["name"~"St. Maria"]["amenity"~"nursing_home|social_facility"](50.93,6.95,50.94,6.96);way["addr:street"="Schwalbengasse"]["amenity"~"nursing_home|social_facility"](50.93,6.95,50.94,6.96););out center;`,
  "poi-residenz-am-dom": `[out:json];(way["name"~"Residenz am Dom"](50.94,6.95,50.95,6.96);node["name"~"Residenz am Dom"](50.94,6.95,50.95,6.96);way["addr:street"="An den Dominikanern"]["amenity"~"nursing_home|social_facility"](50.94,6.95,50.95,6.96););out center;`,
  "poi-st-maria-hilf": `[out:json];(way["name"~"Maria.Hilf"]["amenity"="hospital"](50.92,6.94,50.94,6.96);way["addr:street"="Am Klapperhof"]["amenity"~"hospital|clinic"](50.92,6.94,50.94,6.96););out center;`,
  "poi-hbf": `[out:json];node["name"="Köln Hauptbahnhof"]["railway"="station"](50.94,6.95,50.95,6.97);out;`,
  "poi-museum-ludwig": `[out:json];way["name"="Museum Ludwig"](50.93,6.95,50.95,6.97);out center;`,
  "poi-oper": `[out:json];(way["name"~"Staatenhaus"](50.93,6.96,50.95,6.97);way["name"~"Oper Köln"](50.93,6.94,50.95,6.97););out center;`,
  "poi-stadthaus-deutz": `[out:json];(way["name"~"Stadthaus"]["addr:street"~"Alter Markt|Deutzer"](50.93,6.95,50.94,6.97);way["name"~"Spanischer Bau"](50.93,6.95,50.94,6.97););out center;`,
  "poi-altenheim-severinswall": `[out:json];(way["addr:street"="Severinswall"]["amenity"~"nursing_home|social_facility"](50.92,6.95,50.93,6.96);node["addr:street"="Severinswall"]["amenity"~"nursing_home|social_facility"](50.92,6.95,50.93,6.96););out center;`,
  "poi-altenheim-kartause": `[out:json];(way["name"~"Kartäuser"]["amenity"~"nursing_home|social_facility"](50.92,6.94,50.93,6.95);node["addr:street"~"Kartäuserwall"]["amenity"~"nursing_home|social_facility"](50.92,6.94,50.93,6.95);way["addr:street"~"Kartäuserwall"](50.92,6.94,50.93,6.95););out center;`,
  "poi-altenheim-chlodwig": `[out:json];(way["addr:street"~"Chlodwigplatz"]["amenity"~"nursing_home|social_facility"](50.92,6.95,50.93,6.96);node["addr:street"~"Chlodwigplatz"]["amenity"~"nursing_home|social_facility"](50.92,6.95,50.93,6.96););out center;`,
  "poi-altenheim-neustadt": `[out:json];(way["addr:street"="Hansaring"]["amenity"~"nursing_home|social_facility"](50.94,6.93,50.95,6.95);node["addr:street"="Hansaring"]["amenity"~"nursing_home|social_facility"](50.94,6.93,50.95,6.95););out center;`,
  "poi-schauspielhaus": `[out:json];(way["name"~"Schauspiel"]["amenity"~"theatre"](50.92,6.94,50.94,6.96);way["name"~"Offenbachplatz"](50.92,6.94,50.94,6.96););out center;`,
};

/**
 * Check if a POI has precise coordinates (>= 4 decimal places).
 * Coordinates with 3 or fewer decimals are considered rough estimates.
 */
function hasPreciseCoords(poi) {
  if (!poi.coordinates || poi.coordinates.length !== 2) return false;
  const [lat, lon] = poi.coordinates;
  if (lat === 0 && lon === 0) return false;
  const latStr = String(lat);
  const lonStr = String(lon);
  const latDecimals = latStr.includes(".") ? latStr.split(".")[1].length : 0;
  const lonDecimals = lonStr.includes(".") ? lonStr.split(".")[1].length : 0;
  return latDecimals >= 4 && lonDecimals >= 4;
}

async function queryOverpass(q, retries = 0) {
  const res = await fetch(OVERPASS, {
    method: "POST",
    body: "data=" + encodeURIComponent(q),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (res.status === 429 || res.status >= 500) {
    if (retries < MAX_RETRIES) {
      const wait = Math.pow(2, retries + 1) * 1000;
      console.warn(`  Rate limited, retrying in ${wait / 1000}s...`);
      await new Promise((r) => setTimeout(r, wait));
      return queryOverpass(q, retries + 1);
    }
    throw new Error(`HTTP ${res.status} after ${MAX_RETRIES} retries`);
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

  const data = await res.json();
  return data.elements;
}

const pois = JSON.parse(readFileSync("public/data/pois.json", "utf-8"));

console.log("Fetching POI coordinates from OSM...");
console.log(`Mode: ${FORCE ? "FORCE (re-fetch all)" : "incremental (skip precise)"}\n`);

let updates = 0;
let skipped = 0;
let failed = 0;

for (const [id, q] of Object.entries(queries)) {
  const poi = pois.find((p) => p.id === id);
  if (!poi) {
    console.log(`  ${id}... SKIPPED (not in pois.json)`);
    skipped++;
    continue;
  }

  if (!FORCE && hasPreciseCoords(poi)) {
    console.log(`  ${id}... SKIPPED (already precise: [${poi.coordinates}])`);
    skipped++;
    continue;
  }

  process.stdout.write(`  ${id}...`);

  try {
    await new Promise((r) => setTimeout(r, DELAY_MS));
    const elements = await queryOverpass(q);
    if (elements.length > 0) {
      const el = elements[0];
      const lat = el.center ? el.center.lat : el.lat;
      const lon = el.center ? el.center.lon : el.lon;
      const oldCoords = [...poi.coordinates];
      poi.coordinates = [parseFloat(lat.toFixed(5)), parseFloat(lon.toFixed(5))];
      console.log(` OK [${oldCoords}] → [${poi.coordinates}] (${el.tags?.name || ""})`);
      updates++;
    } else {
      console.log(` NOT FOUND`);
      failed++;
    }
  } catch (e) {
    console.log(` ERROR: ${e.message}`);
    failed++;
  }
}

console.log(`\n=== TOTAL: ${updates} updated, ${skipped} skipped, ${failed} failed ===`);

if (updates > 0) {
  writeFileSync("public/data/pois.json", JSON.stringify(pois, null, 2) + "\n");

  // Also update FEUERWACHE_1 constant in street.ts
  const fw = pois.find((p) => p.id === "poi-feuerwache1");
  if (fw) {
    const tsPath = "src/types/street.ts";
    let ts = readFileSync(tsPath, "utf-8");
    ts = ts.replace(
      /coordinates: \[[\d.]+, [\d.]+\] as \[number, number\]/,
      `coordinates: [${fw.coordinates[0]}, ${fw.coordinates[1]}] as [number, number]`
    );
    writeFileSync(tsPath, ts);
    console.log(`Updated FEUERWACHE_1 in ${tsPath} to [${fw.coordinates}]`);
  }
} else {
  console.log("No updates needed, files unchanged.");
}
