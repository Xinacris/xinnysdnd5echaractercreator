import { SKILL_NAME_TR } from "@/lib/i18n/skills";

export type ProficiencyCategory = "skill" | "tool" | "other";

// The 2014 SRD prefixes skill proficiency refs with "skill-" (e.g. "skill-acrobatics");
// the 2024 SRD uses the bare skill index (e.g. "acrobatics"). Recognize both.
export function categorizeProficiencyIndex(index: string): { category: ProficiencyCategory; cleanIndex: string } {
  if (index.startsWith("skill-")) return { category: "skill", cleanIndex: index.slice("skill-".length) };
  if (index.startsWith("tool-")) return { category: "tool", cleanIndex: index.slice("tool-".length) };
  if (index in SKILL_NAME_TR) return { category: "skill", cleanIndex: index };
  return { category: "other", cleanIndex: index };
}
