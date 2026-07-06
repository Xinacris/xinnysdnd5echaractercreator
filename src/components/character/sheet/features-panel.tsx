"use client";

import { useSrdData } from "@/hooks/use-srd-data";
import {
  getBackgrounds,
  getClasses,
  getFeatures,
  getRaces,
  getSubclasses,
  getSubclassChoiceLevel,
  getSubclassesForClass,
  getSubracesForRace,
  getTraits,
  subraceTraitRefs,
} from "@/lib/srd/loader";
import { normalizeBackground } from "@/lib/srd/background-adapter";
import { featureDescription, featureLevel, traitDescription } from "@/lib/srd/text";
import type { Character } from "@/lib/character/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export function FeaturesPanel({
  character,
  onUpdate,
}: {
  character: Character;
  onUpdate: (patch: Partial<Character> | ((prev: Character) => Partial<Character>)) => void;
}) {
  const races = useSrdData(() => getRaces(character.edition), [character.edition]);
  const subraces = useSrdData(
    () => (character.raceIndex ? getSubracesForRace(character.edition, character.raceIndex) : Promise.resolve([])),
    [character.edition, character.raceIndex]
  );
  const allTraits = useSrdData(() => getTraits(character.edition), [character.edition]);
  const allFeatures = useSrdData(() => getFeatures(character.edition), [character.edition]);
  const subclasses = useSrdData(() => getSubclasses(character.edition), [character.edition]);
  const backgrounds = useSrdData(() => getBackgrounds(character.edition), [character.edition]);
  const classes = useSrdData(() => getClasses(character.edition), [character.edition]);

  const classIndexKey = character.classes.map((c) => c.classIndex).join(",");
  const subclassChoiceMeta = useSrdData(
    () =>
      Promise.all(
        character.classes.map(async (c) => {
          const [level, options] = await Promise.all([
            getSubclassChoiceLevel(character.edition, c.classIndex),
            getSubclassesForClass(character.edition, c.classIndex),
          ]);
          return { classIndex: c.classIndex, level, options };
        })
      ),
    [character.edition, classIndexKey]
  );

  const pendingSubclassChoices = character.classes
    .map((c) => {
      const meta = subclassChoiceMeta?.find((m) => m.classIndex === c.classIndex);
      if (!meta || c.subclassIndex || meta.options.length === 0 || c.level < meta.level) return null;
      return { classEntry: c, options: meta.options };
    })
    .filter((x): x is { classEntry: (typeof character.classes)[number]; options: NonNullable<typeof subclassChoiceMeta>[number]["options"] } => x !== null);

  function chooseSubclass(classIndex: string, subclassIndex: string) {
    onUpdate((prev) => ({
      classes: prev.classes.map((c) => (c.classIndex === classIndex ? { ...c, subclassIndex } : c)),
    }));
  }

  const race = races?.find((r) => r.index === character.raceIndex);
  const subrace = subraces?.find((s) => s.index === character.subraceIndex);
  const background = backgrounds?.find((b) => b.index === character.backgroundIndex);
  const normalizedBg = background ? normalizeBackground(background) : undefined;

  const traitIndices = new Set<string>([
    ...(race?.traits.map((t) => t.index) ?? []),
    ...(subrace ? subraceTraitRefs(subrace).map((t) => t.index) : []),
  ]);
  const raceTraits = (allTraits ?? []).filter((t) => traitIndices.has(t.index));

  const classFeatures = (allFeatures ?? []).filter((f) =>
    character.classes.some((c) => f.class.index === c.classIndex && featureLevel(f) <= c.level && !f.subclass)
  );

  const subclassFeatures = (allFeatures ?? []).filter((f) =>
    character.classes.some((c) => f.subclass && f.subclass.index === c.subclassIndex && featureLevel(f) <= c.level)
  );

  const loading = !races || !allTraits || !allFeatures || !subclasses || !backgrounds;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Irk Özellikleri</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <Accordion type="multiple">
              {raceTraits.map((t) => (
                <AccordionItem key={t.index} value={t.index}>
                  <AccordionTrigger>{t.name}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{traitDescription(t)}</AccordionContent>
                </AccordionItem>
              ))}
              {raceTraits.length === 0 && <p className="text-sm text-muted-foreground">Özellik bulunamadı.</p>}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sınıf &amp; Alt Sınıf Özellikleri</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {pendingSubclassChoices.length > 0 && (
            <div className="flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/5 p-3">
              {pendingSubclassChoices.map(({ classEntry, options }) => {
                const className = classes?.find((c) => c.index === classEntry.classIndex)?.name ?? classEntry.classIndex;
                return (
                  <div key={classEntry.classIndex} className="flex flex-col gap-2">
                    <Label>{className} Alt Sınıfı (Seviye {classEntry.level})</Label>
                    <Select value="" onValueChange={(v) => chooseSubclass(classEntry.classIndex, v)}>
                      <SelectTrigger className="w-full sm:w-72">
                        <SelectValue placeholder="Bir alt sınıf seç" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((s) => (
                          <SelectItem key={s.index} value={s.index}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <Accordion type="multiple">
              {[...classFeatures, ...subclassFeatures]
                .sort((a, b) => featureLevel(a) - featureLevel(b))
                .map((f) => (
                  <AccordionItem key={f.index} value={f.index}>
                    <AccordionTrigger>
                      {f.name} <span className="ml-2 text-xs text-muted-foreground">Sv. {featureLevel(f)}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {featureDescription(f)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              {classFeatures.length === 0 && subclassFeatures.length === 0 && (
                <p className="text-sm text-muted-foreground">Özellik bulunamadı.</p>
              )}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Geçmiş</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {normalizedBg?.featureName && (
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">{normalizedBg.featureName}</p>
              <p>{normalizedBg.featureDesc?.join(" ")}</p>
            </div>
          )}
          {normalizedBg?.grantedFeat && (
            <p>
              <span className="font-medium text-foreground">Başlangıç Feat&apos;i:</span>{" "}
              {normalizedBg.grantedFeat.name}
            </p>
          )}
          {character.customBackgroundName && !background && <p>{character.customBackgroundName}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
