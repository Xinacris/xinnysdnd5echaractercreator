"use client";

import { useMemo } from "react";
import { useSrdData } from "@/hooks/use-srd-data";
import { getClass, getClassLevel, getSpellsForClass } from "@/lib/srd/loader";
import { abilityModifier } from "@/lib/character/calculations";
import type { AbilityKey } from "@/lib/i18n/abilities";
import { useWizard } from "./wizard-context";
import { ReferenceChoicePicker } from "../reference-choice-picker";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function StepSpells() {
  const { draft, update } = useWizard();
  const classIndex = draft.classes[0]?.classIndex;

  const selectedClass = useSrdData(
    () => (classIndex ? getClass(draft.edition, classIndex) : Promise.resolve(undefined)),
    [draft.edition, classIndex]
  );
  const level1 = useSrdData(
    () => (classIndex ? getClassLevel(draft.edition, classIndex, 1) : Promise.resolve(undefined)),
    [draft.edition, classIndex]
  );
  const classSpells = useSrdData(
    () => (classIndex ? getSpellsForClass(draft.edition, classIndex, 1) : Promise.resolve([])),
    [draft.edition, classIndex]
  );

  const cantrips = useMemo(() => (classSpells ?? []).filter((s) => s.level === 0), [classSpells]);
  const leveledSpells = useMemo(() => (classSpells ?? []).filter((s) => s.level === 1), [classSpells]);

  if (!classIndex) return <p className="text-sm text-muted-foreground">Önce bir sınıf seçmelisin.</p>;
  if (!selectedClass || !level1 || !classSpells) return <Skeleton className="h-40 w-full" />;

  if (!selectedClass.spellcasting || selectedClass.spellcasting.level > 1) {
    return (
      <p className="text-sm text-muted-foreground">
        {selectedClass.name} 1. seviyede büyü kullanamaz. Bu adımı atlayabilirsin.
      </p>
    );
  }

  const cantripsKnown = level1.spellcasting?.cantrips_known ?? 0;
  const spellsKnownField = level1.spellcasting?.spells_known;
  const abilityMod = abilityModifier(
    draft.abilityScores[selectedClass.spellcasting.spellcasting_ability.index as AbilityKey]
  );
  // Prepared casters (Cleric/Druid/Wizard) don't have a fixed "spells known" count in SRD data —
  // they prepare ability-mod + level spells daily from their full class list. Wizard's spellbook
  // is a known-list exception, sized 6 at 1st level per the SRD's "Spellbook" feature text.
  const knownCount =
    spellsKnownField !== undefined ? spellsKnownField : classIndex === "wizard" ? 6 : Math.max(1, abilityMod + 1);

  const known = draft.spellcasting.known;

  function setCantrips(indices: string[]) {
    update({
      spellcasting: {
        ...draft.spellcasting,
        known: [...indices, ...known.filter((k) => leveledSpells.some((s) => s.index === k))],
      },
    });
  }

  function setLeveled(indices: string[]) {
    update({
      spellcasting: {
        ...draft.spellcasting,
        known: [...known.filter((k) => cantrips.some((s) => s.index === k)), ...indices],
        prepared: indices,
      },
    });
  }

  const currentCantrips = known.filter((k) => cantrips.some((s) => s.index === k));
  const currentLeveled = known.filter((k) => leveledSpells.some((s) => s.index === k));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Büyü Yetkinliği: {selectedClass.spellcasting.spellcasting_ability.name}</Badge>
        <Badge variant="secondary">1. Seviye Büyü Yuvası: {level1.spellcasting?.spell_slots_level_1 ?? 0}</Badge>
      </div>

      {cantripsKnown > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Kantrip Seç ({currentCantrips.length} / {cantripsKnown})</Label>
          <ReferenceChoicePicker
            options={cantrips.map((s) => ({ index: s.index, label: s.name }))}
            choose={cantripsKnown}
            value={currentCantrips}
            onChange={setCantrips}
          />
        </div>
      )}

      {knownCount > 0 && (
        <div className="flex flex-col gap-2">
          <Label>
            {classIndex === "wizard" ? "Büyü Kitabı" : "Hazırlanan Büyüler"} ({currentLeveled.length} / {knownCount})
          </Label>
          <ReferenceChoicePicker
            options={leveledSpells.map((s) => ({ index: s.index, label: s.name }))}
            choose={knownCount}
            value={currentLeveled}
            onChange={setLeveled}
          />
        </div>
      )}
    </div>
  );
}
