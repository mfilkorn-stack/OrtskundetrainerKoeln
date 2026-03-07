/**
 * Shuffle an array using Fisher-Yates algorithm.
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pick n random items from an array.
 */
export function pickRandom<T>(array: T[], n: number): T[] {
  return shuffle(array).slice(0, n);
}

/**
 * Pick one random item from an array.
 */
export function pickOne<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
