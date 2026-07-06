"use client";

import { useState } from "react";
import type { AbilityKey } from "@/lib/i18n/abilities";
import { ABILITY_ABBR, ABILITY_FULL_TR } from "@/lib/i18n/abilities";
import type { SrdRef } from "@/lib/srd/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Pattern = "2-1" | "1-1-1";

/** 2024 SRD rule: distribute +2/+1 across two of the three eligible abilities, or +1 to all three. */
export function BackgroundAbilityAllocator({
  options,
  value,
  onChange,
}: {
  options: SrdRef[];
  value: Partial<Record<AbilityKey, number>>;
  onChange: (value: Partial<Record<AbilityKey, number>>) => void;
}) {
  const keys = options.map((o) => o.index as AbilityKey);
  const [pattern, setPattern] = useState<Pattern>(
    Object.values(value).includes(2) ? "2-1" : "1-1-1"
  );
  const [plusTwo, setPlusTwo] = useState<AbilityKey>(
    (Object.entries(value).find(([, v]) => v === 2)?.[0] as AbilityKey) ?? keys[0]
  );
  const [plusOne, setPlusOne] = useState<AbilityKey>(
    (Object.entries(value).find(([k, v]) => v === 1 && k !== plusTwo)?.[0] as AbilityKey) ??
      keys.find((k) => k !== plusTwo) ??
      keys[0]
  );

  function applyPattern(p: Pattern, twoKey: AbilityKey, oneKey: AbilityKey) {
    setPattern(p);
    setPlusTwo(twoKey);
    setPlusOne(oneKey);
    if (p === "1-1-1") {
      onChange(Object.fromEntries(keys.map((k) => [k, 1])));
    } else {
      onChange(
        Object.fromEntries(
          keys.filter((k) => k === twoKey || k === oneKey).map((k) => [k, k === twoKey ? 2 : 1])
        )
      );
    }
  }

  function handlePlusTwoChange(newTwoKey: AbilityKey) {
    const newOneKey = plusOne === newTwoKey ? (keys.find((k) => k !== newTwoKey) ?? plusOne) : plusOne;
    applyPattern("2-1", newTwoKey, newOneKey);
  }

  return (
    <div className="flex flex-col gap-3">
      <RadioGroup
        value={pattern}
        onValueChange={(v) => applyPattern(v as Pattern, plusTwo, plusOne)}
        className="gap-2"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="2-1" id="pattern-2-1" />
          <Label htmlFor="pattern-2-1" className="font-normal">
            Birine +2, başka birine +1
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="1-1-1" id="pattern-1-1-1" />
          <Label htmlFor="pattern-1-1-1" className="font-normal">
            Üçüne de +1
          </Label>
        </div>
      </RadioGroup>

      {pattern === "2-1" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">+2 alacak özellik:</Label>
            <Select value={plusTwo} onValueChange={(v) => handlePlusTwoChange(v as AbilityKey)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {keys.map((k) => (
                  <SelectItem key={k} value={k}>
                    {ABILITY_ABBR[k]} ({ABILITY_FULL_TR[k]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">+1 alacak özellik:</Label>
            <Select value={plusOne} onValueChange={(v) => applyPattern("2-1", plusTwo, v as AbilityKey)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {keys
                  .filter((k) => k !== plusTwo)
                  .map((k) => (
                    <SelectItem key={k} value={k}>
                      {ABILITY_ABBR[k]} ({ABILITY_FULL_TR[k]})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        {keys.map((k) => (
          <span key={k} className="rounded-md border border-border px-2 py-1">
            {ABILITY_ABBR[k]} +{value[k] ?? 0}
          </span>
        ))}
      </div>
    </div>
  );
}
