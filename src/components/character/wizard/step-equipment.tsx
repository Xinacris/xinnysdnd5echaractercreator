"use client";

import { useEffect, useMemo, useState } from "react";
import { useSrdData } from "@/hooks/use-srd-data";
import { getBackgrounds, getClasses, getEquipment } from "@/lib/srd/loader";
import { normalizeBackground } from "@/lib/srd/background-adapter";
import { isArmorOrShield, isWeapon } from "@/lib/srd/equipment-adapter";
import type { SrdChoice } from "@/lib/srd/types";
import { useWizard } from "./wizard-context";
import { useContentLanguage } from "@/lib/i18n/content-language";
import { EquipmentChoiceGroup, GOLD_SENTINEL_INDEX, type ResolvedEquipmentItem } from "../equipment-choice-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface ChoiceSource {
  key: string;
  title: string;
  choice: SrdChoice;
}

export function StepEquipment() {
  const { draft, update } = useWizard();
  const { t, language } = useContentLanguage();
  const classes = useSrdData(() => getClasses(draft.edition), [draft.edition]);
  const backgrounds = useSrdData(() => getBackgrounds(draft.edition), [draft.edition]);
  const equipment = useSrdData(() => getEquipment(draft.edition), [draft.edition]);

  const classIndex = draft.classes[0]?.classIndex;
  const selectedClass = classes?.find((c) => c.index === classIndex);
  const background = backgrounds?.find((b) => b.index === draft.backgroundIndex);
  const normalizedBg = background ? normalizeBackground(background) : undefined;

  const [resolvedBySource, setResolvedBySource] = useState<Record<string, ResolvedEquipmentItem[]>>({});

  const fixedItems: ResolvedEquipmentItem[] = useMemo(() => {
    const items: ResolvedEquipmentItem[] = [];
    for (const e of selectedClass?.starting_equipment ?? []) {
      items.push({ index: e.equipment.index, name: e.equipment.name, quantity: e.quantity });
    }
    for (const e of normalizedBg?.fixedEquipment ?? []) {
      items.push({ index: e.equipment.index, name: e.equipment.name, quantity: e.quantity });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass?.index, normalizedBg?.index]);

  const choiceSources: ChoiceSource[] = useMemo(() => {
    const sources: ChoiceSource[] = [];
    (selectedClass?.starting_equipment_options ?? []).forEach((c, i) =>
      sources.push({
        key: `class-eq-${i}`,
        title: `${selectedClass?.name} ${t("Equipment", "Ekipmanı")}`,
        choice: c,
      })
    );
    (normalizedBg?.equipmentChoices ?? []).forEach((c, i) =>
      sources.push({
        key: `bg-eq-${i}`,
        title: `${normalizedBg?.name} ${t("Equipment", "Ekipmanı")}`,
        choice: c,
      })
    );
    return sources;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass?.index, normalizedBg?.index, language]);

  useEffect(() => {
    const allChoiceItems = Object.values(resolvedBySource).flat();
    const goldFromChoices = allChoiceItems
      .filter((i) => i.index === GOLD_SENTINEL_INDEX)
      .reduce((sum, i) => sum + i.quantity, 0);
    const nonGoldChoiceItems = allChoiceItems.filter((i) => i.index !== GOLD_SENTINEL_INDEX);

    const merged = new Map<string, ResolvedEquipmentItem>();
    for (const item of [...fixedItems, ...nonGoldChoiceItems]) {
      const existing = merged.get(item.index);
      if (existing) existing.quantity += item.quantity;
      else merged.set(item.index, { ...item });
    }

    const inventory = Array.from(merged.values()).map((item) => {
      // Starting armor, shields, and weapons are worn/wielded by default so the
      // combat panel's AC shows the right number without an extra manual step.
      const srdItem = equipment?.find((e) => e.index === item.index);
      const isWorn = Boolean(srdItem) && (isArmorOrShield(srdItem!) || isWeapon(srdItem!));
      return {
        id: `${item.index}-${item.quantity}`,
        equipmentIndex: item.index,
        name: item.name,
        quantity: item.quantity,
        equipped: isWorn,
      };
    });

    const startingGoldFixed = normalizedBg?.startingGold?.quantity ?? 0;
    update({
      inventory,
      currency: { cp: 0, sp: 0, ep: 0, gp: startingGoldFixed + goldFromChoices, pp: 0 },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedBySource, fixedItems, normalizedBg?.startingGold?.quantity, equipment]);

  if (!classIndex) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("You need to select a class first.", "Önce bir sınıf seçmelisin.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!classes || !backgrounds ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <>
          {fixedItems.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>{t("Automatically Granted Equipment", "Otomatik Verilen Ekipman")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {fixedItems.map((item, i) => (
                  <Badge key={`${item.index}-${i}`} variant="secondary">
                    {item.quantity > 1 ? `${item.quantity}x ` : ""}
                    {item.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {normalizedBg?.startingGold && (
            <p className="text-sm text-muted-foreground">
              {t("Starting gold from background:", "Geçmişten başlangıç altını:")} {normalizedBg.startingGold.quantity}{" "}
              {normalizedBg.startingGold.unit}
            </p>
          )}

          {choiceSources.map((source) => (
            <div key={source.key} className="flex flex-col gap-2">
              <Label>
                {source.title}
                {source.choice.desc ? `: ${source.choice.desc}` : ""}
              </Label>
              <EquipmentChoiceGroup
                choice={source.choice}
                edition={draft.edition}
                onResolve={(items) => setResolvedBySource((prev) => ({ ...prev, [source.key]: items }))}
              />
              <Separator className="mt-2" />
            </div>
          ))}

          <Card>
            <CardContent>
              <Label className="mb-2 block">{t("Inventory Preview", "Envanter Önizlemesi")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {draft.inventory.map((item) => (
                  <Badge key={item.id} variant="outline">
                    {item.quantity > 1 ? `${item.quantity}x ` : ""}
                    {item.name}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("Gold:", "Altın:")} {draft.currency.gp} GP
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
