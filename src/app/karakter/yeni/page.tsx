"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WizardProvider } from "@/components/character/wizard/wizard-context";
import { StepBasics } from "@/components/character/wizard/step-basics";
import { StepRace } from "@/components/character/wizard/step-race";
import { StepClass } from "@/components/character/wizard/step-class";
import { StepAbilities } from "@/components/character/wizard/step-abilities";
import { StepSkills } from "@/components/character/wizard/step-skills";
import { StepEquipment } from "@/components/character/wizard/step-equipment";
import { StepSpells } from "@/components/character/wizard/step-spells";
import { StepSummary } from "@/components/character/wizard/step-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Temel Bilgiler", Component: StepBasics },
  { title: "Irk", Component: StepRace },
  { title: "Sınıf", Component: StepClass },
  { title: "Yetenek Puanları", Component: StepAbilities },
  { title: "Beceriler", Component: StepSkills },
  { title: "Ekipman", Component: StepEquipment },
  { title: "Büyüler", Component: StepSpells },
  { title: "Özet", Component: StepSummary },
];

export default function NewCharacterPage() {
  const [step, setStep] = useState(0);
  const { title, Component } = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <WizardProvider>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setStep(i)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                i === step
                  ? "border-primary bg-primary text-primary-foreground"
                  : i < step
                    ? "border-border bg-secondary text-secondary-foreground"
                    : "border-border text-muted-foreground"
              )}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Component />
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4" />
            Geri
          </Button>
          {!isLast && (
            <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
              İleri
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </WizardProvider>
  );
}
