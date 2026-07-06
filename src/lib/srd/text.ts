import type { SrdFeature, SrdSpell, SrdSubclass, SrdTrait } from "./types";

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

/**
 * Damage dice for a spell at the character's current level: cantrips scale with total
 * character level (`damage_at_character_level`); leveled spells show their base-slot
 * damage (`damage_at_slot_level` at the spell's own level) since the actual slot used
 * varies per cast and isn't known ahead of time.
 */
export function spellDamageText(spell: SrdSpell, characterLevel: number): string | null {
  const damage = spell.damage;
  if (!damage) return null;

  let dice: string | undefined;
  if (damage.damage_at_character_level) {
    const thresholds = Object.keys(damage.damage_at_character_level)
      .map(Number)
      .sort((a, b) => a - b);
    const applicable = thresholds.filter((t) => t <= characterLevel);
    const level = applicable.length > 0 ? Math.max(...applicable) : thresholds[0];
    dice = damage.damage_at_character_level[String(level)];
  } else if (damage.damage_at_slot_level) {
    dice = damage.damage_at_slot_level[String(spell.level)];
  }

  if (!dice) return null;
  return damage.damage_type ? `${dice} ${damage.damage_type.name}` : dice;
}
