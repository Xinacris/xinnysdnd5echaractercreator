"use client";

import { useSrdData } from "@/hooks/use-srd-data";
import { getBackgrounds } from "@/lib/srd/loader";
import { normalizeBackground } from "@/lib/srd/background-adapter";
import { alignmentName } from "@/lib/i18n/alignments";
import { useContentLanguage } from "@/lib/i18n/content-language";
import { useWizard } from "./wizard-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const ALIGNMENT_ORDER = [
  "lawful-good",
  "neutral-good",
  "chaotic-good",
  "lawful-neutral",
  "neutral",
  "chaotic-neutral",
  "lawful-evil",
  "neutral-evil",
  "chaotic-evil",
];

export function StepBasics() {
  const { draft, update } = useWizard();
  const { t, language } = useContentLanguage();
  const backgrounds = useSrdData(() => getBackgrounds(draft.edition), [draft.edition]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="char-name">{t("Character Name", "Karakter Adı")}</Label>
          <Input
            id="char-name"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder={t("e.g. Elenwe Moonlight", "Örn. Elenwe Ay Işığı")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="char-player">{t("Player Name (optional)", "Oyuncu Adı (opsiyonel)")}</Label>
          <Input
            id="char-player"
            value={draft.playerName ?? ""}
            onChange={(e) => update({ playerName: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("Rule Set", "Kural Seti")}</Label>
        <Select
          value={draft.edition}
          onValueChange={(v: "2014" | "2024") => update({ edition: v, backgroundIndex: undefined })}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2014">D&D 5e (2014 SRD)</SelectItem>
            <SelectItem value="2024">D&D 5.5e (2024 SRD)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t("Choose which rule set to build against. Cannot be changed later.", "Hangi kural setine göre oluşturacağını seç. Sonradan değiştirilemez.")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("Alignment", "Hizalanma (Alignment)")}</Label>
        <Select value={draft.alignment ?? ""} onValueChange={(v) => update({ alignment: v })}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder={t("Select", "Seç")} />
          </SelectTrigger>
          <SelectContent>
            {ALIGNMENT_ORDER.map((a) => (
              <SelectItem key={a} value={a}>
                {alignmentName(a, language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("Background", "Geçmiş (Background)")}</Label>
        <Select
          value={draft.backgroundIndex ?? (draft.customBackgroundName !== undefined ? "custom" : "")}
          onValueChange={(v) => {
            if (v === "custom") update({ backgroundIndex: undefined, customBackgroundName: "" });
            else update({ backgroundIndex: v, customBackgroundName: undefined });
          }}
        >
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue placeholder={t("Select", "Seç")} />
          </SelectTrigger>
          <SelectContent>
            {backgrounds?.map((b) => (
              <SelectItem key={b.index} value={b.index}>
                {b.name}
              </SelectItem>
            ))}
            <SelectItem value="custom">{t("Custom background...", "Özel geçmiş...")}</SelectItem>
          </SelectContent>
        </Select>
        {draft.customBackgroundName !== undefined && (
          <Input
            className="mt-1"
            placeholder={t("Type your background's name", "Geçmişinin adını yaz")}
            value={draft.customBackgroundName}
            onChange={(e) => update({ customBackgroundName: e.target.value })}
          />
        )}
        {draft.backgroundIndex && backgrounds && (
          <Card className="mt-2">
            <CardContent className="text-sm text-muted-foreground">
              {(() => {
                const bg = backgrounds.find((b) => b.index === draft.backgroundIndex);
                if (!bg) return null;
                const normalized = normalizeBackground(bg);
                if (normalized.featureName) {
                  return (
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-foreground">{normalized.featureName}</p>
                      <p>{normalized.featureDesc?.join(" ")}</p>
                    </div>
                  );
                }
                if (normalized.grantedFeat) {
                  return (
                    <p>
                      <span className="font-medium text-foreground">{t("Starting Feat:", "Başlangıç Feat'i:")}</span>{" "}
                      {normalized.grantedFeat.name}
                    </p>
                  );
                }
                return null;
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
