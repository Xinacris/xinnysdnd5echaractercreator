import type { SrdEquipment } from "./types";

/**
 * The 2024 SRD replaced the single `equipment_category` ref with a plural
 * `equipment_categories` array, dropped the `armor_category` string entirely,
 * and renamed some category indices (`weapon` -> `weapons`, shields live under
 * `shields` instead of an `armor_category: "Shield"` flag). These helpers hide
 * the difference so callers don't need edition branches.
 */
export function equipmentCategoryIndices(item: SrdEquipment): string[] {
  if (item.equipment_category) return [item.equipment_category.index];
  return (item.equipment_categories ?? []).map((c) => c.index);
}

export function isWeapon(item: SrdEquipment): boolean {
  const cats = equipmentCategoryIndices(item);
  return cats.includes("weapon") || cats.includes("weapons");
}

export type ArmorTier = "light" | "medium" | "heavy" | "shield";

export function armorTier(item: SrdEquipment): ArmorTier | null {
  if (item.armor_category) {
    if (item.armor_category === "Shield") return "shield";
    const lower = item.armor_category.toLowerCase();
    if (lower === "light" || lower === "medium" || lower === "heavy") return lower;
    return null;
  }
  const cats = equipmentCategoryIndices(item);
  if (cats.includes("shields")) return "shield";
  if (cats.includes("light-armor")) return "light";
  if (cats.includes("medium-armor")) return "medium";
  if (cats.includes("heavy-armor")) return "heavy";
  return null;
}

export function isArmorOrShield(item: SrdEquipment): boolean {
  return armorTier(item) !== null || Boolean(item.armor_class);
}

/** Ability modifier used for a weapon's attack/damage roll: finesse takes the better of Str/Dex, ranged weapons use Dex, everything else uses Str. */
export function weaponAbilityModifier(item: SrdEquipment, strModifier: number, dexModifier: number): number {
  const isFinesse = (item.properties ?? []).some((p) => p.index === "finesse");
  if (isFinesse) return Math.max(strModifier, dexModifier);
  return item.weapon_range === "Ranged" ? dexModifier : strModifier;
}
