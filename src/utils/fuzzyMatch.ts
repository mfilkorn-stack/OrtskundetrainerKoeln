/**
 * Normalize a street name for fuzzy comparison.
 * Handles: umlauts, Straße/Str./Strasse, case, whitespace.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/straße$/, "str")
    .replace(/strasse$/, "str")
    .replace(/str\.$/, "str")
    .replace(/platz$/, "pl")
    .replace(/pl\.$/, "pl")
    .replace(/\s+/g, " ");
}

/**
 * Check if two street names match (fuzzy).
 */
export function streetNamesMatch(input: string, target: string): boolean {
  return normalize(input) === normalize(target);
}

/**
 * Filter street names for autocomplete suggestions.
 */
export function filterStreetNames(
  query: string,
  names: string[]
): string[] {
  if (!query.trim()) return [];
  const q = normalize(query);
  return names.filter((name) => normalize(name).includes(q));
}
