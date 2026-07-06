"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useSrdData } from "@/hooks/use-srd-data";
import { getBackgrounds, getClasses, getRaces, getSubracesForRace } from "@/lib/srd/loader";
import { normalizeBackground } from "@/lib/srd/background-adapter";
import { ABILITY_ABBR, ABILITY_KEYS } from "@/lib/i18n/abilities";
import { abilityModifier, formatModifier } from "@/lib/character/calculations";
import { computeFinalAbilityScores } from "@/lib/character/ability-bonuses";
import { getCharacterRepository } from "@/lib/character/storage";
import { translateSkill } from "@/lib/i18n/skills";
import { slugToTitle } from "@/lib/slug";
import { useWizard } from "./wizard-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function StepSummary() {
  const { draft } = useWizard();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const classes = useSrdData(() => getClasses(draft.edition), [draft.edition]);
  const races = useSrdData(() => getRaces(draft.edition), [draft.edition]);
  const subraces = useSrdData(
    () => (draft.raceIndex ? getSubracesForRace(draft.edition, draft.raceIndex) : Promise.resolve([])),
    [draft.edition, draft.raceIndex]
  );
  const backgrounds = useSrdData(() => getBackgrounds(draft.edition), [draft.edition]);

  const selectedClass = classes?.find((c) => c.index === draft.classes[0]?.classIndex);
  const race = races?.find((r) => r.index === draft.raceIndex);
  const subrace = subraces?.find((s) => s.index === draft.subraceIndex);
  const background = backgrounds?.find((b) => b.index === draft.backgroundIndex);
  const normalizedBg = background ? normalizeBackground(background) : undefined;

  // Recomputed here (not read from draft.abilityScores) as a safety net: the free-navigation
  // step nav lets a player reach Summary without ever mounting the Abilities step, which is the
  // only place that otherwise applies race/background bonuses on top of the base scores.
  const finalAbilityScores =
    races && subraces && backgrounds
      ? computeFinalAbilityScores(
          draft.baseAbilityScores,
          race,
          subrace,
          draft.raceAbilityBonusChoices,
          draft.backgroundAbilityScoreChoices
        )
      : draft.abilityScores;

  const conMod = abilityModifier(finalAbilityScores.con);
  const maxHp = selectedClass ? selectedClass.hit_die + conMod : 0;

  async function handleFinish() {
    if (!draft.name.trim()) {
      toast.error("Karaktere bir isim vermelisin.");
      return;
    }
    if (!selectedClass) {
      toast.error("Bir sınıf seçmelisin.");
      return;
    }
    setSaving(true);
    const finalCharacter = {
      ...draft,
      abilityScores: finalAbilityScores,
      classes: [{ ...draft.classes[0], hitPointRolls: [selectedClass.hit_die] }],
      currentHitPoints: maxHp,
      savingThrowProficiencies: selectedClass.saving_throws.map((s) => s.index),
      armorProficiencies: selectedClass.proficiencies
        .filter((p) => !p.index.startsWith("saving-throw"))
        .map((p) => p.name),
      updatedAt: new Date().toISOString(),
    };
    await getCharacterRepository().save(finalCharacter);
    toast.success(`${draft.name} oluşturuldu!`);
    router.push(`/karakter/${draft.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{draft.name || "İsimsiz Karakter"}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{draft.edition === "2024" ? "D&D 5.5e" : "D&D 5e"}</Badge>
            {race && <Badge variant="secondary">{subrace ? subrace.name : race.name}</Badge>}
            {selectedClass && (
              <Badge variant="secondary">
                {selectedClass.name} 1{draft.classes[0]?.subclassIndex ? ` (${slugToTitle(draft.classes[0].subclassIndex)})` : ""}
              </Badge>
            )}
            {(normalizedBg?.name ?? draft.customBackgroundName) && (
              <Badge variant="secondary">{normalizedBg?.name ?? draft.customBackgroundName}</Badge>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ABILITY_KEYS.map((k) => (
              <div key={k} className="rounded-md border border-border p-2 text-center">
                <div className="text-xs text-muted-foreground">{ABILITY_ABBR[k]}</div>
                <div className="font-semibold">{finalAbilityScores[k]}</div>
                <div className="text-xs text-muted-foreground">{formatModifier(abilityModifier(finalAbilityScores[k]))}</div>
              </div>
            ))}
          </div>

          {selectedClass && (
            <p>
              Can Puanı (1. seviye): <span className="font-medium">{maxHp}</span> (d{selectedClass.hit_die} +{" "}
              {formatModifier(conMod)} CON)
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {draft.skillProficiencies.map((s) => (
              <Badge key={s} variant="outline">
                {translateSkill(s, slugToTitle(s))}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {draft.inventory.map((item) => (
              <Badge key={item.id} variant="outline">
                {item.quantity > 1 ? `${item.quantity}x ` : ""}
                {item.name}
              </Badge>
            ))}
          </div>
          <p className="text-muted-foreground">Altın: {draft.currency.gp} GP</p>
        </CardContent>
      </Card>

      <Button onClick={handleFinish} disabled={saving} size="lg">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Karakteri Oluştur
      </Button>
    </div>
  );
}
