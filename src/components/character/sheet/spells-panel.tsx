"use client";

import { useMemo, useState } from "react";
import { Info, Plus, X } from "lucide-react";
import { useSrdData } from "@/hooks/use-srd-data";
import { getClass, getClassLevel, getSpellsForClass } from "@/lib/srd/loader";
import { abilityModifier, proficiencyBonus, spellAttackBonus, spellSaveDc, totalCharacterLevel } from "@/lib/character/calculations";
import type { AbilityKey } from "@/lib/i18n/abilities";
import type { Character } from "@/lib/character/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "@/components/info-tooltip";

export function SpellsPanel({
  character,
  onUpdate,
}: {
  character: Character;
  onUpdate: (patch: Partial<Character>) => void;
}) {
  const classIndex = character.classes[0]?.classIndex;
  const classLevel = character.classes[0]?.level ?? 1;
  const [open, setOpen] = useState(false);

  const selectedClass = useSrdData(
    () => (classIndex ? getClass(character.edition, classIndex) : Promise.resolve(undefined)),
    [character.edition, classIndex]
  );
  const levelData = useSrdData(
    () => (classIndex ? getClassLevel(character.edition, classIndex, classLevel) : Promise.resolve(undefined)),
    [character.edition, classIndex, classLevel]
  );
  const classSpells = useSrdData(
    () => (classIndex ? getSpellsForClass(character.edition, classIndex, 9) : Promise.resolve([])),
    [character.edition, classIndex]
  );

  const profBonus = proficiencyBonus(totalCharacterLevel(character));

  const knownSpellObjs = useMemo(
    () => (classSpells ?? []).filter((s) => character.spellcasting.known.includes(s.index)),
    [classSpells, character.spellcasting.known]
  );
  const cantrips = knownSpellObjs.filter((s) => s.level === 0);
  const leveled = knownSpellObjs.filter((s) => s.level > 0).sort((a, b) => a.level - b.level);

  if (!classIndex) return <p className="text-sm text-muted-foreground">Bu karakterin sınıfı yok.</p>;
  if (!selectedClass) return <Skeleton className="h-40 w-full" />;

  if (!selectedClass.spellcasting) {
    return <p className="text-sm text-muted-foreground">{selectedClass.name} büyü kullanamaz.</p>;
  }

  const spellcastingAbility = selectedClass.spellcasting.spellcasting_ability.index as AbilityKey;
  const abilityMod = abilityModifier(character.abilityScores[spellcastingAbility]);
  const slotLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => ({
    level: lvl,
    total: (levelData?.spellcasting?.[`spell_slots_level_${lvl}`] as number | undefined) ?? 0,
  })).filter((s) => s.total > 0);

  /** Only spells the character can actually cast right now: cantrips plus levels covered by their current spell slots. */
  const maxSpellLevel = slotLevels.length > 0 ? Math.max(...slotLevels.map((s) => s.level)) : 0;
  const addableSpells = (classSpells ?? []).filter((s) => s.level === 0 || s.level <= maxSpellLevel);

  function toggleSlotUsed(level: number, slotIdx: number) {
    const used = character.spellcasting.slotsUsed[level] ?? 0;
    const isUsed = slotIdx < used;
    const nextUsed = isUsed ? used - 1 : used + 1;
    onUpdate({
      spellcasting: { ...character.spellcasting, slotsUsed: { ...character.spellcasting.slotsUsed, [level]: nextUsed } },
    });
  }

  function addSpell(index: string) {
    if (character.spellcasting.known.includes(index)) return;
    onUpdate({ spellcasting: { ...character.spellcasting, known: [...character.spellcasting.known, index] } });
    setOpen(false);
  }

  function removeSpell(index: string) {
    onUpdate({
      spellcasting: {
        ...character.spellcasting,
        known: character.spellcasting.known.filter((s) => s !== index),
        prepared: character.spellcasting.prepared.filter((s) => s !== index),
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Büyü Yetkinliği</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">Yetkinlik: {selectedClass.spellcasting.spellcasting_ability.name}</Badge>
          <Badge variant="secondary">Büyü DC: {spellSaveDc(profBonus, abilityMod)}</Badge>
          <Badge variant="secondary">Büyü Atak Bonusu: +{spellAttackBonus(profBonus, abilityMod)}</Badge>
        </CardContent>
      </Card>

      {slotLevels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Büyü Yuvaları</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {slotLevels.map(({ level, total }) => {
              const used = character.spellcasting.slotsUsed[level] ?? 0;
              return (
                <div key={level} className="flex items-center gap-2 text-sm">
                  <span className="w-16">Seviye {level}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: total }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => toggleSlotUsed(level, i)}
                        className={`h-5 w-5 rounded-full border ${
                          i < used ? "bg-muted-foreground/40 border-border" : "border-primary"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Bilinen Büyüler</CardTitle>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> Büyü Ekle
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Command>
                <CommandInput placeholder="Büyü ara..." />
                <CommandList>
                  <CommandEmpty>Bulunamadı.</CommandEmpty>
                  <CommandGroup>
                    {addableSpells
                      .filter((s) => !character.spellcasting.known.includes(s.index))
                      .map((s) => (
                        <CommandItem key={s.index} value={s.name} onSelect={() => addSpell(s.index)}>
                          <span className="flex flex-1 items-center gap-1.5">
                            {s.name}
                            <InfoTooltip description={s.desc.join(" ")}>
                              <Info className="h-3.5 w-3.5 text-muted-foreground" />
                            </InfoTooltip>
                          </span>
                          <Badge variant="outline" className="ml-auto text-[10px]">
                            {s.level === 0 ? "Kantrip" : `Sv. ${s.level}`}
                          </Badge>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent>
          {cantrips.length === 0 && leveled.length === 0 && (
            <p className="text-sm text-muted-foreground">Henüz büyü seçilmedi.</p>
          )}
          <Accordion type="multiple">
            {[...cantrips, ...leveled].map((spell) => (
              <AccordionItem key={spell.index} value={spell.index}>
                <AccordionTrigger>
                  <span className="flex flex-1 items-center gap-2">
                    {spell.name}
                    <Badge variant="outline" className="text-[10px]">
                      {spell.level === 0 ? "Kantrip" : `Sv. ${spell.level}`}
                    </Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <p>{spell.desc.join(" ")}</p>
                  <p className="text-xs">
                    Menzil: {spell.range} · Süre: {spell.duration} · Zamanlama: {spell.casting_time}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-fit text-destructive"
                    onClick={() => removeSpell(spell.index)}
                  >
                    <X className="h-4 w-4" /> Kaldır
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
