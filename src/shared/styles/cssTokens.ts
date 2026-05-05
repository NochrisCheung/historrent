/**
 * Read a CSS custom property (e.g. `--canvas-bg`) from `:root` at runtime.
 * Server-safe: returns the supplied fallback when `window` is unavailable
 * (SSR / Node test environment).
 *
 * Three.js needs real colour strings, not CSS-variable tokens, so canvas
 * code calls this once when the scene is created. Tokens are static at
 * runtime in v1 (no theme switcher), so a single read is sufficient.
 */
export function readCssToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return resolved || fallback;
}
