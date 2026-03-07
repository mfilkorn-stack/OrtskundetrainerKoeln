#!/usr/bin/env node

/**
 * Fetches real street geometry from OpenStreetMap Overpass API
 * and updates the GeoJSON data files with accurate coordinates.
 *
 * Usage:
 *   node scripts/fetch-osm-geometry.mjs          # skip already-enriched streets (>10 coords)
 *   node scripts/fetch-osm-geometry.mjs --force   # re-fetch all streets
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const DELAY_MS = 1500;
const MAX_RETRIES = 3;
const FORCE = process.argv.includes("--force");
const FILES_ARG = process.argv.find((a) => a.startsWith("--files="));
const ONLY_FILES = FILES_ARG
  ? FILES_ARG.replace("--files=", "").split(",").filter(Boolean)
  : null;

// Bounding boxes [south, west, north, east] for each district
const DISTRICT_BBOX = {
  "altstadt-nord": [50.933, 6.938, 50.950, 6.968],
  "altstadt-sued": [50.918, 6.933, 50.940, 50.968],
  "neustadt-nord": [50.933, 6.918, 50.957, 6.948],
  "neustadt-sued": [50.910, 6.918, 50.942, 6.970],
};

// Fix: altstadt-sued east bound was wrong (50.968 instead of 6.968)
DISTRICT_BBOX["altstadt-sued"] = [50.918, 6.933, 50.940, 6.968];

const FILES = [
  { file: "streets-altstadt-nord.geojson", district: "altstadt-nord" },
  { file: "streets-altstadt-sued.geojson", district: "altstadt-sued" },
  { file: "streets-neustadt-nord.geojson", district: "neustadt-nord" },
  { file: "streets-neustadt-sued.geojson", district: "neustadt-sued" },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function countCoords(geometry) {
  if (geometry.type === "LineString") return geometry.coordinates.length;
  if (geometry.type === "MultiLineString") {
    return geometry.coordinates.reduce((sum, line) => sum + line.length, 0);
  }
  return 0;
}

async function queryOverpass(streetName, bbox, retries = 0) {
  const [south, west, north, east] = bbox;
  const query = `[out:json][timeout:25];way["name"="${streetName}"](${south},${west},${north},${east});out geom;`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (res.status === 429 || res.status >= 500) {
    if (retries < MAX_RETRIES) {
      const wait = Math.pow(2, retries + 1) * 1000;
      console.warn(`  Rate limited, retrying in ${wait / 1000}s...`);
      await sleep(wait);
      return queryOverpass(streetName, bbox, retries + 1);
    }
    throw new Error(`HTTP ${res.status} after ${MAX_RETRIES} retries`);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.elements || [];
}

function wayToCoords(way) {
  if (!way.geometry || way.geometry.length === 0) return [];
  return way.geometry.map((node) => [node.lon, node.lat]);
}

function coordsEqual(a, b, tolerance = 0.00001) {
  return Math.abs(a[0] - b[0]) < tolerance && Math.abs(a[1] - b[1]) < tolerance;
}

function mergeWays(elements) {
  // Extract coordinate arrays from OSM ways
  let segments = elements
    .map((el) => wayToCoords(el))
    .filter((coords) => coords.length >= 2);

  if (segments.length === 0) return null;
  if (segments.length === 1) {
    return { type: "LineString", coordinates: segments[0] };
  }

  // Try to chain segments by matching endpoints
  const chains = [];
  const used = new Set();

  while (used.size < segments.length) {
    // Find first unused segment
    let chainIdx = -1;
    for (let i = 0; i < segments.length; i++) {
      if (!used.has(i)) {
        chainIdx = i;
        break;
      }
    }
    if (chainIdx === -1) break;

    let chain = [...segments[chainIdx]];
    used.add(chainIdx);

    let extended = true;
    while (extended) {
      extended = false;
      for (let i = 0; i < segments.length; i++) {
        if (used.has(i)) continue;
        const seg = segments[i];
        const chainStart = chain[0];
        const chainEnd = chain[chain.length - 1];
        const segStart = seg[0];
        const segEnd = seg[seg.length - 1];

        if (coordsEqual(chainEnd, segStart)) {
          // Append segment (skip first point to avoid duplicate)
          chain.push(...seg.slice(1));
          used.add(i);
          extended = true;
        } else if (coordsEqual(chainEnd, segEnd)) {
          // Append reversed segment
          chain.push(...seg.slice(0, -1).reverse());
          used.add(i);
          extended = true;
        } else if (coordsEqual(chainStart, segEnd)) {
          // Prepend segment
          chain = [...seg.slice(0, -1), ...chain];
          used.add(i);
          extended = true;
        } else if (coordsEqual(chainStart, segStart)) {
          // Prepend reversed segment
          chain = [...seg.slice(1).reverse(), ...chain];
          used.add(i);
          extended = true;
        }
      }
    }
    chains.push(chain);
  }

  if (chains.length === 1) {
    return { type: "LineString", coordinates: chains[0] };
  }
  return { type: "MultiLineString", coordinates: chains };
}

async function main() {
  console.log("Fetching OSM street geometry...");
  console.log(`Mode: ${FORCE ? "FORCE (re-fetch all)" : "incremental (skip enriched)"}`);
  if (ONLY_FILES) {
    console.log(`Restricted to files: ${ONLY_FILES.join(", ")}`);
  }
  console.log();

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const { file, district } of FILES) {
    if (ONLY_FILES && !ONLY_FILES.includes(file)) {
      console.log(`\n--- ${file} SKIPPED (not in changed files) ---`);
      continue;
    }
    const filePath = join(DATA_DIR, file);
    const geojson = JSON.parse(readFileSync(filePath, "utf-8"));
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    console.log(`\n--- ${file} (${geojson.features.length} streets) ---`);

    for (const feature of geojson.features) {
      const name = feature.properties.name;
      const coordCount = countCoords(feature.geometry);

      if (!FORCE && coordCount > 10) {
        skipped++;
        continue;
      }

      process.stdout.write(`  ${name}...`);

      try {
        const elements = await queryOverpass(name, DISTRICT_BBOX[district]);

        if (elements.length === 0) {
          console.log(` NOT FOUND in OSM`);
          failed++;
          await sleep(DELAY_MS);
          continue;
        }

        const geometry = mergeWays(elements);
        if (!geometry) {
          console.log(` MERGE FAILED`);
          failed++;
          await sleep(DELAY_MS);
          continue;
        }

        const newCount = countCoords(geometry);
        feature.geometry = geometry;
        console.log(` OK (${coordCount} -> ${newCount} coords, ${elements.length} ways)`);
        updated++;
      } catch (err) {
        console.log(` ERROR: ${err.message}`);
        failed++;
      }

      await sleep(DELAY_MS);
    }

    writeFileSync(filePath, JSON.stringify(geojson, null, 2) + "\n");
    console.log(`\n  Result: ${updated} updated, ${skipped} skipped, ${failed} failed`);

    totalUpdated += updated;
    totalSkipped += skipped;
    totalFailed += failed;
  }

  console.log(`\n=== TOTAL: ${totalUpdated} updated, ${totalSkipped} skipped, ${totalFailed} failed ===`);

  if (totalFailed > 0) {
    console.log("\nStreets that failed may need name aliases or manual bbox adjustments.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
