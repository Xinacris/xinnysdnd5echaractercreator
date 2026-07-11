"use client";

import { useEffect, useState } from "react";
import { useSrdData } from "@/hooks/use-srd-data";
import {
  getClasses,
  getFeatures,
  getSubclassChoiceLevel,
  getSubclassesForClass,
} from "@/lib/srd/loader";
import { ABILITY_ABBR, ABILITY_KEYS, type AbilityKey } from "@/lib/i18n/abilities";
import { abilityModifier, maxHitPoints, totalCharacterLevel, totalHitDice } from "@/lib/character/calculations";
import { featureLevel } from "@/lib/srd/text";
import { categorizeProficiencyIndex } from "@/lib/character/proficiency-utils";
import { translateSkill } from "@/lib/i18n/skills";
import { useContentLanguage } from "@/lib/i18n/content-language";
import type { Character, CharacterClassLevel } from "@/lib/character/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ReferenceChoicePicker } from "../reference-choice-picker";

type HpMethod = "average" | "roll";

function averageHp(die: number) {
  return Math.floor(die / 2) + 1;
}

export function LevelUpDialog({
  character,
  open,
  onOpenChange,
  onConfirm,
}: {
  character: Character;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (patch: Partial<Character>) => void;
}) {
  const { t, language } = useContentLanguage();
  const classes = useSrdData(() => getClasses(character.edition), [character.edition]);
  const allFeatures = useSrdData(() => getFeatures(character.edition), [character.edition]);

  const [chosenClassIndex, setChosenClassIndex] = useState<string>(character.classes[0]?.classIndex ?? "");
  const [addingNewClass, setAddingNewClass] = useState(false);
  const [hpMethod, setHpMethod] = useState<HpMethod>("average");
  const [rolledHp, setRolledHp] = useState<number | null>(null);
  const [asiChoice, setAsiChoice] = useState<Partial<Record<AbilityKey, number>>>({});
  const [subclassIndex, setSubclassIndex] = useState<string>("");
  const [multiclassSelections, setMulticlassSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the form fields each time the dialog opens
      setChosenClassIndex(character.classes[0]?.classIndex ?? "");
      setAddingNewClass(false);
      setHpMethod("average");
      setRolledHp(null);
      setAsiChoice({});
      setSubclassIndex("");
      setMulticlassSelections({});
    }
  }, [open, character.classes]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale picks when the target class changes
    setMulticlassSelections({});
  }, [chosenClassIndex]);

  const existingEntry = character.classes.find((c) => c.classIndex === chosenClassIndex);
  const newLevel = (existingEntry?.level ?? 0) + 1;
  const selectedClass = classes?.find((c) => c.index === chosenClassIndex);
  const hitDie = selectedClass?.hit_die ?? 8;

  const subclassLevel = useSrdData(
    () => (chosenClassIndex ? getSubclassChoiceLevel(character.edition, chosenClassIndex) : Promise.resolve(0)),
    [character.edition, chosenClassIndex]
  );
  const subclassesForClass = useSrdData(
    () => (chosenClassIndex ? getSubclassesForClass(character.edition, chosenClassIndex) : Promise.resolve([])),
    [character.edition, chosenClassIndex]
  );
  const needsSubclassChoice =
    existingEntry &&
    !existingEntry.subclassIndex &&
    subclassLevel === newLevel &&
    (subclassesForClass?.length ?? 0) > 0;

  const isNewMulticlass = addingNewClass && !existingEntry && Boolean(chosenClassIndex);
  const multiclassChoices = isNewMulticlass
    ? (selectedClass?.multi_classing?.proficiency_choices ?? []).filter((c) => c.type === "proficiencies")
    : [];

  const isAsiLevel = (allFeatures ?? []).some(
    (f) => f.class.index === chosenClassIndex && featureLevel(f) === newLevel && /ability score improvement/i.test(f.name)
  );
  const asiPointsUsed = Object.values(asiChoice).reduce((sum, v) => sum + (v ?? 0), 0);

  const availableClasses = (classes ?? []).filter(
    (c) => addingNewClass && !character.classes.some((existing) => existing.classIndex === c.index)
  );

  function rollHp() {
    setRolledHp(1 + Math.floor(Math.random() * hitDie));
  }

  function adjustAsi(key: AbilityKey, delta: number) {
    setAsiChoice((prev) => {
      const current = prev[key] ?? 0;
      const nextVal = current + delta;
      if (nextVal < 0) return prev;
      if (character.abilityScores[key] + nextVal > 20) return prev;
      const nextTotal = asiPointsUsed - current + nextVal;
      if (nextTotal > 2) return prev;
      return { ...prev, [key]: nextVal };
    });
  }

  function handleConfirm() {
    if (!chosenClassIndex) return;
    const hpGain = hpMethod === "average" ? averageHp(hitDie) : rolledHp ?? averageHp(hitDie);

    let nextClasses: CharacterClassLevel[];
    if (existingEntry) {
      nextClasses = character.classes.map((c) =>
        c.classIndex === chosenClassIndex
          ? {
              ...c,
              level: c.level + 1,
              hitPointRolls: [...c.hitPointRolls, hpGain],
              subclassIndex: subclassIndex || c.subclassIndex,
            }
          : c
      );
    } else {
      nextClasses = [
        ...character.classes,
        { classIndex: chosenClassIndex, level: 1, hitPointRolls: [hitDie], subclassIndex: undefined },
      ];
    }

    const nextAbilityScores = { ...character.abilityScores };
    const nextBaseScores = { ...character.baseAbilityScores };
    for (const [key, val] of Object.entries(asiChoice)) {
      nextAbilityScores[key as AbilityKey] += val ?? 0;
      nextBaseScores[key as AbilityKey] += val ?? 0;
    }

    const nextSkillProficiencies = new Set(character.skillProficiencies);
    for (const indices of Object.values(multiclassSelections)) {
      for (const idx of indices) {
        const { category, cleanIndex } = categorizeProficiencyIndex(idx);
        if (category === "skill") nextSkillProficiencies.add(cleanIndex);
      }
    }

    // Leveling up counts as a long rest: full HP, hit dice/rage/spell slots recover the same way they would overnight.
    const conMod = abilityModifier(nextAbilityScores.con);
    const hitDiceByClass = (classes ?? []).map((c) => ({ classIndex: c.index, hitDie: c.hit_die }));
    const leveledCharacter = { ...character, classes: nextClasses };
    const newMaxHp = maxHitPoints(leveledCharacter, hitDiceByClass, conMod);
    const newTotalDice = totalHitDice(leveledCharacter);
    const diceToRestore = Math.max(1, Math.floor(newTotalDice / 2));

    onConfirm({
      classes: nextClasses,
      abilityScores: nextAbilityScores,
      baseAbilityScores: nextBaseScores,
      skillProficiencies: Array.from(nextSkillProficiencies),
      currentHitPoints: newMaxHp,
      temporaryHitPoints: 0,
      hitDiceUsed: Math.max(0, character.hitDiceUsed - diceToRestore),
      rageUsed: 0,
      deathSaves: { successes: 0, failures: 0 },
      exhaustionLevel:
        character.edition === "2024" ? Math.max(0, character.exhaustionLevel - 1) : character.exhaustionLevel,
      spellcasting: { ...character.spellcasting, slotsUsed: {} },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Level Up", "Seviye Atla")}</DialogTitle>
          <DialogDescription>
            {t("Current total level", "Şu anki toplam seviye")}: {totalCharacterLevel(character)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("Which class levels up?", "Hangi sınıf seviye atlayacak?")}</Label>
            <div className="flex flex-wrap gap-2">
              {character.classes.map((c) => (
                <Button
                  key={c.classIndex}
                  size="sm"
                  variant={!addingNewClass && chosenClassIndex === c.classIndex ? "default" : "outline"}
                  onClick={() => {
                    setAddingNewClass(false);
                    setChosenClassIndex(c.classIndex);
                  }}
                >
                  {c.classIndex} {c.level} → {c.level + 1}
                </Button>
              ))}
              <Button
                size="sm"
                variant={addingNewClass ? "default" : "outline"}
                onClick={() => setAddingNewClass(true)}
              >
                + {t("New Class (Multiclass)", "Yeni Sınıf (Multiclass)")}
              </Button>
            </div>
            {addingNewClass && (
              <Select value={chosenClassIndex} onValueChange={setChosenClassIndex}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder={t("Choose a class", "Sınıf seç")} />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((c) => (
                    <SelectItem key={c.index} value={c.index}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {multiclassChoices.length > 0 && (
            <div className="flex flex-col gap-3">
              <Label>{t(`${selectedClass?.name} Multiclass Proficiencies`, `${selectedClass?.name} Çoklu Sınıf Yetkinlikleri`)}</Label>
              {multiclassChoices.map((choice, i) => {
                const key = `mc-${i}`;
                const options = (choice.from.options ?? []).map((opt) => {
                  const o = opt as { item: { index: string; name: string } };
                  const { category, cleanIndex } = categorizeProficiencyIndex(o.item.index);
                  const label =
                    category === "skill"
                      ? translateSkill(cleanIndex, o.item.name.replace(/^Skill: /, ""), language)
                      : o.item.name.replace(/^(Tool|Skill): /, "");
                  return { index: o.item.index, label };
                });
                return (
                  <ReferenceChoicePicker
                    key={key}
                    options={options}
                    choose={choice.choose}
                    value={multiclassSelections[key] ?? []}
                    onChange={(v) => setMulticlassSelections((prev) => ({ ...prev, [key]: v }))}
                  />
                );
              })}
            </div>
          )}

          {chosenClassIndex && (
            <div className="flex flex-col gap-2">
              <Label>{t("Hit Point Increase", "Can Puanı Artışı")} (d{hitDie})</Label>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={hpMethod === "average" ? "default" : "outline"}
                  onClick={() => setHpMethod("average")}
                >
                  {t("Average", "Ortalama")} ({averageHp(hitDie)})
                </Button>
                <Button
                  size="sm"
                  variant={hpMethod === "roll" ? "default" : "outline"}
                  onClick={() => {
                    setHpMethod("roll");
                    rollHp();
                  }}
                >
                  {t("Roll", "Zar At")} {hpMethod === "roll" && rolledHp !== null ? `(${rolledHp})` : ""}
                </Button>
              </div>
            </div>
          )}

          {needsSubclassChoice && (
            <div className="flex flex-col gap-2">
              <Label>{t("Choose Subclass", "Alt Sınıf Seç")}</Label>
              <Select value={subclassIndex} onValueChange={setSubclassIndex}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder={t("Choose a subclass", "Alt sınıf seç")} />
                </SelectTrigger>
                <SelectContent>
                  {subclassesForClass!.map((s) => (
                    <SelectItem key={s.index} value={s.index}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isAsiLevel && (
            <div className="flex flex-col gap-2">
              <Label>{t("Ability Score Improvement (distribute 2 points)", "Yetenek Puanı Artışı (2 puan dağıt)")}</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ABILITY_KEYS.map((key) => (
                  <div key={key} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                    <span>
                      {ABILITY_ABBR[key]} ({character.abilityScores[key] + (asiChoice[key] ?? 0)})
                    </span>
                    <div className="flex items-center gap-1">
                      <Button size="icon-sm" variant="outline" onClick={() => adjustAsi(key, -1)}>
                        -
                      </Button>
                      <Button size="icon-sm" variant="outline" onClick={() => adjustAsi(key, 1)}>
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {asiPointsUsed} / 2 {t("points used", "puan kullanıldı")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("Cancel", "Vazgeç")}
          </Button>
          <Button onClick={handleConfirm} disabled={!chosenClassIndex}>
            {t("Confirm", "Onayla")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
