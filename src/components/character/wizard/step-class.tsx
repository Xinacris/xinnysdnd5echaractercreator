"use client";

import { useEffect, useState } from "react";
import { useSrdData } from "@/hooks/use-srd-data";
import { getClasses, getSubclassChoiceLevel, getSubclassesForClass } from "@/lib/srd/loader";
import { subclassDescription } from "@/lib/srd/text";
import { ABILITY_ABBR } from "@/lib/i18n/abilities";
import type { AbilityKey } from "@/lib/i18n/abilities";
import { useWizard } from "./wizard-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function StepClass() {
  const { draft, update } = useWizard();
  const classes = useSrdData(() => getClasses(draft.edition), [draft.edition]);
  const primaryClass = draft.classes[0];
  const classIndex = primaryClass?.classIndex ?? "";

  const subclasses = useSrdData(
    () => (classIndex ? getSubclassesForClass(draft.edition, classIndex) : Promise.resolve([])),
    [draft.edition, classIndex]
  );
  const [subclassLevel, setSubclassLevel] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    if (!classIndex) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale value when class selection is removed
      setSubclassLevel(null);
      return;
    }
    getSubclassChoiceLevel(draft.edition, classIndex).then((lvl) => {
      if (active) setSubclassLevel(lvl);
    });
    return () => {
      active = false;
    };
  }, [draft.edition, classIndex]);

  const selectedClass = classes?.find((c) => c.index === classIndex);
  const showSubclassChoice = subclassLevel === 1 && subclasses && subclasses.length > 0;

  function selectClass(index: string) {
    update({
      classes: [{ classIndex: index, level: 1, hitPointRolls: [] }],
    });
  }

  function selectSubclass(subclassIndex: string) {
    update({
      classes: [{ ...draft.classes[0], subclassIndex }],
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Sınıf</Label>
        {!classes ? (
          <Skeleton className="h-9 w-full sm:w-80" />
        ) : (
          <Select value={classIndex} onValueChange={selectClass}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Bir sınıf seç" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.index} value={c.index}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-muted-foreground">
          Çoklu sınıf (multiclass) seviye atlarken karakter sayfasından eklenebilir.
        </p>
      </div>

      {selectedClass && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Vuruş Zarı: d{selectedClass.hit_die}</Badge>
          {selectedClass.saving_throws.map((s) => (
            <Badge key={s.index}>Kurtulma: {ABILITY_ABBR[s.index as AbilityKey]}</Badge>
          ))}
          {selectedClass.primary_ability?.ability_scores.map((p) => (
            <Badge key={p.index} variant="outline">
              Ana Özellik: {ABILITY_ABBR[p.index as AbilityKey] ?? p.name}
            </Badge>
          ))}
        </div>
      )}

      {selectedClass && (
        <div className="flex flex-col gap-2">
          <Label>Zırh / Silah / Araç Yetkinlikleri</Label>
          <div className="flex flex-wrap gap-1.5">
            {selectedClass.proficiencies.map((p) => (
              <Badge key={p.index} variant="outline">
                {p.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {showSubclassChoice && (
        <div className="flex flex-col gap-2">
          <Label>{selectedClass?.name} Alt Sınıfı</Label>
          <Select value={draft.classes[0]?.subclassIndex ?? ""} onValueChange={selectSubclass}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Bir alt sınıf seç" />
            </SelectTrigger>
            <SelectContent>
              {subclasses!.map((s) => (
                <SelectItem key={s.index} value={s.index}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {draft.classes[0]?.subclassIndex && (
            <p className="text-sm text-muted-foreground">
              {(() => {
                const sub = subclasses!.find((s) => s.index === draft.classes[0].subclassIndex);
                return sub ? subclassDescription(sub) : null;
              })()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
