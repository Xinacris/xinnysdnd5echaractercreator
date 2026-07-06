import type {
  SrdAbilityScore,
  SrdBackground,
  SrdClass,
  SrdEdition,
  SrdEquipment,
  SrdEquipmentCategory,
  SrdFeat,
  SrdFeature,
  SrdLanguage,
  SrdLevel,
  SrdMagicItem,
  SrdProficiency,
  SrdRace,
  SrdSkill,
  SrdSpell,
  SrdSubclass,
  SrdSubrace,
  SrdTrait,
} from "./types";

// Every dataset is dynamically imported so webpack/Turbopack code-splits each
// SRD file into its own chunk, loaded only by the screens that need it.
const files = {
  "2014": {
    abilityScores: () => import("@/data/srd/2014/ability-scores.json"),
    backgrounds: () => import("@/data/srd/2014/backgrounds.json"),
    classes: () => import("@/data/srd/2014/classes.json"),
    equipment: () => import("@/data/srd/2014/equipment.json"),
    equipmentCategories: () => import("@/data/srd/2014/equipment-categories.json"),
    feats: () => import("@/data/srd/2014/feats.json"),
    features: () => import("@/data/srd/2014/features.json"),
    languages: () => import("@/data/srd/2014/languages.json"),
    levels: () => import("@/data/srd/2014/levels.json"),
    magicItems: () => import("@/data/srd/2014/magic-items.json"),
    proficiencies: () => import("@/data/srd/2014/proficiencies.json"),
    races: () => import("@/data/srd/2014/races.json"),
    skills: () => import("@/data/srd/2014/skills.json"),
    spells: () => import("@/data/srd/2014/spells.json"),
    subclasses: () => import("@/data/srd/2014/subclasses.json"),
    subraces: () => import("@/data/srd/2014/subraces.json"),
    traits: () => import("@/data/srd/2014/traits.json"),
  },
  "2024": {
    abilityScores: () => import("@/data/srd/2024/ability-scores.json"),
    backgrounds: () => import("@/data/srd/2024/backgrounds.json"),
    classes: () => import("@/data/srd/2024/classes.json"),
    equipment: () => import("@/data/srd/2024/equipment.json"),
    equipmentCategories: () => import("@/data/srd/2024/equipment-categories.json"),
    feats: () => import("@/data/srd/2024/feats.json"),
    features: () => import("@/data/srd/2024/features.json"),
    languages: () => import("@/data/srd/2024/languages.json"),
    levels: () => import("@/data/srd/2024/levels.json"),
    magicItems: () => import("@/data/srd/2024/magic-items.json"),
    proficiencies: () => import("@/data/srd/2024/proficiencies.json"),
    // 2024 SRD renamed "races" to "species"; exposed under the same accessor name.
    races: () => import("@/data/srd/2024/species.json"),
    skills: () => import("@/data/srd/2024/skills.json"),
    // The 2024 SRD release has no standalone spell-description file yet;
    // spell mechanics (slots, known counts) still come from 2024 class/level
    // data, but descriptions fall back to the 2014 SRD spell list (same core spells).
    spells: () => import("@/data/srd/2014/spells.json"),
    subclasses: () => import("@/data/srd/2024/subclasses.json"),
    subraces: () => import("@/data/srd/2024/subspecies.json"),
    traits: () => import("@/data/srd/2024/traits.json"),
  },
} as const;

// Simple in-memory cache so repeated navigation doesn't re-parse JSON.
const cache = new Map<string, unknown>();

async function load<T>(edition: SrdEdition, key: keyof (typeof files)["2014"]): Promise<T> {
  const cacheKey = `${edition}:${key}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey) as T;
  const mod = await files[edition][key]();
  const data = (mod as { default: unknown }).default as T;
  cache.set(cacheKey, data);
  return data;
}

export const getAbilityScores = (edition: SrdEdition) => load<SrdAbilityScore[]>(edition, "abilityScores");
export const getBackgrounds = (edition: SrdEdition) => load<SrdBackground[]>(edition, "backgrounds");
export const getClasses = (edition: SrdEdition) => load<SrdClass[]>(edition, "classes");
export const getEquipment = (edition: SrdEdition) => load<SrdEquipment[]>(edition, "equipment");
export const getEquipmentCategories = (edition: SrdEdition) =>
  load<SrdEquipmentCategory[]>(edition, "equipmentCategories");
export const getFeats = (edition: SrdEdition) => load<SrdFeat[]>(edition, "feats");
export const getFeatures = (edition: SrdEdition) => load<SrdFeature[]>(edition, "features");
export const getLanguages = (edition: SrdEdition) => load<SrdLanguage[]>(edition, "languages");
export const getLevels = (edition: SrdEdition) => load<SrdLevel[]>(edition, "levels");
export const getMagicItems = (edition: SrdEdition) => load<SrdMagicItem[]>(edition, "magicItems");
export const getProficiencies = (edition: SrdEdition) => load<SrdProficiency[]>(edition, "proficiencies");
export const getRaces = (edition: SrdEdition) => load<SrdRace[]>(edition, "races");
export const getSkills = (edition: SrdEdition) => load<SrdSkill[]>(edition, "skills");
export const getSpells = (edition: SrdEdition) => load<SrdSpell[]>(edition, "spells");
export const getSubclasses = (edition: SrdEdition) => load<SrdSubclass[]>(edition, "subclasses");
export const getSubraces = (edition: SrdEdition) => load<SrdSubrace[]>(edition, "subraces");
export const getTraits = (edition: SrdEdition) => load<SrdTrait[]>(edition, "traits");

export async function getClass(edition: SrdEdition, index: string) {
  const classes = await getClasses(edition);
  return classes.find((c) => c.index === index);
}

export async function getRace(edition: SrdEdition, index: string) {
  const races = await getRaces(edition);
  return races.find((r) => r.index === index);
}

export async function getBackground(edition: SrdEdition, index: string) {
  const backgrounds = await getBackgrounds(edition);
  return backgrounds.find((b) => b.index === index);
}

export async function getClassLevels(edition: SrdEdition, classIndex: string) {
  const levels = await getLevels(edition);
  return levels
    .filter((l) => l.class.index === classIndex && !l.subclass)
    .sort((a, b) => a.level - b.level);
}

export async function getClassLevel(edition: SrdEdition, classIndex: string, level: number) {
  const levels = await getClassLevels(edition, classIndex);
  return levels.find((l) => l.level === level);
}

/** The character level at which this class's players choose a subclass, derived from level data. */
export async function getSubclassChoiceLevel(edition: SrdEdition, classIndex: string): Promise<number> {
  const levels = await getLevels(edition);
  const withSubclass = levels.filter((l) => l.class.index === classIndex && l.subclass);
  if (withSubclass.length === 0) return 3;
  return Math.min(...withSubclass.map((l) => l.level));
}

export async function getSubclassesForClass(edition: SrdEdition, classIndex: string) {
  const subclasses = await getSubclasses(edition);
  return subclasses.filter((s) => s.class.index === classIndex);
}

export async function getSubracesForRace(edition: SrdEdition, raceIndex: string) {
  const subraces = await getSubraces(edition);
  return subraces.filter((s) => (s.race ?? s.species)?.index === raceIndex);
}

/** Racial traits, normalized across the 2014 (`racial_traits`) and 2024 (`traits`) shapes. */
export function subraceTraitRefs(subrace: SrdSubrace) {
  return subrace.racial_traits ?? subrace.traits ?? [];
}

export async function getSpellsForClass(edition: SrdEdition, classIndex: string, maxLevel?: number) {
  const spells = await getSpells(edition);
  return spells.filter(
    (s) => s.classes.some((c) => c.index === classIndex) && (maxLevel === undefined || s.level <= maxLevel)
  );
}

export async function getEquipmentByCategory(edition: SrdEdition, categoryIndex: string) {
  const categories = await getEquipmentCategories(edition);
  const category = categories.find((c) => c.index === categoryIndex);
  if (!category) return [];
  const all = await getEquipment(edition);
  const indices = new Set(category.equipment.map((e) => e.index));
  return all.filter((e) => indices.has(e.index));
}
