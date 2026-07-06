import type { InventoryItem } from "./types";
import type { SrdEquipment } from "@/lib/srd/types";
import { armorTier } from "@/lib/srd/equipment-adapter";
import type { ArmorClassInput } from "./calculations";

export function resolveEquippedArmor(
  inventory: InventoryItem[],
  equipmentList: SrdEquipment[]
): Pick<ArmorClassInput, "equippedArmorClass" | "hasShield"> {
  const equippedIndices = new Set(inventory.filter((i) => i.equipped && i.equipmentIndex).map((i) => i.equipmentIndex));
  const equippedItems = equipmentList.filter((e) => equippedIndices.has(e.index));
  const shield = equippedItems.find((e) => armorTier(e) === "shield");
  const bodyArmor = equippedItems.find((e) => {
    const tier = armorTier(e);
    return tier !== null && tier !== "shield";
  });
  const ac = bodyArmor?.armor_class;
  return {
    equippedArmorClass: ac ? { base: ac.base, dexBonus: ac.dex_bonus, maxDexBonus: ac.max_bonus } : undefined,
    hasShield: Boolean(shield),
  };
}
