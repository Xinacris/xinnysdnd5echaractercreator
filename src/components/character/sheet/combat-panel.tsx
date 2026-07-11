"use client";

import { useState } from "react";
import { useSrdData } from "@/hooks/use-srd-data";
import { getClassLevel, getClasses, getEquipment, getFeatures, getRaces, getSpellsForClass } from "@/lib/srd/loader";
import { resolveEquippedArmor } from "@/lib/character/armor";
import { isWeapon, weaponAbilityModifier } from "@/lib/srd/equipment-adapter";
import { spellDamageText, spellHealText } from "@/lib/srd/text";
import { InfoTooltip } from "@/components/info-tooltip";
import { useContentLanguage } from "@/lib/i18n/content-language";
import { localizedFeatureDescription, localizedSpellDescription } from "@/lib/i18n/content-descriptions";
import {
  abilityModifier,
  computeArmorClass,
  formatModifier,
  maxHitPoints,
  proficiencyBonus,
  spellAttackBonus,
  spellSaveDc,
  totalCharacterLevel,
  totalHitDice,
  unarmoredDefenseRule,
} from "@/lib/character/calculations";
import type { AbilityKey } from "@/lib/i18n/abilities";
import type { Character } from "@/lib/character/types";
import type { SrdEquipment } from "@/lib/srd/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Flame, HandHeart, Heart, Moon, PawPrint, Shield, Sun, Swords } from "lucide-react";

export function CombatPanel({
  character,
  onUpdate,
}: {
  character: Character;
  onUpdate: (patch: Partial<Character> | ((prev: Character) => Partial<Character>)) => void;
}) {
  const { language, t } = useContentLanguage();
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

  const allFeatures = useSrdData(() => getFeatures(character.edition), [character.edition]);

  const primaryClassIndex = character.classes[0]?.classIndex;
  const primaryClassLevel = character.classes[0]?.level ?? 1;
  const selectedClass = classes?.find((c) => c.index === primaryClassIndex);
  const classSpells = useSrdData(
    () => (primaryClassIndex ? getSpellsForClass(character.edition, primaryClassIndex, 9) : Promise.resolve([])),
    [character.edition, primaryClassIndex]
  );
  const spellcastingAbility = selectedClass?.spellcasting?.spellcasting_ability.index as AbilityKey | undefined;
  const spellAbilityMod = spellcastingAbility ? abilityModifier(character.abilityScores[spellcastingAbility]) : 0;
  const knownSpells = (classSpells ?? [])
    .filter((s) => character.spellcasting.known.includes(s.index))
    .sort((a, b) => a.level - b.level);

  const primaryClassLevelData = useSrdData(
    () =>
      primaryClassIndex ? getClassLevel(character.edition, primaryClassIndex, primaryClassLevel) : Promise.resolve(undefined),
    [character.edition, primaryClassIndex, primaryClassLevel]
  );
  const spellSlotLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((lvl) => ({
      level: lvl,
      total: (primaryClassLevelData?.spellcasting?.[`spell_slots_level_${lvl}`] as number | undefined) ?? 0,
    }))
    .filter((s) => s.total > 0);

  function toggleSlotUsed(level: number, slotIdx: number) {
    const used = character.spellcasting.slotsUsed[level] ?? 0;
    const isUsed = slotIdx < used;
    const nextUsed = isUsed ? used - 1 : used + 1;
    onUpdate({
      spellcasting: { ...character.spellcasting, slotsUsed: { ...character.spellcasting.slotsUsed, [level]: nextUsed } },
    });
  }

  // Divine Smite spends a spell slot (any level, tracked above) rather than its own resource — the damage
  // scaling (2d8 base, +1d8 per slot level above 1st, capped at 5d8, +1d8 vs undead/fiends) is a fixed 5e
  // rule not exposed as structured SRD data.
  const paladinLevelForSmite = character.classes.find((c) => c.classIndex === "paladin")?.level;
  const divineSmiteFeature = (allFeatures ?? []).find(
    (f) => f.class.index === "paladin" && /divine smite|paladin's smite/i.test(f.name)
  );
  const hasDivineSmite =
    paladinLevelForSmite !== undefined &&
    divineSmiteFeature !== undefined &&
    paladinLevelForSmite >= 2;

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

  // Lay on Hands pool size (paladin level x 5) is a fixed 5e rule, not something the SRD data exposes as a number.
  const paladinEntry = character.classes.find((c) => c.classIndex === "paladin");
  const layOnHandsPool = paladinEntry ? paladinEntry.level * 5 : undefined;
  const layOnHandsUsed = character.layOnHandsUsed ?? 0;
  const layOnHandsRemaining =
    layOnHandsPool !== undefined ? Math.max(0, layOnHandsPool - layOnHandsUsed) : undefined;
  const [layOnHandsSpend, setLayOnHandsSpend] = useState(1);

  function spendLayOnHands(amount: number) {
    if (layOnHandsPool === undefined || amount <= 0) return;
    onUpdate((prev) => ({
      layOnHandsUsed: Math.min(layOnHandsPool, (prev.layOnHandsUsed ?? 0) + amount),
    }));
  }

  // Wild Shape's use count doesn't scale with level in the SRD data (both editions state "twice" in prose);
  // higher-level bonus uses described in 2024 text aren't exposed as a number, so this stays fixed at the base 2.
  const druidEntry = character.classes.find((c) => c.classIndex === "druid");
  const wildShapeTotal = druidEntry && druidEntry.level >= 2 ? 2 : undefined;
  const wildShapeUsed = character.wildShapeUsed ?? 0;
  const wildShapeRemaining = wildShapeTotal !== undefined ? Math.max(0, wildShapeTotal - wildShapeUsed) : undefined;

  function spendWildShape() {
    onUpdate((prev) => ({ wildShapeUsed: (prev.wildShapeUsed ?? 0) + 1 }));
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
      layOnHandsUsed: 0,
      wildShapeUsed: 0,
      deathSaves: { successes: 0, failures: 0 },
      exhaustionLevel: character.edition === "2024" ? Math.max(0, prev.exhaustionLevel - 1) : prev.exhaustionLevel,
      spellcasting: { ...prev.spellcasting, slotsUsed: {} },
    }));
  }

  function shortRest() {
    onUpdate({ deathSaves: { successes: 0, failures: 0 }, wildShapeUsed: 0 });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {(equippedWeapons.length > 0 || knownSpells.length > 0 || spellSlotLevels.length > 0 || hasDivineSmite) && (
        <Card className="md:col-span-2 xl:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Swords className="h-4 w-4" /> {t("Attacks", "Saldırılar")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {spellSlotLevels.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {spellSlotLevels.map(({ level, total }) => {
                  const used = character.spellcasting.slotsUsed[level] ?? 0;
                  return (
                    <div key={level} className="flex items-center gap-2 text-sm">
                      <span className="w-16 text-xs text-muted-foreground">
                        {t("Lvl.", "Sv.")} {level} {t("Slot", "Yuva")}
                      </span>
                      <div className="flex gap-1">
                        {Array.from({ length: total }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => toggleSlotUsed(level, i)}
                            className={`h-5 w-5 rounded-full border ${
                              i < used ? "border-border bg-muted-foreground/40" : "border-primary"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
                <Separator className="my-1" />
              </div>
            )}
            {hasDivineSmite && (
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                <span className="font-medium">
                  <InfoTooltip description={localizedFeatureDescription(divineSmiteFeature!, language)}>
                    {t("Divine Smite", "Kutsal Vuruş (Divine Smite)")}
                  </InfoTooltip>
                </span>
                <span className="text-muted-foreground">
                  {t(
                    "Damage 2d8 (Slot 1) · 3d8 (Slot 2) · 4d8 (Slot 3) · 5d8 (Slot 4+) Radiant (+1d8 vs Undead/Fiend)",
                    "Hasar 2d8 (Sv.1) · 3d8 (Sv.2) · 4d8 (Sv.3) · 5d8 (Sv.4+) Radiant (+1d8 Undead/İblis)"
                  )}
                </span>
              </div>
            )}
            {hasDivineSmite && (equippedWeapons.length > 0 || knownSpells.length > 0) && <Separator className="my-1" />}
            {equippedWeapons.map((w) => {
              const abilityMod = weaponAbilityModifier(w, strMod, dexMod);
              const attackBonus = abilityMod + profBonus;
              const damage = w.damage;
              const versatile = w.two_handed_damage;
              return (
                <div key={w.index} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium">{w.name}</span>
                  <span className="text-muted-foreground">
                    {t("Attack", "Vuruş")} {formatModifier(attackBonus)}
                    {damage &&
                      ` · ${t("Damage", "Hasar")} ${damage.damage_dice}${abilityMod !== 0 ? ` ${formatModifier(abilityMod)}` : ""} ${damage.damage_type.name}`}
                    {versatile && ` (${t("two-handed", "iki elle")} ${versatile.damage_dice}${abilityMod !== 0 ? ` ${formatModifier(abilityMod)}` : ""})`}
                  </span>
                </div>
              );
            })}
            {equippedWeapons.length > 0 && knownSpells.length > 0 && <Separator className="my-1" />}
            {knownSpells.map((s) => {
              const damageText = spellDamageText(s, totalCharacterLevel(character));
              const healText = spellHealText(s, spellAbilityMod);
              const parts: string[] = [];
              if (s.attack_type) parts.push(`${t("Attack", "Vuruş")} ${formatModifier(spellAttackBonus(profBonus, spellAbilityMod))}`);
              if (s.dc) parts.push(`${t("DC", "KZ")} ${spellSaveDc(profBonus, spellAbilityMod)} (${s.dc.dc_type.name})`);
              if (damageText) parts.push(`${t("Damage", "Hasar")} ${damageText}`);
              if (healText) parts.push(`${t("Healing", "İyileştirme")} ${healText}`);
              return (
                <div key={s.index} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium">
                    <InfoTooltip description={localizedSpellDescription(s, language)}>{s.name}</InfoTooltip>{" "}
                    <span className="text-xs text-muted-foreground">
                      ({s.level === 0 ? t("Cantrip", "Kantrip") : `${t("Lvl.", "Sv.")} ${s.level}`})
                    </span>
                  </span>
                  <span className="text-muted-foreground">{parts.join(" · ")}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> {t("Armor Class", "Zırh Sınıfı")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{armorClass}</div>
          <p className="text-xs text-muted-foreground">
            {character.armorClassOverride !== undefined
              ? t("Manual value", "Manuel değer")
              : t("Automatically calculated", "Otomatik hesaplandı")}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Input
              type="number"
              placeholder={t("Manual", "Manuel")}
              className="h-8 w-20"
              value={character.armorClassOverride ?? ""}
              onChange={(e) =>
                onUpdate({ armorClassOverride: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
          <Separator className="my-2" />
          <p className="text-sm">
            {t("Initiative:", "İnisiyatif:")} {formatModifier(dexMod)}
          </p>
          <p className="text-sm">
            {t("Speed:", "Hız:")} {race?.speed ?? 30} {t("ft", "fit")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4" /> {t("Hit Points", "Can Puanı")}
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
            <Label className="whitespace-nowrap">{t("Temp HP:", "Geçici CP:")}</Label>
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
              {t("Take Damage", "Hasar Al")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => applyHeal(healAmount)}>
              {t("Heal", "İyileştir")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("Hit Dice & Rest", "Vuruş Zarları & Dinlenme")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm">
            {t("Remaining Dice:", "Kalan Zar:")} {remainingDice} / {totalDice} (d{primaryHitDie})
          </p>
          <Button size="sm" variant="outline" onClick={spendHitDie} disabled={remainingDice <= 0}>
            {t("Spend 1 Die", "1 Zar Harca")}
          </Button>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={shortRest}>
              <Sun className="h-4 w-4" /> {t("Short Rest", "Kısa Dinlenme")}
            </Button>
            <Button size="sm" variant="outline" onClick={longRest}>
              <Moon className="h-4 w-4" /> {t("Long Rest", "Uzun Dinlenme")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {rageTotal !== undefined && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4" /> {t("Rage", "Öfke (Rage)")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm">
              {t("Remaining:", "Kalan:")} {rageUnlimited ? t("Unlimited", "Sınırsız") : `${rageRemaining} / ${rageTotal}`}
            </p>
            <Button size="sm" variant="outline" onClick={spendRage} disabled={!rageUnlimited && rageRemaining === 0}>
              {t("Spend 1 Rage", "1 Öfke Harca")}
            </Button>
            <p className="text-xs text-muted-foreground">{t("Resets on a long rest.", "Uzun dinlenmede sıfırlanır.")}</p>
          </CardContent>
        </Card>
      )}

      {layOnHandsPool !== undefined && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <HandHeart className="h-4 w-4" /> {t("Lay on Hands", "El Değmesi (Lay on Hands)")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm">
              {t("Remaining:", "Kalan:")} {layOnHandsRemaining} / {layOnHandsPool}
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={layOnHandsSpend}
                onChange={(e) => setLayOnHandsSpend(Number(e.target.value) || 0)}
                className="h-8 w-16"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => spendLayOnHands(layOnHandsSpend)}
                disabled={layOnHandsRemaining === 0}
              >
                {t("Spend", "Harca")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("Resets on a long rest.", "Uzun dinlenmede sıfırlanır.")}</p>
          </CardContent>
        </Card>
      )}

      {wildShapeTotal !== undefined && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PawPrint className="h-4 w-4" /> {t("Wild Shape", "Yaban Formu (Wild Shape)")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm">
              {t("Remaining:", "Kalan:")} {wildShapeRemaining} / {wildShapeTotal}
            </p>
            <Button size="sm" variant="outline" onClick={spendWildShape} disabled={wildShapeRemaining === 0}>
              {t("Use 1", "1 Kullan")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t("Resets on a short or long rest.", "Kısa ya da uzun dinlenmede sıfırlanır.")}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("Other", "Diğer")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={character.inspiration}
              onCheckedChange={(c) => onUpdate({ inspiration: c === true })}
            />
            {t("Inspiration", "İlham (Inspiration)")}
          </label>
          <div className="flex items-center gap-2 text-sm">
            <Label className="whitespace-nowrap">{t("Exhaustion:", "Bitkinlik:")}</Label>
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
            <span>{t("Death Saving Throws", "Ölüm Kurtarma Zarları")}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{t("Success", "Başarı")}</span>
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
              <span className="text-xs text-muted-foreground">{t("Failure", "Başarısız")}</span>
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
