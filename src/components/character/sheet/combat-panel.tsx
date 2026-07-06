"use client";

import { useState } from "react";
import { useSrdData } from "@/hooks/use-srd-data";
import { getClassLevel, getClasses, getEquipment, getRaces } from "@/lib/srd/loader";
import { resolveEquippedArmor } from "@/lib/character/armor";
import { isWeapon, weaponAbilityModifier } from "@/lib/srd/equipment-adapter";
import {
  abilityModifier,
  computeArmorClass,
  formatModifier,
  maxHitPoints,
  proficiencyBonus,
  totalCharacterLevel,
  totalHitDice,
  unarmoredDefenseRule,
} from "@/lib/character/calculations";
import type { Character } from "@/lib/character/types";
import type { SrdEquipment } from "@/lib/srd/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Flame, Heart, Moon, Shield, Sun, Swords } from "lucide-react";

export function CombatPanel({
  character,
  onUpdate,
}: {
  character: Character;
  onUpdate: (patch: Partial<Character> | ((prev: Character) => Partial<Character>)) => void;
}) {
  const classes = useSrdData(() => getClasses(character.edition), [character.edition]);
  const equipment = useSrdData(() => getEquipment(character.edition), [character.edition]);
  const races = useSrdData(() => getRaces(character.edition), [character.edition]);
  const [healAmount, setHealAmount] = useState(1);

  const dexMod = abilityModifier(character.abilityScores.dex);
  const strMod = abilityModifier(character.abilityScores.str);
  const conMod = abilityModifier(character.abilityScores.con);
  const race = races?.find((r) => r.index === character.raceIndex);
  const profBonus = proficiencyBonus(totalCharacterLevel(character));

  const equippedWeapons = character.inventory
    .filter((i) => i.equipped && i.equipmentIndex)
    .map((i) => equipment?.find((e) => e.index === i.equipmentIndex))
    .filter((e): e is SrdEquipment => e !== undefined && isWeapon(e));

  const hitDiceByClass = (classes ?? []).map((c) => ({ classIndex: c.index, hitDie: c.hit_die }));
  const maxHp = maxHitPoints(character, hitDiceByClass, conMod);

  const { equippedArmorClass, hasShield } = equipment
    ? resolveEquippedArmor(character.inventory, equipment)
    : { equippedArmorClass: undefined, hasShield: false };
  const rule = unarmoredDefenseRule(character.classes.map((c) => c.classIndex));
  const unarmoredDefense = rule
    ? { abilityModifier: abilityModifier(character.abilityScores[rule.ability]), allowShield: rule.allowShield }
    : undefined;
  const armorClass =
    character.armorClassOverride ??
    computeArmorClass({ dexModifier: dexMod, equippedArmorClass, hasShield, unarmoredDefense });

  const totalDice = totalHitDice(character);
  const remainingDice = Math.max(0, totalDice - character.hitDiceUsed);
  const primaryHitDie = classes?.find((c) => c.index === character.classes[0]?.classIndex)?.hit_die ?? 8;

  const barbarianEntry = character.classes.find((c) => c.classIndex === "barbarian");
  const barbarianLevelData = useSrdData(
    () =>
      barbarianEntry
        ? getClassLevel(character.edition, "barbarian", barbarianEntry.level)
        : Promise.resolve(undefined),
    [character.edition, barbarianEntry?.level]
  );
  const rageTotal = (barbarianLevelData?.class_specific as { rage_count?: number } | undefined)?.rage_count;
  const rageUnlimited = rageTotal !== undefined && rageTotal >= 99;
  const rageUsed = character.rageUsed ?? 0;
  const rageRemaining = rageTotal !== undefined ? Math.max(0, rageTotal - rageUsed) : undefined;

  function spendRage() {
    onUpdate((prev) => ({ rageUsed: (prev.rageUsed ?? 0) + 1 }));
  }

  function applyDamage(amount: number) {
    let temp = character.temporaryHitPoints;
    let current = character.currentHitPoints;
    let remaining = amount;
    if (temp > 0) {
      const absorbed = Math.min(temp, remaining);
      temp -= absorbed;
      remaining -= absorbed;
    }
    current = Math.max(0, current - remaining);
    onUpdate({ temporaryHitPoints: temp, currentHitPoints: current });
  }

  function applyHeal(amount: number) {
    onUpdate({ currentHitPoints: Math.min(maxHp, character.currentHitPoints + amount) });
  }

  function spendHitDie() {
    if (remainingDice <= 0) return;
    const roll = 1 + Math.floor(Math.random() * primaryHitDie);
    const healed = Math.max(1, roll + conMod);
    onUpdate((prev) => ({
      hitDiceUsed: prev.hitDiceUsed + 1,
      currentHitPoints: Math.min(maxHp, prev.currentHitPoints + healed),
    }));
  }

  function longRest() {
    const diceToRestore = Math.max(1, Math.floor(totalDice / 2));
    onUpdate((prev) => ({
      currentHitPoints: maxHp,
      temporaryHitPoints: 0,
      hitDiceUsed: Math.max(0, prev.hitDiceUsed - diceToRestore),
      rageUsed: 0,
      deathSaves: { successes: 0, failures: 0 },
      exhaustionLevel: character.edition === "2024" ? Math.max(0, prev.exhaustionLevel - 1) : prev.exhaustionLevel,
      spellcasting: { ...prev.spellcasting, slotsUsed: {} },
    }));
  }

  function shortRest() {
    onUpdate({ deathSaves: { successes: 0, failures: 0 } });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {equippedWeapons.length > 0 && (
        <Card className="md:col-span-2 xl:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Swords className="h-4 w-4" /> Saldırılar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {equippedWeapons.map((w) => {
              const abilityMod = weaponAbilityModifier(w, strMod, dexMod);
              const attackBonus = abilityMod + profBonus;
              const damage = w.damage;
              const versatile = w.two_handed_damage;
              return (
                <div key={w.index} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium">{w.name}</span>
                  <span className="text-muted-foreground">
                    Vuruş {formatModifier(attackBonus)}
                    {damage &&
                      ` · Hasar ${damage.damage_dice}${abilityMod !== 0 ? ` ${formatModifier(abilityMod)}` : ""} ${damage.damage_type.name}`}
                    {versatile && ` (iki elle ${versatile.damage_dice}${abilityMod !== 0 ? ` ${formatModifier(abilityMod)}` : ""})`}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Zırh Sınıfı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{armorClass}</div>
          <p className="text-xs text-muted-foreground">
            {character.armorClassOverride !== undefined ? "Manuel değer" : "Otomatik hesaplandı"}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Input
              type="number"
              placeholder="Manuel"
              className="h-8 w-20"
              value={character.armorClassOverride ?? ""}
              onChange={(e) =>
                onUpdate({ armorClassOverride: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
          <Separator className="my-2" />
          <p className="text-sm">İnisiyatif: {formatModifier(dexMod)}</p>
          <p className="text-sm">Hız: {race?.speed ?? 30} fit</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4" /> Can Puanı
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={character.currentHitPoints}
              onChange={(e) => onUpdate({ currentHitPoints: Number(e.target.value) || 0 })}
              className="w-20 text-center font-semibold"
            />
            <span className="text-muted-foreground">/ {maxHp}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Label className="whitespace-nowrap">Geçici CP:</Label>
            <Input
              type="number"
              value={character.temporaryHitPoints}
              onChange={(e) => onUpdate({ temporaryHitPoints: Number(e.target.value) || 0 })}
              className="h-8 w-16"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={healAmount}
              onChange={(e) => setHealAmount(Number(e.target.value) || 0)}
              className="h-8 w-16"
            />
            <Button size="sm" variant="outline" onClick={() => applyDamage(healAmount)}>
              Hasar Al
            </Button>
            <Button size="sm" variant="outline" onClick={() => applyHeal(healAmount)}>
              İyileştir
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vuruş Zarları &amp; Dinlenme</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm">
            Kalan Zar: {remainingDice} / {totalDice} (d{primaryHitDie})
          </p>
          <Button size="sm" variant="outline" onClick={spendHitDie} disabled={remainingDice <= 0}>
            1 Zar Harca
          </Button>
          <Separator />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={shortRest}>
              <Sun className="h-4 w-4" /> Kısa Dinlenme
            </Button>
            <Button size="sm" variant="outline" onClick={longRest}>
              <Moon className="h-4 w-4" /> Uzun Dinlenme
            </Button>
          </div>
        </CardContent>
      </Card>

      {rageTotal !== undefined && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4" /> Öfke (Rage)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm">
              Kalan: {rageUnlimited ? "Sınırsız" : `${rageRemaining} / ${rageTotal}`}
            </p>
            <Button size="sm" variant="outline" onClick={spendRage} disabled={!rageUnlimited && rageRemaining === 0}>
              1 Öfke Harca
            </Button>
            <p className="text-xs text-muted-foreground">Uzun dinlenmede sıfırlanır.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Diğer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={character.inspiration}
              onCheckedChange={(c) => onUpdate({ inspiration: c === true })}
            />
            İlham (Inspiration)
          </label>
          <div className="flex items-center gap-2 text-sm">
            <Label className="whitespace-nowrap">Bitkinlik:</Label>
            <Input
              type="number"
              min={0}
              max={6}
              value={character.exhaustionLevel}
              onChange={(e) => onUpdate({ exhaustionLevel: Number(e.target.value) || 0 })}
              className="h-8 w-16"
            />
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span>Ölüm Kurtarma Zarları</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Başarı</span>
              {[0, 1, 2].map((i) => (
                <Checkbox
                  key={`s${i}`}
                  checked={i < character.deathSaves.successes}
                  onCheckedChange={(c) =>
                    onUpdate({
                      deathSaves: {
                        ...character.deathSaves,
                        successes: c === true ? i + 1 : i,
                      },
                    })
                  }
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Başarısız</span>
              {[0, 1, 2].map((i) => (
                <Checkbox
                  key={`f${i}`}
                  checked={i < character.deathSaves.failures}
                  onCheckedChange={(c) =>
                    onUpdate({
                      deathSaves: {
                        ...character.deathSaves,
                        failures: c === true ? i + 1 : i,
                      },
                    })
                  }
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
