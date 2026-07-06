"use client";

import { useEffect, useMemo, useState } from "react";
import type { SrdChoice, SrdEdition, SrdEquipment, SrdRef } from "@/lib/srd/types";
import { getEquipmentByCategory } from "@/lib/srd/loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export interface ResolvedEquipmentItem {
  index: string;
  name: string;
  quantity: number;
}

type OptionNode =
  | { option_type: "counted_reference"; count: number; of: SrdRef }
  | { option_type: "multiple"; items: OptionNode[] }
  | { option_type: "choice"; choice: SrdChoice }
  | { option_type: "reference"; item: SrdRef }
  | { option_type: "money"; count: number; unit: string };

// Sentinel index used to smuggle a gold grant through the equipment-item pipeline;
// consumers (step-equipment) route this into currency instead of the inventory.
export const GOLD_SENTINEL_INDEX = "__gold__";

function nodeLabel(node: OptionNode): string {
  switch (node.option_type) {
    case "counted_reference":
      return node.count > 1 ? `${node.count}x ${node.of.name}` : node.of.name;
    case "reference":
      return node.item.name;
    case "multiple":
      return node.items.map(nodeLabel).join(" + ");
    case "choice":
      return node.choice.desc ?? `${node.choice.choose} seçim`;
    case "money":
      return `${node.count} ${node.unit.toUpperCase()}`;
  }
}

function leafItems(node: OptionNode): ResolvedEquipmentItem[] | null {
  switch (node.option_type) {
    case "counted_reference":
      return [{ index: node.of.index, name: node.of.name, quantity: node.count }];
    case "reference":
      return [{ index: node.item.index, name: node.item.name, quantity: 1 }];
    case "money":
      return [{ index: GOLD_SENTINEL_INDEX, name: "Altın (GP)", quantity: node.count }];
    case "multiple": {
      const results: ResolvedEquipmentItem[] = [];
      for (const item of node.items) {
        const resolved = leafItems(item);
        if (!resolved) return null;
        results.push(...resolved);
      }
      return results;
    }
    case "choice":
      return null;
  }
}

/** Picks `choose` items (allowing duplicates) from a single equipment category via independent dropdowns. */
function CategoryPicker({
  edition,
  categoryIndex,
  choose,
  onResolve,
}: {
  edition: SrdEdition;
  categoryIndex: string;
  choose: number;
  onResolve: (items: ResolvedEquipmentItem[]) => void;
}) {
  const [items, setItems] = useState<SrdEquipment[] | null>(null);
  const [selection, setSelection] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    getEquipmentByCategory(edition, categoryIndex).then((list) => {
      if (!active) return;
      setItems(list);
      setSelection(new Array(choose).fill(list[0]?.index ?? ""));
    });
    return () => {
      active = false;
    };
  }, [edition, categoryIndex, choose]);

  useEffect(() => {
    if (!items || selection.some((s) => !s)) return;
    onResolve(
      selection.map((idx) => {
        const item = items.find((i) => i.index === idx);
        return { index: idx, name: item?.name ?? idx, quantity: 1 };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selection]);

  if (!items) return <Skeleton className="h-9 w-full" />;

  return (
    <div className="flex flex-col gap-2">
      {selection.map((val, i) => (
        <Select
          key={i}
          value={val}
          onValueChange={(v) => setSelection((prev) => prev.map((p, pi) => (pi === i ? v : p)))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.index} value={item.index}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}

function NodeResolver({
  node,
  edition,
  onResolve,
}: {
  node: OptionNode;
  edition: SrdEdition;
  onResolve: (items: ResolvedEquipmentItem[]) => void;
}) {
  const leaf = useMemo(() => leafItems(node), [node]);

  useEffect(() => {
    if (leaf) onResolve(leaf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaf]);

  if (leaf) return null;

  if (node.option_type === "choice") {
    const { choice } = node;
    if (choice.from.option_set_type === "equipment_category" && choice.from.equipment_category) {
      return (
        <CategoryPicker
          edition={edition}
          categoryIndex={choice.from.equipment_category.index}
          choose={choice.choose}
          onResolve={onResolve}
        />
      );
    }
    return null;
  }

  if (node.option_type === "multiple") {
    return (
      <MultiNodeResolver items={node.items} edition={edition} onResolve={onResolve} />
    );
  }

  return null;
}

function MultiNodeResolver({
  items,
  edition,
  onResolve,
}: {
  items: OptionNode[];
  edition: SrdEdition;
  onResolve: (items: ResolvedEquipmentItem[]) => void;
}) {
  const [resolved, setResolved] = useState<Record<number, ResolvedEquipmentItem[]>>({});

  useEffect(() => {
    if (Object.keys(resolved).length !== items.length) return;
    onResolve(items.flatMap((_, i) => resolved[i] ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);

  return (
    <div className="flex flex-col gap-2 border-l-2 border-border pl-3">
      {items.map((item, i) => (
        <NodeResolver
          key={i}
          node={item}
          edition={edition}
          onResolve={(res) => setResolved((prev) => ({ ...prev, [i]: res }))}
        />
      ))}
    </div>
  );
}

/** Renders one top-level `SrdChoice` for starting equipment and reports the fully-resolved item list. */
export function EquipmentChoiceGroup({
  choice,
  edition,
  onResolve,
}: {
  choice: SrdChoice;
  edition: SrdEdition;
  onResolve: (items: ResolvedEquipmentItem[]) => void;
}) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(choice.choose === 1 ? [0] : []);
  const [resolvedByOption, setResolvedByOption] = useState<Record<number, ResolvedEquipmentItem[]>>({});

  useEffect(() => {
    onResolve(selectedIndices.flatMap((i) => resolvedByOption[i] ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndices, resolvedByOption]);

  if (choice.from.option_set_type === "equipment_category" && choice.from.equipment_category) {
    return (
      <CategoryPicker
        edition={edition}
        categoryIndex={choice.from.equipment_category.index}
        choose={choice.choose}
        onResolve={(items) => onResolve(items)}
      />
    );
  }

  const options = (choice.from.options ?? []) as OptionNode[];

  if (choice.choose === 1) {
    return (
      <div className="flex flex-col gap-3">
        <RadioGroup
          value={String(selectedIndices[0] ?? 0)}
          onValueChange={(v) => setSelectedIndices([Number(v)])}
          className="gap-2"
        >
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <RadioGroupItem value={String(i)} id={`eq-${i}`} />
              <Label htmlFor={`eq-${i}`} className="font-normal">
                {nodeLabel(opt)}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {selectedIndices.map((i) => (
          <NodeResolver
            key={i}
            node={options[i]}
            edition={edition}
            onResolve={(items) => setResolvedByOption((prev) => ({ ...prev, [i]: items }))}
          />
        ))}
      </div>
    );
  }

  function toggle(i: number, checked: boolean) {
    if (checked) {
      if (selectedIndices.length >= choice.choose) return;
      setSelectedIndices((prev) => [...prev, i]);
    } else {
      setSelectedIndices((prev) => prev.filter((x) => x !== i));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {selectedIndices.length} / {choice.choose} seçildi
      </p>
      {options.map((opt, i) => {
        const checked = selectedIndices.includes(i);
        const disabled = !checked && selectedIndices.length >= choice.choose;
        return (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`eq-${i}`}
                checked={checked}
                disabled={disabled}
                onCheckedChange={(c) => toggle(i, c === true)}
              />
              <Label htmlFor={`eq-${i}`} className={`font-normal ${disabled ? "text-muted-foreground" : ""}`}>
                {nodeLabel(opt)}
              </Label>
            </div>
            {checked && (
              <div className="pl-6">
                <NodeResolver
                  node={opt}
                  edition={edition}
                  onResolve={(items) => setResolvedByOption((prev) => ({ ...prev, [i]: items }))}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
