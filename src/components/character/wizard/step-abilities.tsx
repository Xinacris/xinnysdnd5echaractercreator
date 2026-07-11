"use client";

import { useEffect, useMemo, useState } from "react";
import { useSrdData } from "@/hooks/use-srd-data";
import { getBackgrounds, getRaces, getSubracesForRace } from "@/lib/srd/loader";
import { normalizeBackground } from "@/lib/srd/background-adapter";
import { ABILITY_ABBR, ABILITY_KEYS, abilityFullName, type AbilityKey } from "@/lib/i18n/abilities";
import { abilityModifier, formatModifier } from "@/lib/character/calculations";
import { computeFinalAbilityScores } from "@/lib/character/ability-bonuses";
import { STANDARD_ARRAY, POINT_BUY_BUDGET, DEFAULT_ABILITY_SCORES, type AbilityScoreBlock, type AbilityScoreMethod } from "@/lib/character/types";
import { useContentLanguage } from "@/lib/i18n/content-language";
import { useWizard } from "./wizard-context";
import { BackgroundAbilityAllocator } from "./background-ability-allocator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dices } from "lucide-react";

const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

function rollAbility(): number {
  const rolls = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6));
  rolls.sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
}

export function StepAbilities() {
  const { t, language } = useContentLanguage();
  const { draft, update } = useWizard();
  const races = useSrdData(() => getRaces(draft.edition), [draft.edition]);
  const subraces = useSrdData(
    () => (draft.raceIndex ? getSubracesForRace(draft.edition, draft.raceIndex) : Promise.resolve([])),
    [draft.edition, draft.raceIndex]
  );
  const backgrounds = useSrdData(() => getBackgrounds(draft.edition), [draft.edition]);

  const race = races?.find((r) => r.index === draft.raceIndex);
  const subrace = subraces?.find((s) => s.index === draft.subraceIndex);
  const background = backgrounds?.find((b) => b.index === draft.backgroundIndex);
  const normalizedBg = background ? normalizeBackground(background) : undefined;

  const [base, setBase] = useState<AbilityScoreBlock>(draft.baseAbilityScores);
  const [rolledPool, setRolledPool] = useState<number[]>([]);
  const [arrayAssignment, setArrayAssignment] = useState<Record<AbilityKey, string>>(
    () => Object.fromEntries(ABILITY_KEYS.map((k) => [k, ""])) as Record<AbilityKey, string>
  );

  const pointsUsed = useMemo(
    () => ABILITY_KEYS.reduce((sum, k) => sum + (POINT_BUY_COST[base[k]] ?? 0), 0),
    [base]
  );

  useEffect(() => {
    const final = computeFinalAbilityScores(
      base,
      race,
      subrace,
      draft.raceAbilityBonusChoices,
      draft.backgroundAbilityScoreChoices
    );
    update({ baseAbilityScores: base, abilityScores: final });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, race, subrace, draft.raceAbilityBonusChoices, draft.backgroundAbilityScoreChoices]);

  function setMethod(method: AbilityScoreMethod) {
    update({ abilityScoreMethod: method });
    if (method === "manual") setBase({ ...base });
    if (method === "pointbuy") setBase({ ...DEFAULT_ABILITY_SCORES, str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
    if (method === "standard" || method === "roll") {
      setBase({ ...DEFAULT_ABILITY_SCORES });
      setArrayAssignment(Object.fromEntries(ABILITY_KEYS.map((k) => [k, ""])) as Record<AbilityKey, string>);
    }
  }

  function handleArrayAssign(key: AbilityKey, val: string) {
    setArrayAssignment((prev) => ({ ...prev, [key]: val }));
    const next = { ...base };
    next[key] = val ? Number(val) : 10;
    setBase(next);
  }

  function rollNewSet() {
    const pool = Array.from({ length: 6 }, rollAbility).sort((a, b) => b - a);
    setRolledPool(pool);
    setArrayAssignment(Object.fromEntries(ABILITY_KEYS.map((k) => [k, ""])) as Record<AbilityKey, string>);
    setBase({ ...DEFAULT_ABILITY_SCORES });
  }

  const method = draft.abilityScoreMethod;
  const pool = method === "roll" ? rolledPool : STANDARD_ARRAY;
  const usedValues = Object.values(arrayAssignment).filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>{t("Method", "Yöntem")}</Label>
        <Tabs value={method} onValueChange={(v) => setMethod(v as AbilityScoreMethod)}>
          <TabsList>
            <TabsTrigger value="standard">{t("Standard Array", "Standart Dizi")}</TabsTrigger>
            <TabsTrigger value="pointbuy">{t("Point Buy", "Puan Alışverişi")}</TabsTrigger>
            <TabsTrigger value="roll">{t("Roll", "Zar At")}</TabsTrigger>
            <TabsTrigger value="manual">{t("Manual", "Manuel")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {method === "roll" && (
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={rollNewSet}>
            <Dices className="h-4 w-4" />
            {t("Roll (4d6, drop lowest)", "Zar At (4d6, en düşüğü at)")}
          </Button>
          {rolledPool.length > 0 && (
            <span className="text-sm text-muted-foreground">{t("Results", "Sonuçlar")}: {rolledPool.join(", ")}</span>
          )}
        </div>
      )}

      {method === "pointbuy" && (
        <p className="text-sm text-muted-foreground">
          {t("Points remaining", "Kalan puan")}:{" "}
          <span className="font-medium text-foreground">{POINT_BUY_BUDGET - pointsUsed}</span> /{" "}
          {POINT_BUY_BUDGET}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ABILITY_KEYS.map((key) => {
          const finalScore = draft.abilityScores[key];
          const mod = abilityModifier(finalScore);
          return (
            <Card key={key}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{ABILITY_ABBR[key]}</span>
                  <span className="text-xs text-muted-foreground">{abilityFullName(key, language)}</span>
                </div>

                {(method === "standard" || method === "roll") && (
                  <Select
                    value={arrayAssignment[key]}
                    onValueChange={(v) => handleArrayAssign(key, v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("Select", "Seç")} />
                    </SelectTrigger>
                    <SelectContent>
                      {pool.map((v, i) => (
                        <SelectItem
                          key={`${v}-${i}`}
                          value={String(v)}
                          disabled={usedValues.includes(String(v)) && arrayAssignment[key] !== String(v)}
                        >
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {method === "pointbuy" && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={base[key] <= 8}
                      onClick={() => setBase((prev) => ({ ...prev, [key]: prev[key] - 1 }))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-medium">{base[key]}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={
                        base[key] >= 15 || pointsUsed + ((POINT_BUY_COST[base[key] + 1] ?? 99) - POINT_BUY_COST[base[key]]) > POINT_BUY_BUDGET
                      }
                      onClick={() => setBase((prev) => ({ ...prev, [key]: prev[key] + 1 }))}
                    >
                      +
                    </Button>
                  </div>
                )}

                {method === "manual" && (
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={base[key]}
                    onChange={(e) => setBase((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                  />
                )}

                <div className="text-sm text-muted-foreground">
                  {t("Base", "Temel")} {base[key]} → {t("Total", "Toplam")}{" "}
                  <span className="font-medium text-foreground">{finalScore}</span> ({formatModifier(mod)})
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {normalizedBg?.abilityScoreOptions && normalizedBg.abilityScoreOptions.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>
            {t("Ability Score Bonus from Background", "Geçmişten Gelen Yetenek Puanı Bonusu")} ({normalizedBg.name})
          </Label>
          <BackgroundAbilityAllocator
            options={normalizedBg.abilityScoreOptions}
            value={draft.backgroundAbilityScoreChoices ?? {}}
            onChange={(v) => update({ backgroundAbilityScoreChoices: v })}
          />
        </div>
      )}
    </div>
  );
}
