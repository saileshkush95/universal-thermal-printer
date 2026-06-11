export function isBun(): boolean {
  return typeof Bun !== "undefined";
}

export function isNode(): boolean {
  return !isBun()
    && typeof process !== "undefined"
    && process.versions != null
    && typeof process.versions.node === "string";
}

export function isExpo(): boolean {
  return typeof navigator !== "undefined"
    && "product" in navigator
    && (navigator as any).product === "ReactNative";
}

export function isBrowser(): boolean {
  return typeof window !== "undefined"
    && typeof document !== "undefined"
    && !isExpo();
}

export function runtime(): "bun" | "node" | "expo" | "browser" | "unknown" {
  if (isBun()) return "bun";
  if (isNode()) return "node";
  if (isExpo()) return "expo";
  if (isBrowser()) return "browser";
  return "unknown";
}
