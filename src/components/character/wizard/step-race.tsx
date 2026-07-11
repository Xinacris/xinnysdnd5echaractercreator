"use client";

import { useSrdData } from "@/hooks/use-srd-data";
import { getRaces, getSubracesForRace, getTraits, subraceTraitRefs } from "@/lib/srd/loader";
import { useContentLanguage } from "@/lib/i18n/content-language";
import { localizedTraitDescription } from "@/lib/i18n/content-descriptions";
import type { AbilityKey } from "@/lib/i18n/abilities";
import { ABILITY_ABBR, abilityFullName } from "@/lib/i18n/abilities";
import { slugToTitle } from "@/lib/slug";
import { useWizard } from "./wizard-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import type { SrdTrait } from "@/lib/srd/types";

export function StepRace() {
  const { language, t } = useContentLanguage();
  const { draft, update } = useWizard();
  const races = useSrdData(() => getRaces(draft.edition), [draft.edition]);
  const subraces = useSrdData(
    () => (draft.raceIndex ? getSubracesForRace(draft.edition, draft.raceIndex) : Promise.resolve([])),
    [draft.edition, draft.raceIndex]
  );
  const allTraits = useSrdData(() => getTraits(draft.edition), [draft.edition]);

  const race = races?.find((r) => r.index === draft.raceIndex);
  const subrace = subraces?.find((s) => s.index === draft.subraceIndex);

  const traitIndices = new Set<string>([
    ...(race?.traits.map((t) => t.index) ?? []),
    ...(subrace ? subraceTraitRefs(subrace).map((t) => t.index) : []),
  ]);
  const resolvedTraits: SrdTrait[] = (allTraits ?? []).filter((t) => traitIndices.has(t.index));

  const bonusChoice = race?.ability_bonus_options;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>{t("Race", "Irk")}</Label>
        {!races ? (
          <Skeleton className="h-9 w-full sm:w-80" />
        ) : (
          <Select
            value={draft.raceIndex}
            onValueChange={(v) =>
              update({ raceIndex: v, subraceIndex: undefined, raceAbilityBonusChoices: undefined })
            }
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder={t("Choose a race", "Bir ırk seç")} />
            </SelectTrigger>
            <SelectContent>
              {races.map((r) => (
                <SelectItem key={r.index} value={r.index}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {race && subraces && subraces.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>{t("Subrace", "Alt Irk")}</Label>
          <Select value={draft.subraceIndex ?? ""} onValueChange={(v) => update({ subraceIndex: v })}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder={t("Choose a subrace", "Bir alt ırk seç")} />
            </SelectTrigger>
            <SelectContent>
              {subraces.map((s) => (
                <SelectItem key={s.index} value={s.index}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {race && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{t("Speed", "Hız")}: {race.speed} ft</Badge>
          <Badge variant="secondary">{t("Size", "Boyut")}: {race.size}</Badge>
          {race.ability_bonuses?.map((b) => (
            <Badge key={b.ability_score.index}>
              {ABILITY_ABBR[b.ability_score.index as AbilityKey]} +{b.bonus}
            </Badge>
          ))}
          {subrace?.ability_bonuses?.map((b) => (
            <Badge key={b.ability_score.index}>
              {ABILITY_ABBR[b.ability_score.index as AbilityKey]} +{b.bonus} ({t("subrace", "alt ırk")})
            </Badge>
          ))}
        </div>
      )}

      {race && bonusChoice && (
        <div className="flex flex-col gap-2">
          <Label>
            {t("Choose Ability Score Bonus", "Yetenek Puanı Bonusu Seç")} ({(draft.raceAbilityBonusChoices ?? []).length} /{" "}
            {bonusChoice.choose})
          </Label>
          <div className="flex flex-wrap gap-3">
            {(bonusChoice.from.options as { ability_score: { index: string }; bonus: number }[]).map((opt) => {
              const key = opt.ability_score.index as AbilityKey;
              const selected = draft.raceAbilityBonusChoices ?? [];
              const checked = selected.includes(key);
              const disabled = !checked && selected.length >= bonusChoice.choose;
              return (
                <label
                  key={key}
                  className={`flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm ${
                    disabled ? "text-muted-foreground" : ""
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(c) => {
                      if (c === true) update({ raceAbilityBonusChoices: [...selected, key] });
                      else update({ raceAbilityBonusChoices: selected.filter((k) => k !== key) });
                    }}
                  />
                  {ABILITY_ABBR[key]} ({abilityFullName(key, language)}) +{opt.bonus}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {race && (
        <div className="flex flex-col gap-2">
          <Label>{t("Racial Traits", "Irk Özellikleri")}</Label>
          {!allTraits ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <Accordion type="multiple" className="w-full">
              {resolvedTraits.map((trait) => (
                <AccordionItem key={trait.index} value={trait.index}>
                  <AccordionTrigger>{trait.name}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {localizedTraitDescription(trait, language)}
                  </AccordionContent>
                </AccordionItem>
              ))}
              {resolvedTraits.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t(`No traits found for ${slugToTitle(race.index)}.`, `${slugToTitle(race.index)} için özellik bulunamadı.`)}
                </p>
              )}
            </Accordion>
          )}
        </div>
      )}
    </div>
  );
}
