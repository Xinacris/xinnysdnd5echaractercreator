import type { SrdFeature, SrdSubclass, SrdTrait } from "./types";

/** Feature level is a plain number in the 2014 SRD, a `{ name: "Barbarian 3" }` ref in 2024. */
export function featureLevel(f: SrdFeature): number {
  if (typeof f.level === "number") return f.level;
  const match = f.level.name.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

export function featureDescription(f: SrdFeature): string {
  return f.desc ? f.desc.join(" ") : (f.description ?? "");
}

export function traitDescription(t: SrdTrait): string {
  return t.desc ? t.desc.join(" ") : (t.description ?? "");
}

export function subclassDescription(s: SrdSubclass): string {
  return s.desc ? s.desc.join(" ") : (s.description ?? "");
}
