"use client";

import { useEffect, useMemo, useState } from "react";
import { useSrdData } from "@/hooks/use-srd-data";
import { getBackgrounds, getClasses, getRaces, getSubracesForRace, getTraits, subraceTraitRefs } from "@/lib/srd/loader";
import { normalizeBackground } from "@/lib/srd/background-adapter";
import { translateSkill } from "@/lib/i18n/skills";
import { slugToTitle } from "@/lib/slug";
import { categorizeProficiencyIndex } from "@/lib/character/proficiency-utils";
import { useContentLanguage } from "@/lib/i18n/content-language";
import type { SrdChoice, SrdTrait } from "@/lib/srd/types";
import { useWizard } from "./wizard-context";
import { ReferenceChoicePicker } from "../reference-choice-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function labelForProficiencyRef(index: string, name: string, language: "en" | "tr"): string {
  const { category, cleanIndex } = categorizeProficiencyIndex(index);
  if (category === "skill") return translateSkill(cleanIndex, name.replace(/^Skill: /, ""), language);
  return name.replace(/^(Tool|Skill): /, "");
}

interface ChoiceSource {
  key: string;
  title: string;
  choice: SrdChoice;
}

export function StepSkills() {
  const { draft, update } = useWizard();
  const { t, language } = useContentLanguage();
  const classes = useSrdData(() => getClasses(draft.edition), [draft.edition]);
  const races = useSrdData(() => getRaces(draft.edition), [draft.edition]);
  const subraces = useSrdData(
    () => (draft.raceIndex ? getSubracesForRace(draft.edition, draft.raceIndex) : Promise.resolve([])),
    [draft.edition, draft.raceIndex]
  );
  const allTraits = useSrdData(() => getTraits(draft.edition), [draft.edition]);
  const backgrounds = useSrdData(() => getBackgrounds(draft.edition), [draft.edition]);

  const classIndex = draft.classes[0]?.classIndex;
  const selectedClass = classes?.find((c) => c.index === classIndex);
  const race = races?.find((r) => r.index === draft.raceIndex);
  const subrace = subraces?.find((s) => s.index === draft.subraceIndex);
  const background = backgrounds?.find((b) => b.index === draft.backgroundIndex);
  const normalizedBg = background ? normalizeBackground(background) : undefined;

  const traitIndices = new Set<string>([
    ...(race?.traits.map((t) => t.index) ?? []),
    ...(subrace ? subraceTraitRefs(subrace).map((t) => t.index) : []),
  ]);
  const raceTraitsWithChoices: SrdTrait[] = (allTraits ?? []).filter(
    (t) => traitIndices.has(t.index) && t.proficiency_choices
  );

  const raceTraitKey = raceTraitsWithChoices.map((t) => t.index).join(",");

  const choiceSources: ChoiceSource[] = useMemo(() => {
    const sources: ChoiceSource[] = [];
    if (selectedClass) {
      selectedClass.proficiency_choices
        .filter((c) => c.type === "proficiencies")
        .forEach((c, i) =>
          sources.push({ key: `class-${i}`, title: t(`${selectedClass.name} Proficiency`, `${selectedClass.name} Yetkinliği`), choice: c })
        );
    }
    raceTraitsWithChoices.forEach((trait) =>
      sources.push({ key: `trait-${trait.index}`, title: trait.name, choice: trait.proficiency_choices! })
    );
    return sources;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, raceTraitKey]);

  // Picks made in each choice picker, kept independent of the merged/derived
  // draft.skillProficiencies so background auto-grants can never leak back in
  // as "already chosen" (that was a real bug: Acolyte grants Insight+Religion,
  // which are also valid Wizard skill options, and they showed up pre-checked
  // and blocking the player's actual two picks).
  const [selectionsBySource, setSelectionsBySource] = useState<Record<string, string[]>>({});

  function getChoiceOptions(choice: SrdChoice) {
    return (choice.from.options ?? []).map((opt) => {
      const o = opt as { item: { index: string; name: string } };
      return { index: o.item.index, label: labelForProficiencyRef(o.item.index, o.item.name, language) };
    });
  }

  useEffect(() => {
    const skillSet = new Set<string>();
    const toolSet = new Set<string>();
    for (const ref of normalizedBg?.proficiencyRefs ?? []) {
      const { category, cleanIndex } = categorizeProficiencyIndex(ref.index);
      if (category === "skill") skillSet.add(cleanIndex);
      else toolSet.add(ref.index);
    }
    for (const indices of Object.values(selectionsBySource)) {
      for (const idx of indices) {
        const { category, cleanIndex } = categorizeProficiencyIndex(idx);
        if (category === "skill") skillSet.add(cleanIndex);
        else toolSet.add(idx);
      }
    }
    const nextSkills = Array.from(skillSet);
    const nextTools = Array.from(toolSet);
    if (
      nextSkills.length !== draft.skillProficiencies.length ||
      !nextSkills.every((s) => draft.skillProficiencies.includes(s)) ||
      nextTools.length !== draft.toolProficiencies.length
    ) {
      update({ skillProficiencies: nextSkills, toolProficiencies: nextTools });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedBg?.index, selectionsBySource]);

  if (!selectedClass && classes) {
    return <p className="text-sm text-muted-foreground">{t("You must choose a class first.", "Önce bir sınıf seçmelisin.")}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {!classes || !races || !backgrounds ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          {choiceSources.map((source) => (
            <div key={source.key} className="flex flex-col gap-2">
              <Label>
                {source.title}: {source.choice.desc ?? t(`choose ${source.choice.choose}`, `${source.choice.choose} seç`)}
              </Label>
              <ReferenceChoicePicker
                options={getChoiceOptions(source.choice)}
                choose={source.choice.choose}
                value={selectionsBySource[source.key] ?? []}
                onChange={(v) => setSelectionsBySource((prev) => ({ ...prev, [source.key]: v }))}
              />
              <Separator className="mt-2" />
            </div>
          ))}

          {normalizedBg && normalizedBg.proficiencyRefs.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>
                {t(`Automatic Proficiencies from ${normalizedBg.name} Background`, `${normalizedBg.name} Geçmişinden Otomatik Yetkinlikler`)}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {normalizedBg.proficiencyRefs.map((ref) => (
                  <Badge key={ref.index} variant="secondary">
                    {labelForProficiencyRef(ref.index, ref.name, language)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>{t("Selected Skill Proficiencies", "Seçili Beceri Yetkinlikleri")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {draft.skillProficiencies.length === 0 && (
                <span className="text-sm text-muted-foreground">{t("No skills selected yet.", "Henüz beceri seçilmedi.")}</span>
              )}
              {draft.skillProficiencies.map((s) => (
                <Badge key={s}>{translateSkill(s, slugToTitle(s), language)}</Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
