"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useSrdData } from "@/hooks/use-srd-data";
import { getEquipment, getMagicItems } from "@/lib/srd/loader";
import type { Character, InventoryItem } from "@/lib/character/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function InventoryPanel({
  character,
  onUpdate,
}: {
  character: Character;
  onUpdate: (patch: Partial<Character>) => void;
}) {
  const equipment = useSrdData(() => getEquipment(character.edition), [character.edition]);
  const magicItems = useSrdData(() => getMagicItems(character.edition), [character.edition]);
  const [open, setOpen] = useState(false);

  const catalog = useMemo(
    () => [
      ...(equipment ?? []).map((e) => ({ index: e.index, name: e.name, magic: false })),
      ...(magicItems ?? []).filter((m) => !m.variant).map((m) => ({ index: m.index, name: m.name, magic: true })),
    ],
    [equipment, magicItems]
  );

  function addItem(index: string, name: string) {
    const existing = character.inventory.find((i) => i.equipmentIndex === index);
    if (existing) {
      updateItem(existing.id, { quantity: existing.quantity + 1 });
    } else {
      const item: InventoryItem = {
        id: crypto.randomUUID(),
        equipmentIndex: index,
        name,
        quantity: 1,
        equipped: false,
      };
      onUpdate({ inventory: [...character.inventory, item] });
    }
    setOpen(false);
  }

  function updateItem(id: string, patch: Partial<InventoryItem>) {
    onUpdate({ inventory: character.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  }

  function removeItem(id: string) {
    onUpdate({ inventory: character.inventory.filter((i) => i.id !== id) });
  }

  function setCurrency(key: keyof Character["currency"], value: number) {
    onUpdate({ currency: { ...character.currency, [key]: value } });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Para Birimi</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {(["pp", "gp", "ep", "sp", "cp"] as const).map((key) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <span className="text-xs uppercase text-muted-foreground">{key}</span>
              <Input
                type="number"
                value={character.currency[key]}
                onChange={(e) => setCurrency(key, Number(e.target.value) || 0)}
                className="w-20 text-center"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Envanter</CardTitle>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> Eşya Ekle
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <Command>
                <CommandInput placeholder="Eşya ara..." />
                <CommandList>
                  <CommandEmpty>Bulunamadı.</CommandEmpty>
                  <CommandGroup>
                    {catalog.slice(0, 400).map((item) => (
                      <CommandItem
                        key={item.index}
                        value={item.name}
                        onSelect={() => addItem(item.index, item.name)}
                      >
                        {item.name}
                        {item.magic && (
                          <Badge variant="secondary" className="ml-auto text-[10px]">
                            Büyülü
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {character.inventory.length === 0 && (
            <p className="text-sm text-muted-foreground">Envanterde eşya yok.</p>
          )}
          {character.inventory.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-md border border-border p-2">
              <Checkbox
                checked={item.equipped}
                onCheckedChange={(c) => updateItem(item.id, { equipped: c === true })}
                title="Kuşanılmış"
              />
              <span className="flex-1 text-sm">{item.name}</span>
              <Input
                type="number"
                min={0}
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}
                className="h-8 w-16"
              />
              <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
