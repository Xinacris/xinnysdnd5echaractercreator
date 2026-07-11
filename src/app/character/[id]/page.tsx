"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useCharacter } from "@/hooks/use-character";
import { SheetHeader } from "@/components/character/sheet/sheet-header";
import { AbilitiesSkillsPanel } from "@/components/character/sheet/abilities-skills-panel";
import { CombatPanel } from "@/components/character/sheet/combat-panel";
import { InventoryPanel } from "@/components/character/sheet/inventory-panel";
import { SpellsPanel } from "@/components/character/sheet/spells-panel";
import { FeaturesPanel } from "@/components/character/sheet/features-panel";
import { NotesPanel } from "@/components/character/sheet/notes-panel";
import { LevelUpDialog } from "@/components/character/sheet/level-up-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useContentLanguage } from "@/lib/i18n/content-language";

export default function CharacterSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { character, update } = useCharacter(id);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const { t } = useContentLanguage();

  if (character === undefined) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="h-24 w-full" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (character === null) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-lg font-medium">{t("Character not found.", "Karakter bulunamadı.")}</p>
        <Button asChild className="mt-4">
          <Link href="/">{t("Back to home", "Ana sayfaya dön")}</Link>
        </Button>
      </div>
    );
  }

  const isCaster = character.classes.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SheetHeader character={character} onUpdate={update} onLevelUp={() => setLevelUpOpen(true)} />

      <Tabs defaultValue="genel" className="mt-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="genel">{t("Overview", "Genel Bakış")}</TabsTrigger>
          <TabsTrigger value="envanter">{t("Inventory", "Envanter")}</TabsTrigger>
          {isCaster && <TabsTrigger value="buyuler">{t("Spells", "Büyüler")}</TabsTrigger>}
          <TabsTrigger value="ozellikler">{t("Features", "Özellikler")}</TabsTrigger>
          <TabsTrigger value="notlar">{t("Notes", "Notlar")}</TabsTrigger>
        </TabsList>

        <TabsContent value="genel" className="mt-4 flex flex-col gap-4">
          <CombatPanel character={character} onUpdate={update} />
          <AbilitiesSkillsPanel character={character} onUpdate={update} />
        </TabsContent>

        <TabsContent value="envanter" className="mt-4">
          <InventoryPanel character={character} onUpdate={update} />
        </TabsContent>

        {isCaster && (
          <TabsContent value="buyuler" className="mt-4">
            <SpellsPanel character={character} onUpdate={update} />
          </TabsContent>
        )}

        <TabsContent value="ozellikler" className="mt-4">
          <FeaturesPanel character={character} onUpdate={update} />
        </TabsContent>

        <TabsContent value="notlar" className="mt-4">
          <NotesPanel character={character} onUpdate={update} />
        </TabsContent>
      </Tabs>

      <LevelUpDialog
        character={character}
        open={levelUpOpen}
        onOpenChange={setLevelUpOpen}
        onConfirm={update}
      />
    </div>
  );
}
