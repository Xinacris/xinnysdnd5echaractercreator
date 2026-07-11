"use client";

import Link from "next/link";
import { Copy, Download, Trash2 } from "lucide-react";
import type { Character } from "@/lib/character/types";
import { totalCharacterLevel } from "@/lib/character/calculations";
import { slugToTitle } from "@/lib/slug";
import { exportCharacterToJson } from "@/lib/character/storage";
import { useContentLanguage } from "@/lib/i18n/content-language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CharacterCard({
  character,
  onDelete,
  onDuplicate,
}: {
  character: Character;
  onDelete: (id: string) => void;
  onDuplicate: (character: Character) => void;
}) {
  const { t } = useContentLanguage();

  const classSummary =
    character.classes.length > 0
      ? character.classes.map((c) => `${slugToTitle(c.classIndex)} ${c.level}`).join(" / ")
      : t("No class selected", "Sınıf seçilmedi");

  function handleExport() {
    const json = exportCharacterToJson(character);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${character.name || t("character", "karakter")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{character.name || t("Unnamed Character", "İsimsiz Karakter")}</CardTitle>
          <Badge variant="secondary">{character.edition === "2024" ? "5.5e" : "5e"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-1 text-sm text-muted-foreground">
        <div>
          {t("Level", "Seviye")} {totalCharacterLevel(character)} ·{" "}
          {slugToTitle(character.raceIndex || t("race-not-selected", "irk-seçilmedi"))}
        </div>
        <div>{classSummary}</div>
      </CardContent>
      <CardContent className="flex items-center gap-2 pt-0">
        <Button asChild size="sm" className="flex-1">
          <Link href={`/character/${character.id}`}>{t("Open", "Aç")}</Link>
        </Button>
        <Button size="icon" variant="outline" onClick={() => onDuplicate(character)} title={t("Duplicate", "Kopyala")}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={handleExport} title={t("Export (JSON)", "Dışa Aktar (JSON)")}>
          <Download className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="outline" title={t("Delete", "Sil")}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("Delete character", "Karakteri sil")}</AlertDialogTitle>
              <AlertDialogDescription>
                &quot;{character.name || t("Unnamed Character", "İsimsiz Karakter")}&quot;{" "}
                {t(
                  "will be permanently deleted. This action cannot be undone.",
                  "kalıcı olarak silinecek. Bu işlem geri alınamaz."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("Cancel", "Vazgeç")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(character.id)}>{t("Delete", "Sil")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
