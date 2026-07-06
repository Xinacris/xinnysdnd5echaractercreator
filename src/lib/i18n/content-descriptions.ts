import type { SrdFeature, SrdSpell, SrdSubclass, SrdTrait } from "@/lib/srd/types";
import { featureDescription, subclassDescription, traitDescription } from "@/lib/srd/text";
import type { ContentLanguage } from "./content-language";
import { SPELL_DESCRIPTIONS_TR } from "./spell-descriptions-tr";
import { FEATURE_DESCRIPTIONS_TR } from "./feature-descriptions-tr";
import { TRAIT_DESCRIPTIONS_TR } from "./trait-descriptions-tr";
import { SUBCLASS_DESCRIPTIONS_TR } from "./subclass-descriptions-tr";

/** Language-aware spell description: Turkish translation if available and requested, English SRD text otherwise. */
export function localizedSpellDescription(spell: SrdSpell, language: ContentLanguage): string {
  const original = [...spell.desc, ...(spell.higher_level ?? [])].join(" ");
  if (language === "tr") return SPELL_DESCRIPTIONS_TR[spell.index] ?? original;
  return original;
}

export function localizedFeatureDescription(feature: SrdFeature, language: ContentLanguage): string {
  const original = featureDescription(feature);
  if (language === "tr") return FEATURE_DESCRIPTIONS_TR[feature.index] ?? original;
  return original;
}

export function localizedTraitDescription(trait: SrdTrait, language: ContentLanguage): string {
  const original = traitDescription(trait);
  if (language === "tr") return TRAIT_DESCRIPTIONS_TR[trait.index] ?? original;
  return original;
}

export function localizedSubclassDescription(subclass: SrdSubclass, language: ContentLanguage): string {
  const original = subclassDescription(subclass);
  if (language === "tr") return SUBCLASS_DESCRIPTIONS_TR[subclass.index] ?? original;
  return original;
}
