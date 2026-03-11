#!/usr/bin/env node

/**
 * Fetches real POI coordinates from OpenStreetMap.
 *
 * Strategy:
 *   1. Try Overpass API with name search in district bounding box
 *   2. Fall back to Nominatim geocoding with address + "Köln"
 *
 * Usage:
 *   node scripts/fetch-poi-coords.mjs           # only fetch POIs with imprecise/missing coords
 *   node scripts/fetch-poi-coords.mjs --force    # re-fetch all POIs
 */

import { readFileSync, writeFileSync } from "fs";

const OVERPASS = "https://overpass-api.de/api/interpreter";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const DELAY_MS = 1500;
const MAX_RETRIES = 3;
const FORCE = process.argv.includes("--force");

// Bounding boxes per district [south, west, north, east]
const DISTRICT_BOUNDS = {
  "altstadt-nord": [50.935, 6.945, 50.950, 6.970],
  "altstadt-sued": [50.918, 6.935, 50.937, 6.970],
  "neustadt-nord": [50.935, 6.925, 50.955, 6.955],
  "neustadt-sued": [50.915, 6.920, 50.937, 6.950],
};

// Wider bbox for fallback searches
const COLOGNE_CENTER_BBOX = [50.915, 6.915, 50.955, 6.975];

/**
 * Check if a POI has precise coordinates (>= 4 decimal places).
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

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url, options, retries = 0) {
  const res = await fetch(url, options);

  if (res.status === 429 || res.status >= 500) {
    if (retries < MAX_RETRIES) {
      const wait = Math.pow(2, retries + 1) * 1000;
      console.warn(`  Rate limited (${res.status}), retrying in ${wait / 1000}s...`);
      await sleep(wait);
      return fetchWithRetry(url, options, retries + 1);
    }
    throw new Error(`HTTP ${res.status} after ${MAX_RETRIES} retries`);
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res;
}

/**
 * Try to find POI via Overpass API using name search.
 */
async function tryOverpass(poi) {
  const bounds = DISTRICT_BOUNDS[poi.district] || COLOGNE_CENTER_BBOX;
  const [south, west, north, east] = bounds;
  const bbox = `${south},${west},${north},${east}`;

  // Escape name for Overpass regex
  const name = poi.name
    .replace(/[()]/g, "")
    .split(/[\/,–-]/)[0]  // Take first part before separators
    .trim();

  // Try multiple search strategies
  const queries = [
    // Exact name match
    `[out:json];(node["name"="${name}"](${bbox});way["name"="${name}"](${bbox});relation["name"="${name}"](${bbox}););out center 1;`,
    // Fuzzy name match
    `[out:json];(node["name"~"${name}",i](${bbox});way["name"~"${name}",i](${bbox}););out center 1;`,
  ];

  // If we have an address street, try that too
  if (poi.address) {
    const street = poi.address.split(/\d/)[0].trim();
    if (street.length > 3) {
      queries.push(
        `[out:json];(node["addr:street"~"${street}",i](${bbox});way["addr:street"~"${street}",i](${bbox}););out center 1;`
      );
    }
  }

  for (const q of queries) {
    try {
      const res = await fetchWithRetry(OVERPASS, {
        method: "POST",
        body: "data=" + encodeURIComponent(q),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();
      if (data.elements && data.elements.length > 0) {
        const el = data.elements[0];
        const lat = el.center ? el.center.lat : el.lat;
        const lon = el.center ? el.center.lon : el.lon;
        if (lat && lon) {
          return [parseFloat(lat.toFixed(5)), parseFloat(lon.toFixed(5))];
        }
      }
    } catch {
      // Try next query
    }
    await sleep(DELAY_MS);
  }

  // Try wider bbox
  const wbbox = COLOGNE_CENTER_BBOX.join(",");
  const wideQuery = `[out:json];(node["name"~"${name}",i](${wbbox});way["name"~"${name}",i](${wbbox}););out center 1;`;
  try {
    const res = await fetchWithRetry(OVERPASS, {
      method: "POST",
      body: "data=" + encodeURIComponent(wideQuery),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const data = await res.json();
    if (data.elements && data.elements.length > 0) {
      const el = data.elements[0];
      const lat = el.center ? el.center.lat : el.lat;
      const lon = el.center ? el.center.lon : el.lon;
      if (lat && lon) {
        return [parseFloat(lat.toFixed(5)), parseFloat(lon.toFixed(5))];
      }
    }
  } catch {
    // Fall through to Nominatim
  }

  return null;
}

/**
 * Try Nominatim geocoding as fallback.
 */
async function tryNominatim(poi) {
  const searchTerms = [
    `${poi.name}, Köln`,
    poi.address ? `${poi.address}, Köln` : null,
  ].filter(Boolean);

  for (const q of searchTerms) {
    try {
      const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=1&bounded=1&viewbox=6.915,50.955,6.975,50.915`;
      const res = await fetchWithRetry(url, {
        headers: { "User-Agent": "OrtskundetrainerKoeln/1.0" },
      });
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(parseFloat(data[0].lat).toFixed(5));
        const lon = parseFloat(parseFloat(data[0].lon).toFixed(5));
        return [lat, lon];
      }
    } catch {
      // Try next search term
    }
    await sleep(DELAY_MS);
  }

  return null;
}

// Main
const pois = JSON.parse(readFileSync("public/data/pois.json", "utf-8"));

console.log("Fetching POI coordinates from OSM...");
console.log(`Mode: ${FORCE ? "FORCE (re-fetch all)" : "incremental (skip precise)"}`);
console.log(`Total POIs: ${pois.length}\n`);

let updates = 0;
let skipped = 0;
let failed = 0;

for (const poi of pois) {
  if (!FORCE && hasPreciseCoords(poi)) {
    skipped++;
    continue;
  }

  process.stdout.write(`  ${poi.id} (${poi.name})...`);

  await sleep(DELAY_MS);

  // Try Overpass first
  let coords = await tryOverpass(poi);

  // Fallback to Nominatim
  if (!coords) {
    process.stdout.write(" [Nominatim]");
    coords = await tryNominatim(poi);
  }

  if (coords) {
    const oldCoords = [...poi.coordinates];
    poi.coordinates = coords;
    console.log(` OK [${oldCoords}] → [${coords}]`);
    updates++;
  } else {
    console.log(` NOT FOUND (keeping [${poi.coordinates}])`);
    failed++;
  }
}

console.log(`\n=== TOTAL: ${updates} updated, ${skipped} skipped, ${failed} failed ===`);

if (updates > 0) {
  writeFileSync("public/data/pois.json", JSON.stringify(pois, null, 2) + "\n");
  console.log("Updated pois.json");

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
