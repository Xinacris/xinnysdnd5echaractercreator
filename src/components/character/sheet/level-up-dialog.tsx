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
import { totalCharacterLevel } from "@/lib/character/calculations";
import { featureLevel } from "@/lib/srd/text";
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
  const classes = useSrdData(() => getClasses(character.edition), [character.edition]);
  const allFeatures = useSrdData(() => getFeatures(character.edition), [character.edition]);

  const [chosenClassIndex, setChosenClassIndex] = useState<string>(character.classes[0]?.classIndex ?? "");
  const [addingNewClass, setAddingNewClass] = useState(false);
  const [hpMethod, setHpMethod] = useState<HpMethod>("average");
  const [rolledHp, setRolledHp] = useState<number | null>(null);
  const [asiChoice, setAsiChoice] = useState<Partial<Record<AbilityKey, number>>>({});
  const [subclassIndex, setSubclassIndex] = useState<string>("");

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the form fields each time the dialog opens
      setChosenClassIndex(character.classes[0]?.classIndex ?? "");
      setAddingNewClass(false);
      setHpMethod("average");
      setRolledHp(null);
      setAsiChoice({});
      setSubclassIndex("");
    }
  }, [open, character.classes]);

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

    onConfirm({
      classes: nextClasses,
      abilityScores: nextAbilityScores,
      baseAbilityScores: nextBaseScores,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seviye Atla</DialogTitle>
          <DialogDescription>Şu anki toplam seviye: {totalCharacterLevel(character)}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Hangi sınıf seviye atlayacak?</Label>
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
                + Yeni Sınıf (Multiclass)
              </Button>
            </div>
            {addingNewClass && (
              <Select value={chosenClassIndex} onValueChange={setChosenClassIndex}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Sınıf seç" />
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

          {chosenClassIndex && (
            <div className="flex flex-col gap-2">
              <Label>Can Puanı Artışı (d{hitDie})</Label>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={hpMethod === "average" ? "default" : "outline"}
                  onClick={() => setHpMethod("average")}
                >
                  Ortalama ({averageHp(hitDie)})
                </Button>
                <Button
                  size="sm"
                  variant={hpMethod === "roll" ? "default" : "outline"}
                  onClick={() => {
                    setHpMethod("roll");
                    rollHp();
                  }}
                >
                  Zar At {hpMethod === "roll" && rolledHp !== null ? `(${rolledHp})` : ""}
                </Button>
              </div>
            </div>
          )}

          {needsSubclassChoice && (
            <div className="flex flex-col gap-2">
              <Label>Alt Sınıf Seç</Label>
              <Select value={subclassIndex} onValueChange={setSubclassIndex}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Alt sınıf seç" />
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
              <Label>Yetenek Puanı Artışı (2 puan dağıt)</Label>
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
              <p className="text-xs text-muted-foreground">{asiPointsUsed} / 2 puan kullanıldı</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button onClick={handleConfirm} disabled={!chosenClassIndex}>
            Onayla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
