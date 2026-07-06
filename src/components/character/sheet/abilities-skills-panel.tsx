"use client";

import { useSrdData } from "@/hooks/use-srd-data";
import { getFeatures, getSkills } from "@/lib/srd/loader";
import { featureLevel } from "@/lib/srd/text";
import { ABILITY_ABBR, ABILITY_FULL_TR, ABILITY_KEYS, type AbilityKey } from "@/lib/i18n/abilities";
import { translateSkill } from "@/lib/i18n/skills";
import {
  abilityModifier,
  formatModifier,
  passivePerception,
  proficiencyBonus,
  savingThrowBonus,
  skillBonus,
  totalCharacterLevel,
} from "@/lib/character/calculations";
import type { Character } from "@/lib/character/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function AbilitiesSkillsPanel({
  character,
  onUpdate,
}: {
  character: Character;
  onUpdate: (patch: Partial<Character>) => void;
}) {
  const skills = useSrdData(() => getSkills(character.edition), [character.edition]);
  const allFeatures = useSrdData(() => getFeatures(character.edition), [character.edition]);
  const profBonus = proficiencyBonus(totalCharacterLevel(character));

  /** How many skills the character can currently mark as Expertise, derived from class features named "Expertise" (Rogue/Bard/Ranger). SRD structured data gives the exact count for 2014; 2024 features don't expose it per-tier, so unlocks default to 2 (matches every known instance). Zero means the class grants no Expertise, and the toggle should not be offered at all. */
  const expertiseSlots = (allFeatures ?? [])
    .filter(
      (f) =>
        !f.subclass &&
        /expertise/i.test(f.name) &&
        character.classes.some((c) => f.class.index === c.classIndex && featureLevel(f) <= c.level)
    )
    .reduce((sum, f) => {
      const choose = (f.feature_specific?.expertise_options as { choose?: number } | undefined)?.choose;
      return sum + (choose ?? 2);
    }, 0);

  function setAbilityScore(key: AbilityKey, value: number) {
    onUpdate({ abilityScores: { ...character.abilityScores, [key]: value } });
  }

  function toggleSkill(index: string, checked: boolean) {
    const next = checked
      ? [...character.skillProficiencies, index]
      : character.skillProficiencies.filter((s) => s !== index);
    const nextExpertise = checked ? character.skillExpertise : character.skillExpertise.filter((s) => s !== index);
    onUpdate({ skillProficiencies: next, skillExpertise: nextExpertise });
  }

  function toggleExpertise(index: string, checked: boolean) {
    const next = checked ? [...character.skillExpertise, index] : character.skillExpertise.filter((s) => s !== index);
    onUpdate({ skillExpertise: next });
  }

  function toggleSavingThrow(key: AbilityKey, checked: boolean) {
    const next = checked
      ? [...character.savingThrowProficiencies, key]
      : character.savingThrowProficiencies.filter((s) => s !== key);
    onUpdate({ savingThrowProficiencies: next });
  }

  const perceptionBonus = skills
    ? (() => {
        const perception = skills.find((s) => s.index === "perception");
        if (!perception) return 0;
        const key = perception.ability_score.index as AbilityKey;
        return skillBonus(
          character.abilityScores[key],
          profBonus,
          character.skillProficiencies.includes("perception"),
          character.skillExpertise.includes("perception")
        );
      })()
    : 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Yetenek Puanları</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {ABILITY_KEYS.map((key) => (
            <div key={key} className="flex flex-col gap-1 rounded-md border border-border p-2 text-center">
              <span className="text-xs text-muted-foreground">
                {ABILITY_ABBR[key]} · {ABILITY_FULL_TR[key]}
              </span>
              <Input
                type="number"
                value={character.abilityScores[key]}
                onChange={(e) => setAbilityScore(key, Number(e.target.value) || 0)}
                className="text-center font-semibold"
              />
              <span className="text-xs text-muted-foreground">
                {formatModifier(abilityModifier(character.abilityScores[key]))}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kurtulma Zarları</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {ABILITY_KEYS.map((key) => {
            const proficient = character.savingThrowProficiencies.includes(key);
            const bonus = savingThrowBonus(character.abilityScores[key], profBonus, proficient);
            return (
              <label key={key} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <Checkbox checked={proficient} onCheckedChange={(c) => toggleSavingThrow(key, c === true)} />
                  {ABILITY_ABBR[key]}
                </span>
                <span className="font-medium">{formatModifier(bonus)}</span>
              </label>
            );
          })}
          <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2 text-sm text-muted-foreground">
            <span>Yetkinlik Bonusu: {formatModifier(profBonus)}</span>
            <span>Pasif Algı: {passivePerception(perceptionBonus)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 lg:row-span-2">
        <CardHeader>
          <CardTitle className="text-base">Beceriler</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {!skills ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            skills
              .slice()
              .sort((a, b) => translateSkill(a.index, a.name).localeCompare(translateSkill(b.index, b.name), "tr"))
              .map((skill) => {
                const key = skill.ability_score.index as AbilityKey;
                const proficient = character.skillProficiencies.includes(skill.index);
                const expertise = character.skillExpertise.includes(skill.index);
                const bonus = skillBonus(character.abilityScores[key], profBonus, proficient, expertise);
                return (
                  <div key={skill.index} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Checkbox
                        checked={proficient}
                        onCheckedChange={(c) => toggleSkill(skill.index, c === true)}
                      />
                      <span className="w-8 text-xs text-muted-foreground">{ABILITY_ABBR[key]}</span>
                      {translateSkill(skill.index, skill.name)}
                      {proficient && expertiseSlots > 0 && (() => {
                        const atCap = !expertise && character.skillExpertise.length >= expertiseSlots;
                        return (
                          <button
                            type="button"
                            onClick={() => toggleExpertise(skill.index, !expertise)}
                            disabled={atCap}
                            title={`Uzmanlık (Expertise) — ${character.skillExpertise.length} / ${expertiseSlots}`}
                          >
                            <Badge
                              variant={expertise ? "default" : "outline"}
                              className={`ml-1 text-[10px] ${atCap ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
                            >
                              U
                            </Badge>
                          </button>
                        );
                      })()}
                    </span>
                    <span className="font-medium">{formatModifier(bonus)}</span>
                  </div>
                );
              })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
